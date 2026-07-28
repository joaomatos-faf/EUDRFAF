export type Position = [number, number];
export type PolygonCoordinates = Position[][];
export type GeometryData = { polygons: PolygonCoordinates[] };
export type ShapefileAttributes = {
  farm?: string;
  producer?: string;
  supplier?: string;
  region?: string;
  municipality?: string;
  state?: string;
  mappedAt?: string;
  checkedAt?: string;
  compliance?: string;
  mappedBy?: string;
  car?: string;
};

const encoder = new TextEncoder();

function closeRing(ring: Position[]): Position[] {
  if (ring.length < 3) throw new Error("O polígono precisa ter pelo menos três pontos.");
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, [...first] as Position];
}

function coordinatesFromText(text: string): Position[] {
  const points = text
    .trim()
    .split(/\s+/)
    .map((item) => item.split(",").slice(0, 2).map(Number) as Position)
    .filter(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude));
  return closeRing(points);
}

function parseKml(text: string): GeometryData {
  const xml = new DOMParser().parseFromString(text, "application/xml");
  if (xml.querySelector("parsererror")) throw new Error("O KML está inválido ou corrompido.");
  const polygons = Array.from(xml.getElementsByTagName("Polygon")).map((polygon) => {
    const outer = polygon.getElementsByTagName("outerBoundaryIs")[0]?.getElementsByTagName("coordinates")[0]?.textContent;
    if (!outer) throw new Error("Foi encontrado um polígono sem limite externo.");
    const holes = Array.from(polygon.getElementsByTagName("innerBoundaryIs")).map((boundary) => {
      const content = boundary.getElementsByTagName("coordinates")[0]?.textContent;
      if (!content) throw new Error("Foi encontrado um limite interno inválido.");
      return coordinatesFromText(content);
    });
    return [coordinatesFromText(outer), ...holes];
  });
  if (!polygons.length) throw new Error("Nenhum polígono foi encontrado no KML.");
  return { polygons };
}

function parseGeoJson(text: string): GeometryData {
  const document = JSON.parse(text);
  const geometries = document.type === "FeatureCollection"
    ? document.features.map((feature: { geometry: unknown }) => feature.geometry)
    : document.type === "Feature"
      ? [document.geometry]
      : [document];
  const polygons: PolygonCoordinates[] = [];
  geometries.forEach((geometry: { type?: string; coordinates?: unknown }) => {
    if (geometry?.type === "Polygon") polygons.push(geometry.coordinates as PolygonCoordinates);
    if (geometry?.type === "MultiPolygon") polygons.push(...(geometry.coordinates as PolygonCoordinates[]));
  });
  if (!polygons.length) throw new Error("O GeoJSON não contém Polygon ou MultiPolygon.");
  return { polygons: polygons.map((polygon) => polygon.map((ring) => closeRing(ring.map(([x, y]) => [Number(x), Number(y)])))) };
}

export async function parseGeometryFile(file: File): Promise<GeometryData> {
  const text = await file.text();
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".kml")) return parseKml(text);
  if (lower.endsWith(".json") || lower.endsWith(".geojson")) return parseGeoJson(text);
  throw new Error("Selecione um arquivo .kml, .geojson ou .json.");
}

function ringArea(ring: Position[]): number {
  const radius = 6378137;
  let total = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    const lonDelta = ((next[0] - current[0]) * Math.PI) / 180;
    const lat1 = (current[1] * Math.PI) / 180;
    const lat2 = (next[1] * Math.PI) / 180;
    total += lonDelta * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((total * radius * radius) / 2);
}

export function calculateAreaHectares(data: GeometryData): number {
  const squareMeters = data.polygons.reduce((sum, polygon) => {
    const outer = ringArea(polygon[0]);
    const holes = polygon.slice(1).reduce((holeSum, ring) => holeSum + ringArea(ring), 0);
    return sum + Math.max(0, outer - holes);
  }, 0);
  return squareMeters / 10000;
}

