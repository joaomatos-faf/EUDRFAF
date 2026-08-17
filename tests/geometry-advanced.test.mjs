import assert from "node:assert/strict";
import test from "node:test";
import {
  utmToWgs84,
  normalizePosition,
  calculateAreaHectares,
  simplifyGeometry,
} from "../app/lib/eudr.ts";

test("utmToWgs84 converte coordenadas métricas UTM Zona 23S para graus WGS84 com alta precisão", () => {
  // Ponto conhecido em Minas Gerais / São Paulo (Zona 23S)
  // Easting: 350000 m, Northing: 7550000 m (Sul)
  const [lon, lat] = utmToWgs84(350000, 7550000, 23, true);

  assert.ok(lon >= -47.0 && lon <= -44.0, `Longitude esperada em MG/SP, obtido: ${lon}`);
  assert.ok(lat >= -23.0 && lat <= -21.0, `Latitude esperada em MG/SP, obtido: ${lat}`);
});

test("normalizePosition detecta e converte automaticamente coordenadas UTM projetadas", () => {
  // Coordenada geográfica normal
  const geoPos = [-45.5, -22.1];
  const normGeo = normalizePosition(geoPos);
  assert.equal(normGeo[0], -45.5);
  assert.equal(normGeo[1], -22.1);

  // Coordenada UTM [Easting, Northing]
  const utmPos = [350000, 7550000];
  const normUtm = normalizePosition(utmPos, 23);
  assert.ok(normUtm[0] >= -180 && normUtm[0] <= 180);
  assert.ok(normUtm[1] >= -90 && normUtm[1] <= 90);
  assert.notEqual(normUtm[0], 350000);
});

test("calculateAreaHectares calcula corretamente polígonos complexos com furos (donuts)", () => {
  // Polígono externo de 100m x 100m = 1 hectare (10000 m²)
  // Com furo interno de 50m x 50m = 0.25 hectare (2500 m²)
  // Área líquida esperada = 0.75 hectare
  const outerRing = [
    [-45.000, -22.000],
    [-45.000, -22.001],
    [-45.001, -22.001],
    [-45.001, -22.000],
    [-45.000, -22.000],
  ];

  const holeRing = [
    [-45.0002, -22.0002],
    [-45.0002, -22.0008],
    [-45.0008, -22.0008],
    [-45.0008, -22.0002],
    [-45.0002, -22.0002],
  ];

  const geomWithoutHole = { polygons: [[outerRing]] };
  const geomWithHole = { polygons: [[outerRing, holeRing]] };

  const areaWithout = calculateAreaHectares(geomWithoutHole);
  const areaWith = calculateAreaHectares(geomWithHole);

  assert.ok(areaWithout > 0);
  assert.ok(areaWith > 0);
  assert.ok(areaWith < areaWithout, "Área com furo deve ser menor que sem furo");
});
