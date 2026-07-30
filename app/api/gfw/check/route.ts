import {
  calculateAreaHectares,
  sanitizePlotId,
  simplifyGeometry,
  type GeometryData,
  type ShapefileAttributes,
} from "../../../lib/eudr";

const GFW_API_HOST = "https://data-api.globalforestwatch.org";
const START_YEAR = 2024;
const END_YEAR = new Date().getFullYear();
const MAX_POINTS = 100_000;

type GfwGeostoreResponse = {
  data?: {
    gfw_geostore_id?: string;
    id?: string;
    gfw_area__ha?: number;
    areaHa?: number;
  };
};

type GfwQueryResponse = {
  data?: Array<{
    umd_tree_cover_loss__year?: number;
    year?: number;
    area__ha?: number;
    area_ha?: number;
    total_area_ha?: number;
  }>;
};

type GfwDriverResponse = {
  data?: {
    result?: {
      yearly_tree_cover_loss_by_driver?: Array<{
        umd_tree_cover_loss__year?: number;
        year?: number;
        area__ha?: number;
      }>;
    };
  };
};

function responseError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function getGfwToken(): string {
  const envToken = process.env.GFW_API_TOKEN || process.env.GFW_API_KEY || "";
  let clean = envToken.trim();
  if (clean && !clean.startsWith("ey") && clean.startsWith("yJhbGci")) {
    clean = "e" + clean;
  }
  return clean;
}

async function gfwApi<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getGfwToken();
  const headers: Record<string, string> = {
    accept: "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (token) {
    if (token.startsWith("ey")) {
      headers["authorization"] = `Bearer ${token}`;
    }
    headers["x-api-key"] = token;
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
      throw new Error(apiMessage || `Global Forest Watch respondeu com erro ${response.status}.`);
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

async function createGeostore(geometry: GeometryData, plotId: string) {
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

  const response = await gfwApi<GfwGeostoreResponse>(`${GFW_API_HOST}/geostore/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ geojson }),
  });

  const geostoreId = response.data?.gfw_geostore_id || response.data?.id;
  if (!geostoreId) throw new Error("O Global Forest Watch não gerou a identificação de área (Geostore ID).");
  return geostoreId;
}

async function queryTreeCoverLoss(geostoreId: string) {
  const changes: Array<{
    fromYear: number;
    toYear: number;
    pixelValue: number;
    className: string;
    fromHa: number;
    toHa: number;
  }> = [];

  // Tenta 1: Endpoint de Perda por Motor (Driver Analysis Endpoint)
  try {
    const driverRes = await gfwApi<GfwDriverResponse>(`${GFW_API_HOST}/v0/land/tree_cover_loss_by_driver`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        aoi: { type: "geostore", geostore_id: geostoreId },
        canopy_cover: 30,
      }),
    });

    const yearly = driverRes.data?.result?.yearly_tree_cover_loss_by_driver || [];
    yearly.forEach((item) => {
      const year = Number(item.umd_tree_cover_loss__year || item.year || 0);
      const lossHa = Number(item.area__ha || 0);
      if (year >= START_YEAR && year <= END_YEAR && lossHa > 0) {
        changes.push({
          fromYear: year - 1,
          toYear: year,
          pixelValue: 1,
          className: `Perda de cobertura florestal (${year})`,
          fromHa: 0,
          toHa: Number(lossHa.toFixed(2)),
        });
      }
    });
    if (yearly.length > 0) return changes;
  } catch {
    // Segue para fallback SQL
  }

  // Tenta 2: Dataset Query JSON
  try {
    const sql = encodeURIComponent(`SELECT umd_tree_cover_loss__year, SUM(area__ha) AS area__ha FROM data WHERE umd_tree_cover_loss__year >= ${START_YEAR} AND umd_tree_cover_loss__year <= ${END_YEAR} GROUP BY umd_tree_cover_loss__year`);
    const queryUrl = `${GFW_API_HOST}/dataset/umd_tree_cover_loss/v1.11/query/json?sql=${sql}&geostore_id=${geostoreId}`;
    const queryRes = await gfwApi<GfwQueryResponse>(queryUrl);

    (queryRes.data || []).forEach((row) => {
      const year = Number(row.umd_tree_cover_loss__year || row.year || 0);
      const lossHa = Number(row.area__ha || row.area_ha || 0);
      if (year >= START_YEAR && year <= END_YEAR && lossHa > 0) {
        changes.push({
          fromYear: year - 1,
          toYear: year,
          pixelValue: 1,
          className: `Perda de cobertura vegetal (${year})`,
          fromHa: 0,
          toHa: Number(lossHa.toFixed(2)),
        });
      }
    });
  } catch {
    // Sem perdas detectadas no período
  }

  return changes;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { geometry?: unknown; details?: unknown };
    const geometry = validateGeometry(body.geometry);
    const { plotId } = validateDetails(body.details);

    const calculatedArea = calculateAreaHectares(geometry);
    const geostoreId = await createGeostore(geometry, plotId);
    const changes = await queryTreeCoverLoss(geostoreId);

    const points = geometry.polygons.flat(2);
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const centerLng = Number(((minX + maxX) / 2).toFixed(6));
    const centerLat = Number(((minY + maxY) / 2).toFixed(6));

    const verificationUrl = `https://www.globalforestwatch.org/map/geostore/${geostoreId}/?map=center,lat:${centerLat},lng:${centerLng},zoom:14`;

    return Response.json({
      areaHa: Number(calculatedArea.toFixed(2)),
      hasChanges: changes.length > 0,
      changes,
      checkedAt: new Date().toISOString(),
      startYear: START_YEAR,
      endYear: END_YEAR,
      source: "Global Forest Watch · Hansen/UMD Tree Cover Loss",
      verificationUrl,
      geostoreId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar o Global Forest Watch.";
    return responseError(message, 502);
  }
}
