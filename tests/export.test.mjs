import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEudrGeoJson,
  buildShapefileParts,
  buildProducerXlsxBytes,
  getTwoLetterInitials,
  generateAutoPlotId,
  incrementPlotIdNumber,
} from "../app/lib/eudr.ts";
import { exportAuditLogsCsv } from "../app/lib/auditLogger.ts";
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
  assert.ok(Array.isArray(APP_CONFIG.years));
  assert.ok(APP_CONFIG.years.includes(2020));
  assert.ok(APP_CONFIG.years.includes(2024));
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

test("buildProducerXlsxBytes gera arquivo Excel (.xlsx) válido em formato binário", () => {
  const bytes = buildProducerXlsxBytes({
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
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 100);
});

test("generateAutoPlotId constrói o código no padrão FAF + Fornecedor + Município + N°", () => {
  assert.equal(getTwoLetterInitials("Drumond"), "DR");
  assert.equal(getTwoLetterInitials("Daniel Rosa"), "DR");
  assert.equal(getTwoLetterInitials("João Matos"), "JM");
  assert.equal(getTwoLetterInitials("Andrada"), "AN");
  assert.equal(getTwoLetterInitials("Poços de Caldas"), "PC");

  assert.equal(generateAutoPlotId("Drumond", "Andrada", "01"), "FAFDRAN-01");
  assert.equal(generateAutoPlotId("Daniel Rosa", "Andrada", "01"), "FAFDRAN-01");
  assert.equal(generateAutoPlotId("João Matos", "São Paulo", "02"), "FAFJMSP-02");
});

test("exportAuditLogsCsv gera CSV formatado com BOM UTF-8 e colunas corretas", () => {
  const sampleLogs = [
    {
      id: "log_123",
      timestamp: "2026-07-29T14:00:00.000Z",
      user: "joaomatos",
      userFullName: "João Matos",
      action: "PACKAGE_EXPORTED",
      category: "EXPORTACAO",
      details: "Exportou pacote EUDR para FAFDRAN-01",
      plotId: "FAFDRAN-01",
    },
  ];
  const csv = exportAuditLogsCsv(sampleLogs);
  assert.match(csv, /^\uFEFF/);
  assert.match(csv, /"Data e Hora";"Usuário";"Nome";"Categoria"/);
  assert.match(csv, /"joaomatos";"João Matos";"EXPORTACAO"/);
  assert.match(csv, /"FAFDRAN-01"/);
});

test("incrementPlotIdNumber incrementa o sufixo do código do talhão corretamente", () => {
  assert.equal(incrementPlotIdNumber("FAFDRAD-01"), "FAFDRAD-02");
  assert.equal(incrementPlotIdNumber("FAFDRAD-09"), "FAFDRAD-10");
  assert.equal(incrementPlotIdNumber("FAFJMSP-02"), "FAFJMSP-03");
  assert.equal(incrementPlotIdNumber("FAFDRAD-100"), "FAFDRAD-101");
});
