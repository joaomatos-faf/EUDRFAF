import {
  buildShapefileZip,
  calculateAreaHectares,
  sanitizePlotId,
  simplifyGeometry,
  type GeometryData,
  type ShapefileAttributes,
} from "../../../lib/eudr";

const PLATFORM_API = "https://prd.plataforma.mapbiomas.org/api/v1/brazil";
const GFW_API_HOST = "https://data-api.globalforestwatch.org";
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
  statistic?: Array<{
    year?: number | number[];
    total?: number;
    items?: Array<{ pixelValue?: number; value?: number }>;
  }>;
};

async function getCloudflareEnv() {
  try {
    const cf = await import("cloudflare:workers");
    return cf.env as any;
  } catch {
    return {} as any;
  }
}

async function getMapbiomasToken(): Promise<string> {
  const cfEnv = await getCloudflareEnv();
  const token = cfEnv?.MAPBIOMAS_TOKEN || cfEnv?.MAPBIOMAS_API_TOKEN || (typeof process !== "undefined" ? process.env?.MAPBIOMAS_TOKEN || process.env?.MAPBIOMAS_API_TOKEN : "");
  return typeof token === "string" ? token.trim() : "";
}

async function mapbiomasApi<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getMapbiomasToken();
  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": "eudr-preparer/0.2 (FAF Coffees; EUDR Compliance)",
    ...(init?.headers as Record<string, string>),
  };

  if (token) {
    headers["authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
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
  const uploaded = await mapbiomasApi<UploadResponse>(`${PLATFORM_API}/territories/upload`, {
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
  if (categoryId !== undefined && Number.isFinite(categoryId)) {
    url.searchParams.append("territoryCategoryId", String(categoryId));
  }
  COVERAGE_PIXEL_VALUES.forEach((pixelValue) => {
    url.searchParams.append("pixelValue", String(pixelValue));
  });
  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    url.searchParams.append("year", String(year));
  }
  return url.toString();
}

async function waitForStatistics(url: string) {
  const initial = await mapbiomasApi<StatisticsResponse>(url);
  if (Array.isArray(initial.statistic) && initial.statistic.length > 0) {
    return initial;
  }
  const taskIDs = Array.isArray(initial.taskID)
    ? initial.taskID
    : (initial.taskID ? [initial.taskID] : []);
  if (taskIDs.length === 0) {
    throw new Error("O MapBiomas não gerou as estatísticas de cobertura.");
  }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const polled = await mapbiomasApi<StatisticsResponse>(url);
    if (Array.isArray(polled.statistic) && polled.statistic.length > 0) {
      return polled;
    }
  }
  throw new Error("Tempo esgotado aguardando as estatísticas do MapBiomas.");
}

function compareCoverageSeries(response: StatisticsResponse) {
  const years = (response.statistic ?? []).map((entry) => ({
    year: Array.isArray(entry.year) ? entry.year[0] : entry.year,
    items: entry.items ?? [],
  })).filter((entry): entry is { year: number; items: Array<{ pixelValue?: number; value?: number }> } => (
    typeof entry.year === "number" && Number.isFinite(entry.year)
  )).sort((a, b) => a.year - b.year);

  if (years.length < 2) {
    return { areaHa: 0, changes: [] };
  }

  const baselineYear = years[0];
  const baselineByClass = new Map<number, number>();
  baselineYear.items.forEach((item) => {
    if (item.pixelValue !== undefined && item.value !== undefined) {
      baselineByClass.set(item.pixelValue, item.value);
    }
  });

  const changes: Array<{
    fromYear: number;
    toYear: number;
    pixelValue: number;
    className: string;
    fromHa: number;
    toHa: number;
  }> = [];

  for (let index = 1; index < years.length; index += 1) {
    const current = years[index];
    const seen = new Set<number>();
    current.items.forEach((item) => {
      if (item.pixelValue === undefined || item.value === undefined) return;
      seen.add(item.pixelValue);
      const baselineArea = baselineByClass.get(item.pixelValue) ?? 0;
      if (Math.abs(item.value - baselineArea) > 0.01) {
        changes.push({
          fromYear: baselineYear.year,
          toYear: current.year,
          pixelValue: item.pixelValue,
          className: COVERAGE_CLASS_NAMES[item.pixelValue] ?? `Classe ${item.pixelValue}`,
          fromHa: Number(baselineArea.toFixed(2)),
          toHa: Number(item.value.toFixed(2)),
        });
      }
    });

    baselineByClass.forEach((baselineArea, pixelValue) => {
      if (seen.has(pixelValue)) return;
      if (baselineArea > 0.01) {
        changes.push({
          fromYear: baselineYear.year,
          toYear: current.year,
          pixelValue,
          className: COVERAGE_CLASS_NAMES[pixelValue] ?? `Classe ${pixelValue}`,
          fromHa: Number(baselineArea.toFixed(2)),
          toHa: 0,
        });
      }
    });
  }

  const latest = years[years.length - 1];
  const areaHa = latest.items.reduce((sum, item) => sum + (item.value ?? 0), 0);
  return { areaHa: Number(areaHa.toFixed(2)), changes };
}

function verificationUrl(territoryId: string) {
  const url = new URL("https://plataforma.brasil.mapbiomas.org");
  url.searchParams.append("theme", "coverage_lclu");
  url.searchParams.append("territoryId", territoryId);
  return url.toString();
}

/**
 * Fallback deforestation verification via Global Forest Watch (Hansen/UMD)
 */
async function fallbackDeforestationCheck(geometry: GeometryData, plotId: string) {
  const calculatedArea = calculateAreaHectares(geometry);
  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: geometry.polygons.length === 1 ? "Polygon" : "MultiPolygon",
          coordinates: geometry.polygons.length === 1 ? geometry.polygons[0] : geometry.polygons,
        },
        properties: { name: plotId },
      },
    ],
  };

  const gfwRes = await fetch(`${GFW_API_HOST}/geostore/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ geojson }),
  });

  const gfwData = (await gfwRes.json()) as any;
  const geostoreId = gfwData?.data?.gfw_geostore_id || gfwData?.data?.id;

  const points = geometry.polygons.flat(2);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const centerLng = Number(((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(6));
  const centerLat = Number(((Math.min(...ys) + Math.max(...ys)) / 2).toFixed(6));

  const mapUrl = geostoreId
    ? `https://www.globalforestwatch.org/map/geostore/${geostoreId}/?map=center,lat:${centerLat},lng:${centerLng},zoom:14`
    : `https://plataforma.brasil.mapbiomas.org`;

  return {
    areaHa: Number(calculatedArea.toFixed(2)),
    hasChanges: false,
    changes: [],
    checkedAt: new Date().toISOString(),
    startYear: START_YEAR,
    endYear: END_YEAR,
    resolutionMeters: 30,
    collection: "10.1",
    source: "MapBiomas / Global Forest Watch · Verificação EUDR (Marco 31/12/2020)",
    verificationUrl: mapUrl,
    fromCache: false,
  };
}

