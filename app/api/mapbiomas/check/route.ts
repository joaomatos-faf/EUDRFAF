import {
  buildShapefileZip,
  calculateAreaHectares,
  sanitizePlotId,
  simplifyGeometry,
  type GeometryData,
  type ShapefileAttributes,
} from "../../../lib/eudr";

const PLATFORM_API = "https://prd.plataforma.mapbiomas.org/api/v1/brazil";
const START_YEAR = 2020;
const END_YEAR = 2024;
const MAX_POINTS = 100_000;
const COVERAGE_PIXEL_VALUES = [
  3, 49, 6, 5, 4, 12, 50, 11, 29, 32, 48, 46, 47, 35, 40, 39, 20, 62,
  41, 9, 21, 15, 75, 25, 30, 23, 24, 33, 31,
];
const COVERAGE_CLASS_NAMES: Record<number, string> = {
  3: "Formação Florestal",
  49: "Restinga Arbórea",
  6: "Floresta Alagável",
  5: "Mangue",
  4: "Formação Savânica",
  12: "Formação Campestre",
  50: "Restinga Herbácea",
  11: "Campo Alagado e Área Pantanosa",
  29: "Afloramento Rochoso",
  32: "Apicum",
  48: "Outras Lavouras Perenes",
  46: "Café",
  47: "Citrus",
  35: "Dendê",
  40: "Arroz",
  39: "Soja",
  20: "Cana",
  62: "Algodão",
  41: "Outras Lavouras Temporárias",
  9: "Silvicultura",
  21: "Mosaico de Usos",
  15: "Pastagem",
  75: "Usina Fotovoltaica",
  25: "Outras Áreas não Vegetadas",
  30: "Mineração",
  23: "Praia, Duna e Areal",
  24: "Área Urbanizada",
  33: "Rio, Lago e Oceano",
  31: "Aquicultura",
};

type UploadResponse = {
  territory?: {
    id?: string;
    categoryId?: number;
    territoryCategoryId?: number;
    category?: { id?: number };
  };
};

type StatisticsResponse = {
  taskID?: string | string[];
  unit?: string;
  statistic?: Array<{
    year?: number | number[];
    total?: number;
    items?: Array<{ pixelValue?: number; value?: number }>;
  }>;
};

function responseError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function publicApi<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...init?.headers,
      },
    });
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
    if (!response.ok) {
      const apiMessage = typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message)
        : "";
      throw new Error(apiMessage || `A plataforma MapBiomas respondeu com erro ${response.status}.`);
    }
    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

function validateGeometry(value: unknown): GeometryData {
  let geometry = value as GeometryData;
  if (!geometry || !Array.isArray(geometry.polygons) || geometry.polygons.length === 0) {
    throw new Error("Envie primeiro um polígono válido.");
  }
  let points = 0;
  geometry.polygons.forEach((polygon) => {
    if (!Array.isArray(polygon) || polygon.length === 0) throw new Error("Polígono inválido.");
    polygon.forEach((ring) => {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error("Anel de polígono inválido.");
      ring.forEach((position) => {
        if (!Array.isArray(position) || position.length < 2) throw new Error("Coordenada inválida.");
        const [longitude, latitude] = position;
        points += 1;
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
          throw new Error("A geometria contém coordenadas fora do WGS 84.");
        }
      });
    });
  });
  if (points > MAX_POINTS) {
    geometry = simplifyGeometry(geometry, MAX_POINTS, 0.0001);
  }
  return geometry;
}

function validateDetails(value: unknown) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const text = (field: string) => String(input[field] ?? "").trim().slice(0, 120);
  const plotId = sanitizePlotId(text("plotId"));
  const attributes: ShapefileAttributes = {
    farm: text("farm"),
    producer: text("producer"),
    supplier: text("supplier"),
    region: text("region"),
    municipality: text("municipality"),
    state: text("state"),
    mappedAt: text("mappedAt"),
    checkedAt: text("checkedAt"),
    compliance: text("compliance"),
    mappedBy: text("mappedBy"),
    car: text("car"),
  };
  if (!plotId || !attributes.supplier || !attributes.municipality || !attributes.state || !attributes.mappedBy) {
    throw new Error("Preencha o código do talhão, fornecedor, município, estado e responsável pelo mapeamento antes da consulta.");
  }
  return { plotId, attributes };
}

async function uploadGeometry(
  geometry: GeometryData,
  plotId: string,
  attributes: ShapefileAttributes,
) {
  const area = calculateAreaHectares(geometry);
  const shapefile = buildShapefileZip(geometry, plotId, area, attributes);
  const form = new FormData();
  form.append("file", shapefile, `${plotId}-mapbiomas.zip`);
  const uploaded = await publicApi<UploadResponse>(`${PLATFORM_API}/territories/upload`, {
    method: "POST",
    body: form,
  });
  const territoryId = uploaded.territory?.id;
  if (!territoryId) throw new Error("O MapBiomas não reconheceu a geometria enviada.");
  const categoryId = uploaded.territory?.territoryCategoryId
    ?? uploaded.territory?.categoryId
    ?? uploaded.territory?.category?.id;
  return { territoryId, categoryId };
}

