import {
  calculateAreaHectares,
  simplifyGeometry,
  type GeometryData,
} from "../../../lib/eudr";
import {
  SH_STATS_URL,
  SH_TOKEN_URL,
  buildStatisticsBody,
  classifyNdviDelta,
  eudrNdviPeriods,
  parseNdviMean,
  type NdviWindow,
} from "../../../lib/sentinelStats";

const MAX_POINTS = 100_000;

function responseError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function getCloudflareEnv() {
  try {
    const cf = await import("cloudflare:workers");
    return cf.env as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

function readEnvString(env: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof process !== "undefined") {
      const fromProcess = process.env?.[key];
      if (fromProcess && fromProcess.trim()) return fromProcess.trim();
    }
  }
  return "";
}

async function getSentinelCredentials(): Promise<{ clientId: string; clientSecret: string }> {
  const cfEnv = await getCloudflareEnv();
  return {
    clientId: readEnvString(cfEnv, ["SH_CLIENT_ID", "SENTINELHUB_CLIENT_ID"]),
    clientSecret: readEnvString(cfEnv, ["SH_CLIENT_SECRET", "SENTINELHUB_CLIENT_SECRET"]),
  };
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
        if (
          !Number.isFinite(longitude) ||
          !Number.isFinite(latitude) ||
          longitude < -180 ||
          longitude > 180 ||
          latitude < -90 ||
          latitude > 90
        ) {
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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 60_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetchWithTimeout(SH_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "Falha ao autenticar no Copernicus Data Space (OAuth).");
  }
  return payload.access_token;
}

async function queryNdvi(token: string, geometry: GeometryData, window: NdviWindow) {
  const response = await fetchWithTimeout(SH_STATS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(buildStatisticsBody(geometry, window)),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? JSON.stringify((payload as { error?: unknown }).error)
        : "";
    throw new Error(message || `Sentinel Hub Statistical API respondeu ${response.status}.`);
  }

  return parseNdviMean(payload, window);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { geometry?: unknown };
    const geometry = validateGeometry(body.geometry);
    const { clientId, clientSecret } = await getSentinelCredentials();
    const periods = eudrNdviPeriods();
    const areaHa = Number(calculateAreaHectares(geometry).toFixed(2));

    if (!clientId || !clientSecret) {
      return Response.json({
        configured: false,
        areaHa,
        ndvi2020: null,
        ndviRecent: null,
        delta: null,
        status: "insufficient",
        reason: "Configure SH_CLIENT_ID e SH_CLIENT_SECRET (Copernicus OAuth Client credentials).",
        baseline: periods.baseline,
        recent: periods.recent,
        source: "Sentinel Hub Statistical API · Copernicus Data Space",
        checkedAt: new Date().toISOString(),
      });
    }

    const token = await getAccessToken(clientId, clientSecret);
    const [baselineStats, recentStats] = await Promise.all([
      queryNdvi(token, geometry, periods.baseline),
      queryNdvi(token, geometry, periods.recent),
    ]);

    const classification = classifyNdviDelta(baselineStats.mean, recentStats.mean);

    return Response.json({
      configured: true,
      areaHa,
      ...classification,
      baseline: periods.baseline,
      recent: periods.recent,
      baselineStats,
      recentStats,
      source: "Sentinel-2 L2A · Sentinel Hub Statistical API",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar o NDVI no Sentinel Hub.";
    return responseError(message, 502);
  }
}