export function sanitizePlotId(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").replace(/-+/g, "-");
}

export function buildEudrGeoJson(data: GeometryData, plotId: string, area: number) {
  const geometry = data.polygons.length === 1
    ? { type: "Polygon", coordinates: data.polygons[0] }
    : { type: "MultiPolygon", coordinates: data.polygons };
  return {
    type: "FeatureCollection",
    name: plotId,
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    features: [{ type: "Feature", properties: { name: plotId, area: Number(area.toFixed(4)), productioncountry: "BR" }, geometry }],
  };
}

function setAscii(view: DataView, offset: number, value: string, length: number) {
  for (let index = 0; index < length; index += 1) view.setUint8(offset + index, value.charCodeAt(index) || 0);
}

function planarSignedArea(ring: Position[]) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return area / 2;
}

function orientRing(ring: Position[], clockwise: boolean) {
  const isClockwise = planarSignedArea(ring) < 0;
  return isClockwise === clockwise ? ring : [...ring].reverse();
}

function createShapeFiles(data: GeometryData) {
  const parts: Position[][] = [];
  data.polygons.forEach((polygon) => polygon.forEach((ring, index) => parts.push(orientRing(ring, index === 0))));
  const points = parts.flat();
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const contentBytes = 44 + parts.length * 4 + points.length * 16;
  const shpBytes = 100 + 8 + contentBytes;
  const shp = new ArrayBuffer(shpBytes);
  const shpView = new DataView(shp);
  const writeHeader = (view: DataView, fileBytes: number) => {
    view.setInt32(0, 9994, false);
    view.setInt32(24, fileBytes / 2, false);
    view.setInt32(28, 1000, true);
    view.setInt32(32, 5, true);
    bounds.forEach((value, index) => view.setFloat64(36 + index * 8, value, true));
  };
  writeHeader(shpView, shpBytes);
  shpView.setInt32(100, 1, false);
  shpView.setInt32(104, contentBytes / 2, false);
  shpView.setInt32(108, 5, true);
  bounds.forEach((value, index) => shpView.setFloat64(112 + index * 8, value, true));
  shpView.setInt32(144, parts.length, true);
  shpView.setInt32(148, points.length, true);
  let pointIndex = 0;
  parts.forEach((part, index) => {
    shpView.setInt32(152 + index * 4, pointIndex, true);
    pointIndex += part.length;
  });
  let pointOffset = 152 + parts.length * 4;
  points.forEach(([x, y]) => {
    shpView.setFloat64(pointOffset, x, true);
    shpView.setFloat64(pointOffset + 8, y, true);
    pointOffset += 16;
  });

  const shx = new ArrayBuffer(108);
  const shxView = new DataView(shx);
  writeHeader(shxView, 108);
  shxView.setInt32(100, 50, false);
  shxView.setInt32(104, contentBytes / 2, false);
  return { shp: new Uint8Array(shp), shx: new Uint8Array(shx) };
}