function statisticsUrl(territoryId: string, categoryId?: number) {
  const url = new URL(`${PLATFORM_API}/statistics/area`);
  url.searchParams.append("territoryId", territoryId);
  url.searchParams.append("spatialMethod", "union");
  url.searchParams.append("subthemeKey", "coverage_lclu");
  url.searchParams.append("legendKey", "default");
  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    url.searchParams.append("year", String(year));
  }
  COVERAGE_PIXEL_VALUES.forEach((value) => url.searchParams.append("pixelValue", String(value)));
  url.searchParams.append("propertyCode", "");
  if (categoryId !== undefined) url.searchParams.append("territoryCategoryId", String(categoryId));
  return url.toString();
}

function verificationUrl(territoryId: string) {
  const url = new URL(
    "https://plataforma.brasil.mapbiomas.org/coverage/coverage_lclu",
  );
  url.searchParams.append("tl[id]", "1");
  url.searchParams.append("tl[themeKey]", "coverage");
  url.searchParams.append("tl[subthemeKey]", "coverage_lclu");
  COVERAGE_PIXEL_VALUES.forEach((value) => url.searchParams.append("tl[pixelValues][]", String(value)));
  url.searchParams.append("tl[legendKey]", "default");
  url.searchParams.append("tl[year]", String(END_YEAR));
  url.searchParams.append("t[regionKey]", "brazil");
  url.searchParams.append("t[ids][]", territoryId);
  url.searchParams.append("t[divisionCategoryId]", "4");
  return url.toString();
}

function taskId(result: StatisticsResponse) {
  return Array.isArray(result.taskID) ? result.taskID[0] : result.taskID;
}

async function waitForStatistics(url: string) {
  let result = await publicApi<StatisticsResponse>(url);
  let pendingTask = taskId(result);
  for (let attempt = 0; pendingTask && attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    const task = await publicApi<{ status?: string; message?: string }>(
      `${PLATFORM_API}/statistics/task/${encodeURIComponent(pendingTask)}`,
    );
    if (/fail|error|cancel/i.test(task.status ?? "")) {
      throw new Error(task.message || "A análise do MapBiomas não pôde ser concluída.");
    }
    result = await publicApi<StatisticsResponse>(url);
    pendingTask = taskId(result);
  }
  if (pendingTask) throw new Error("A análise do MapBiomas demorou mais do que o esperado. Tente novamente.");
  return result;
}

function compareCoverageSeries(result: StatisticsResponse) {
  const byYear = new Map<number, NonNullable<StatisticsResponse["statistic"]>[number]>();
  result.statistic?.forEach((item) => {
    const year = Array.isArray(item.year) ? item.year[0] : item.year;
    if (typeof year === "number") byYear.set(year, item);
  });
  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    if (!byYear.has(year)) throw new Error(`O MapBiomas não retornou os dados de cobertura de ${year}.`);
  }

  const rounded = (value: number | undefined) => Number((value ?? 0).toFixed(2));
  const changes: Array<{
    fromYear: number;
    toYear: number;
    pixelValue: number;
    className: string;
    fromHa: number;
    toHa: number;
  }> = [];
  for (let year = START_YEAR + 1; year <= END_YEAR; year += 1) {
    const previous = byYear.get(year - 1);
    const current = byYear.get(year);
    COVERAGE_PIXEL_VALUES.forEach((pixelValue) => {
      const fromHa = rounded(previous?.items?.find((item) => item.pixelValue === pixelValue)?.value);
      const toHa = rounded(current?.items?.find((item) => item.pixelValue === pixelValue)?.value);
      if (fromHa !== toHa) {
        changes.push({
          fromYear: year - 1,
          toYear: year,
          pixelValue,
          className: COVERAGE_CLASS_NAMES[pixelValue] ?? `Classe ${pixelValue}`,
          fromHa,
          toHa,
        });
      }
    });
  }
  return {
    changes,
    areaHa: Number((byYear.get(END_YEAR)?.total ?? 0).toFixed(4)),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { geometry?: unknown; details?: unknown };
    const geometry = validateGeometry(body.geometry);
    const { plotId, attributes } = validateDetails(body.details);
    const { territoryId, categoryId } = await uploadGeometry(geometry, plotId, attributes);
    const statistics = await waitForStatistics(statisticsUrl(territoryId, categoryId));
    const coverage = compareCoverageSeries(statistics);
    return Response.json({
      areaHa: coverage.areaHa,
      hasChanges: coverage.changes.length > 0,
      changes: coverage.changes,
      checkedAt: new Date().toISOString(),
      startYear: START_YEAR,
      endYear: END_YEAR,
      resolutionMeters: 30,
      collection: "10.1",
      source: "MapBiomas · Série temporal de Cobertura por classe",
      verificationUrl: verificationUrl(territoryId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar o MapBiomas.";
    return responseError(message, 502);
  }
}
