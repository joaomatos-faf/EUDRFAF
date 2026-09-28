import type { GeometryData } from "./eudr";

export const EUDR_CUTOFF_YEAR = 2020;
export const NDVI_DROP_THRESHOLD = 0.15;
export const NDVI_VEGETATED = 0.4;
export const SH_TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
export const SH_STATS_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics";

export const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1 },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(samples) {
  const denom = samples.B08 + samples.B04;
  const ndvi = denom === 0 ? 0 : (samples.B08 - samples.B04) / denom;
  const cloud = samples.SCL === 3 || samples.SCL === 8 || samples.SCL === 9 || samples.SCL === 10 || samples.SCL === 11;
  return {
    ndvi: [ndvi],
    dataMask: [samples.dataMask && !cloud ? 1 : 0]
  };
}
`;

export type NdviWindow = { from: string; to: string };

export type NdviPeriodStats = {
  from: string;
  to: string;
  mean: number | null;
  min: number | null;
  max: number | null;
  stDev: number | null;
  sampleCount: number;
  noDataCount: number;
};

export type NdviClassification = {
  status: "clear" | "attention" | "insufficient";
  ndvi2020: number | null;
  ndviRecent: number | null;
  delta: number | null;
  reason: string;
};

export type SentinelNdviResult = NdviClassification & {
  configured: boolean;
  baseline: NdviWindow;
  recent: NdviWindow;
  source: string;
};

export function geometryToGeoJson(geometry: GeometryData) {
  const multi = geometry.polygons.length > 1;
  return {
    type: multi ? "MultiPolygon" : "Polygon",
    coordinates: multi ? geometry.polygons : geometry.polygons[0],
  };
}

export function eudrNdviPeriods(now = new Date()): { baseline: NdviWindow; recent: NdviWindow } {
  const iso = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");
  const recentFrom = new Date(now.getTime());
  recentFrom.setUTCFullYear(recentFrom.getUTCFullYear() - 1);
  return {
    baseline: {
      from: `${EUDR_CUTOFF_YEAR}-01-01T00:00:00Z`,
      to: `${EUDR_CUTOFF_YEAR}-12-31T23:59:59Z`,
    },
    recent: {
      from: iso(recentFrom),
      to: iso(now),
    },
  };
}

export function roundNdvi(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(3));
}

export function classifyNdviDelta(baseline: number | null, recent: number | null): NdviClassification {
  const ndvi2020 = roundNdvi(baseline);
  const ndviRecent = roundNdvi(recent);
  if (ndvi2020 == null || ndviRecent == null) {
    return {
      status: "insufficient",
      ndvi2020,
      ndviRecent,
      delta: null,
      reason: "Sem amostras válidas de NDVI (nuvem, fora de cena ou polígono pequeno demais para 10 m).",
    };
  }

  const delta = roundNdvi(ndviRecent - ndvi2020);
  const drop = ndvi2020 - ndviRecent;
  if (ndvi2020 >= NDVI_VEGETATED && drop >= NDVI_DROP_THRESHOLD) {
    return {
      status: "attention",
      ndvi2020,
      ndviRecent,
      delta,
      reason: `Queda de NDVI ${drop.toFixed(2)} entre ${EUDR_CUTOFF_YEAR} e os últimos 12 meses.`,
    };
  }

  return {
    status: "clear",
    ndvi2020,
    ndviRecent,
    delta,
    reason: "NDVI estável ou sem queda relevante após 31/12/2020.",
  };
}

type StatsBand = {
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    stDev?: number;
    sampleCount?: number;
    noDataCount?: number;
  };
};

type StatsPayload = {
  data?: Array<{
    interval?: { from?: string; to?: string };
    outputs?: { ndvi?: { bands?: { B0?: StatsBand } } };
  }>;
};

export function parseNdviMean(payload: unknown, window: NdviWindow): NdviPeriodStats {
  const data = (payload as StatsPayload)?.data || [];
  const means: number[] = [];
  let min: number | null = null;
  let max: number | null = null;
  let stDev: number | null = null;
  let sampleCount = 0;
  let noDataCount = 0;

  for (const interval of data) {
    const stats = interval?.outputs?.ndvi?.bands?.B0?.stats;
    if (!stats) continue;
    const samples = Number(stats.sampleCount || 0);
    const nodata = Number(stats.noDataCount || 0);
    sampleCount += samples;
    noDataCount += nodata;
    if (samples <= nodata || !Number.isFinite(stats.mean)) continue;
    means.push(Number(stats.mean));
    if (Number.isFinite(stats.min)) min = min == null ? Number(stats.min) : Math.min(min, Number(stats.min));
    if (Number.isFinite(stats.max)) max = max == null ? Number(stats.max) : Math.max(max, Number(stats.max));
    if (Number.isFinite(stats.stDev)) stDev = Number(stats.stDev);
  }

  const mean = means.length ? means.reduce((sum, value) => sum + value, 0) / means.length : null;
  return {
    from: window.from,
    to: window.to,
    mean: roundNdvi(mean),
    min: roundNdvi(min),
    max: roundNdvi(max),
    stDev: roundNdvi(stDev),
    sampleCount,
    noDataCount,
  };
}

export function buildStatisticsBody(geometry: GeometryData, window: NdviWindow) {
  return {
    input: {
      bounds: {
        geometry: geometryToGeoJson(geometry),
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: window,
            maxCloudCoverage: 40,
          },
        },
      ],
    },
    aggregation: {
      timeRange: window,
      aggregationInterval: { of: "P1Y" },
      evalscript: NDVI_EVALSCRIPT,
      width: 64,
      height: 64,
    },
    calculations: {
      default: {},
    },
  };
}
