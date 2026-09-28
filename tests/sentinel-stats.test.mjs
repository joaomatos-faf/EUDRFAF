import test from "node:test";
import assert from "node:assert/strict";

const EUDR_CUTOFF_YEAR = 2020;
const NDVI_DROP_THRESHOLD = 0.15;
const NDVI_VEGETATED = 0.4;

function roundNdvi(value) {
  if (value == null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(3));
}

function classifyNdviDelta(baseline, recent) {
  const ndvi2020 = roundNdvi(baseline);
  const ndviRecent = roundNdvi(recent);
  if (ndvi2020 == null || ndviRecent == null) {
    return {
      status: "insufficient",
      ndvi2020,
      ndviRecent,
      delta: null,
    };
  }
  const delta = roundNdvi(ndviRecent - ndvi2020);
  const drop = ndvi2020 - ndviRecent;
  if (ndvi2020 >= NDVI_VEGETATED && drop >= NDVI_DROP_THRESHOLD) {
    return { status: "attention", ndvi2020, ndviRecent, delta };
  }
  return { status: "clear", ndvi2020, ndviRecent, delta };
}

function geometryToGeoJson(geometry) {
  const multi = geometry.polygons.length > 1;
  return {
    type: multi ? "MultiPolygon" : "Polygon",
    coordinates: multi ? geometry.polygons : geometry.polygons[0],
  };
}

function eudrNdviPeriods(now) {
  const iso = (date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");
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

function parseNdviMean(payload) {
  const data = payload?.data || [];
  const means = [];
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
  }
  const mean = means.length ? means.reduce((sum, value) => sum + value, 0) / means.length : null;
  return { mean: roundNdvi(mean), sampleCount, noDataCount };
}

function mergeEudrStatus(hasCoverageChange, ndviStatus) {
  return hasCoverageChange || ndviStatus === "attention" ? "attention" : "clear";
}

test("classifyNdviDelta marca atenção quando vegetação cai após 2020", () => {
  const result = classifyNdviDelta(0.72, 0.41);
  assert.equal(result.status, "attention");
  assert.equal(result.delta, -0.31);
});

test("classifyNdviDelta mantém conforme para café com NDVI estável", () => {
  const result = classifyNdviDelta(0.58, 0.55);
  assert.equal(result.status, "clear");
  assert.equal(result.delta, -0.03);
});

test("classifyNdviDelta é insuficiente sem amostras", () => {
  const result = classifyNdviDelta(null, 0.5);
  assert.equal(result.status, "insufficient");
  assert.equal(result.delta, null);
});

test("eudrNdviPeriods usa 2020 como baseline e 12 meses recentes", () => {
  const now = new Date("2026-09-21T15:00:00.000Z");
  const periods = eudrNdviPeriods(now);
  assert.equal(periods.baseline.from, "2020-01-01T00:00:00Z");
  assert.equal(periods.baseline.to, "2020-12-31T23:59:59Z");
  assert.equal(periods.recent.from, "2025-09-21T15:00:00Z");
  assert.equal(periods.recent.to, "2026-09-21T15:00:00Z");
});

test("geometryToGeoJson usa Polygon para um anel e MultiPolygon para vários", () => {
  const ring = [
    [
      [-40.5, -20.1],
      [-40.4, -20.1],
      [-40.4, -20.2],
      [-40.5, -20.2],
      [-40.5, -20.1],
    ],
  ];
  const polygon = geometryToGeoJson({ polygons: [ring] });
  assert.equal(polygon.type, "Polygon");
  assert.equal(polygon.coordinates, ring);

  const multi = geometryToGeoJson({ polygons: [ring, ring] });
  assert.equal(multi.type, "MultiPolygon");
  assert.equal(multi.coordinates.length, 2);
});

test("parseNdviMean ignora intervalos só com noData e média os demais", () => {
  const payload = {
    data: [
      {
        outputs: {
          ndvi: { bands: { B0: { stats: { mean: 0.6, sampleCount: 10, noDataCount: 10 } } } },
        },
      },
      {
        outputs: {
          ndvi: { bands: { B0: { stats: { mean: 0.5, sampleCount: 20, noDataCount: 2 } } } },
        },
      },
      {
        outputs: {
          ndvi: { bands: { B0: { stats: { mean: 0.7, sampleCount: 20, noDataCount: 0 } } } },
        },
      },
    ],
  };
  const parsed = parseNdviMean(payload);
  assert.equal(parsed.mean, 0.6);
  assert.equal(parsed.sampleCount, 50);
});

test("mergeEudrStatus sobe para alerta se só o NDVI cair", () => {
  assert.equal(mergeEudrStatus(false, "attention"), "attention");
  assert.equal(mergeEudrStatus(false, "clear"), "clear");
  assert.equal(mergeEudrStatus(true, "clear"), "attention");
});