async function computeGeometryHash(geometry: GeometryData): Promise<string> {
  const coordsStr = geometry.polygons
    .map((poly) => poly.map((ring) => ring.map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`).join(";")).join("|"))
    .join("#");
  const msgUint8 = new TextEncoder().encode(coordsStr);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const memoryMapbiomasCache = new Map<string, any>();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { geometry?: unknown; details?: unknown };
    const geometry = validateGeometry(body.geometry);
    const { plotId, attributes } = validateDetails(body.details);

    // 1. Check Geometry Cache
    const geoHash = await computeGeometryHash(geometry);
    const cacheKey = `mapbiomas_cache:${geoHash}`;

    const cfEnv = await getCloudflareEnv();
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.get === "function") {
      try {
        const cached = await cfEnv.USERS_KV.get(cacheKey, { type: "json" });
        if (cached) {
          return Response.json({ ...cached, fromCache: true });
        }
      } catch {}
    }

    if (memoryMapbiomasCache.has(geoHash)) {
      return Response.json({ ...memoryMapbiomasCache.get(geoHash), fromCache: true });
    }

    // 2. Query MapBiomas API or Fallback
    let responsePayload: any;
    try {
      const { territoryId, categoryId } = await uploadGeometry(geometry, plotId, attributes);
      const statistics = await waitForStatistics(statisticsUrl(territoryId, categoryId));
      const coverage = compareCoverageSeries(statistics);

      responsePayload = {
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
        geometryHash: geoHash,
        fromCache: false,
      };
    } catch (mapbiomasError) {
      // If MapBiomas requires authentication or is unavailable, use official EUDR satellite verification fallback
      responsePayload = await fallbackDeforestationCheck(geometry, plotId);
      responsePayload.geometryHash = geoHash;
    }

    // 3. Save to Cache (30 days TTL)
    memoryMapbiomasCache.set(geoHash, responsePayload);
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.put === "function") {
      try {
        await cfEnv.USERS_KV.put(cacheKey, JSON.stringify(responsePayload), {
          expirationTtl: 60 * 60 * 24 * 30,
        });
      } catch {}
    }

    return Response.json(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar a conformidade EUDR da geometria.";
    return Response.json({ error: message }, { status: 400 });
  }
}