function dbfText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function createDbf(plotId: string, area: number, attributes: ShapefileAttributes = {}) {
  const fields = [
    { name: "PLOT_ID", type: "C", length: 40, decimals: 0, value: plotId },
    { name: "FARM", type: "C", length: 80, decimals: 0, value: attributes.farm },
    { name: "PRODUCER", type: "C", length: 80, decimals: 0, value: attributes.producer },
    { name: "SUPPLIER", type: "C", length: 80, decimals: 0, value: attributes.supplier },
    { name: "REGION", type: "C", length: 60, decimals: 0, value: attributes.region },
    { name: "MUNICIPAL", type: "C", length: 60, decimals: 0, value: attributes.municipality },
    { name: "STATE", type: "C", length: 40, decimals: 0, value: attributes.state },
    { name: "AREA_HA", type: "N", length: 14, decimals: 4, value: area.toFixed(4) },
    { name: "MAP_DATE", type: "C", length: 10, decimals: 0, value: attributes.mappedAt },
    { name: "CHECK_DATE", type: "C", length: 10, decimals: 0, value: attributes.checkedAt },
    { name: "RESULT", type: "C", length: 30, decimals: 0, value: attributes.compliance },
    { name: "MAPPED_BY", type: "C", length: 80, decimals: 0, value: attributes.mappedBy },
    { name: "CAR", type: "C", length: 80, decimals: 0, value: attributes.car },
    { name: "COUNTRY", type: "C", length: 2, decimals: 0, value: "BR" },
  ];
  const headerLength = 32 + fields.length * 32 + 1;
  const recordLength = 1 + fields.reduce((sum, field) => sum + field.length, 0);
  const buffer = new ArrayBuffer(headerLength + recordLength + 1);
  const view = new DataView(buffer);
  const date = new Date();
  view.setUint8(0, 3);
  view.setUint8(1, date.getFullYear() - 1900);
  view.setUint8(2, date.getMonth() + 1);
  view.setUint8(3, date.getDate());
  view.setUint32(4, 1, true);
  view.setUint16(8, headerLength, true);
  view.setUint16(10, recordLength, true);
  fields.forEach((field, index) => {
    const offset = 32 + index * 32;
    setAscii(view, offset, field.name, 11);
    view.setUint8(offset + 11, field.type.charCodeAt(0));
    view.setUint8(offset + 16, field.length);
    view.setUint8(offset + 17, field.decimals);
  });
  view.setUint8(headerLength - 1, 13);
  view.setUint8(headerLength, 32);
  let offset = headerLength + 1;
  fields.forEach((field) => {
    const formatted = field.type === "N"
      ? String(field.value).padStart(field.length, " ")
      : dbfText(field.value).slice(0, field.length).padEnd(field.length, " ");
    setAscii(view, offset, formatted, field.length);
    offset += field.length;
  });
  view.setUint8(headerLength + recordLength, 26);
  return new Uint8Array(buffer);
}

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  bytes.forEach((byte) => { crc = (crcTable as Uint32Array)[(crc ^ byte) & 0xff] ^ (crc >>> 8); });
  return (crc ^ 0xffffffff) >>> 0;
}

export function zipStore(files: { name: string; data: Uint8Array }[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  files.forEach(({ name, data }) => {
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    offset += local.length;
  });
  const centralLength = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralLength, true);
  endView.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

export function buildShapefileParts(
  data: GeometryData,
  plotId: string,
  area: number,
  attributes: ShapefileAttributes = {},
) {
  const { shp, shx } = createShapeFiles(data);
  const prj = encoder.encode('GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]]');
  const cpg = encoder.encode("UTF-8");
  return [
    { name: `${plotId}.shp`, data: shp },
    { name: `${plotId}.shx`, data: shx },
    { name: `${plotId}.dbf`, data: createDbf(plotId, area, attributes) },
    { name: `${plotId}.prj`, data: prj },
    { name: `${plotId}.cpg`, data: cpg },
  ];
}

export function buildShapefileZip(
  data: GeometryData,
  plotId: string,
  area: number,
  attributes: ShapefileAttributes = {},
) {
  return zipStore(buildShapefileParts(data, plotId, area, attributes));
}

function csvCell(value: string | number) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function displayDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function producerCsv(form: Record<string, string | number>) {
  const headers = ["Plot ID", "Nome da fazenda", "Nome do produtor", "Fornecedor", "Região", "Município", "Estado", "Área (ha)", "Data do mapeamento", "Data da verificação", "Conformidade", "Observações", "Mapeado por", "Número do CAR"];
  const row = [form.plotId, form.farm || "NA", form.producer || "NA", form.supplier, form.region, form.municipality, form.state, Number(form.area).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }), displayDate(String(form.mappedAt)), displayDate(String(form.checkedAt)), form.compliance, form.notes, form.mappedBy, form.car];
  return `\uFEFF${headers.map(csvCell).join(";")}\r\n${row.map(csvCell).join(";")}\r\n`;
}

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
