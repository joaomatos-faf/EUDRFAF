import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEudrGeoJson,
  buildShapefileParts,
  producerCsv,
} from "../app/lib/eudr.ts";
import { APP_CONFIG } from "../app/lib/config.ts";

const sampleGeometry = {
  type: "FeatureCollection",
  polygons: [
    [
      [
        [-46.6333, -23.5505],
        [-46.6330, -23.5505],
        [-46.6330, -23.5500],
        [-46.6333, -23.5500],
        [-46.6333, -23.5505],
      ],
    ],
  ],
};

test("APP_CONFIG contém constantes válidas do sistema", () => {
  assert.equal(APP_CONFIG.appName, "Preparador EUDR · FAF Coffees");
  assert.equal(APP_CONFIG.version, "0.2.1");
  assert.deepEqual(APP_CONFIG.years, [2020, 2021, 2022, 2023, 2024]);
});

test("buildEudrGeoJson constrói FeatureCollection válida para EUDR", () => {
  const geojson = buildEudrGeoJson(sampleGeometry, "TALHAO-01", 12.5);
  assert.equal(geojson.type, "FeatureCollection");
  assert.equal(geojson.features.length, 1);
  assert.equal(geojson.features[0].properties.name, "TALHAO-01");
  assert.equal(geojson.features[0].properties.area, 12.5);
});

test("buildShapefileParts gera 5 arquivos essenciais do Shapefile (.shp, .shx, .dbf, .prj, .cpg)", () => {
  const parts = buildShapefileParts(sampleGeometry, "TALHAO-01", 12.5, {
    producer: "João Matos",
    farm: "Fazenda Santa Inês",
  });
  assert.equal(parts.length, 5);
  const extensions = parts.map((p) => p.name.split(".").pop());
  assert.deepEqual(extensions, ["shp", "shx", "dbf", "prj", "cpg"]);
});

test("producerCsv constrói cabeçalho e linha formatados em UTF-8 com BOM", () => {
  const csv = producerCsv({
    plotId: "TALHAO-01",
    farm: "Fazenda Santa Inês",
    producer: "João Matos",
    supplier: "FAF Coffees",
    region: "Sudeste",
    municipality: "Caconde",
    state: "São Paulo",
    area: 12.5,
    mappedAt: "2026-07-28",
    checkedAt: "2026-07-28",
    compliance: "Em conformidade",
    notes: "Sem desmatamento",
    mappedBy: "João Matos",
    car: "SP-123456",
  });
  assert.match(csv, /^\uFEFF/);
  assert.match(csv, /"Plot ID";"Nome da fazenda"/);
  assert.match(csv, /"TALHAO-01";"Fazenda Santa Inês"/);
  assert.match(csv, /"12,50"/);
});
