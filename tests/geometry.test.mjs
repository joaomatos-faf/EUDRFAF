import assert from "node:assert";
import test from "node:test";
import { calculateAreaHectares, douglasPeucker, sanitizePlotId, simplifyGeometry } from "../app/lib/eudr.ts";

test("sanitizePlotId cleans invalid characters and converts to uppercase", () => {
  assert.strictEqual(sanitizePlotId("  fazenda-01#sub! "), "FAZENDA-01SUB");
  assert.strictEqual(sanitizePlotId("talhao---02"), "TALHAO-02");
});

test("douglasPeucker simplifies collinear points correctly", () => {
  const points = [
    [0, 0],
    [1, 0.0000001],
    [2, 0.0000001],
    [3, 0],
  ];
  const simplified = douglasPeucker(points, 0.001);
  assert.strictEqual(simplified.length, 2);
  assert.deepStrictEqual(simplified[0], [0, 0]);
  assert.deepStrictEqual(simplified[1], [3, 0]);
});

test("simplifyGeometry reduces point count when threshold is exceeded", () => {
  const denseRing = [];
  for (let i = 0; i <= 100; i += 1) {
    denseRing.push([i * 0.01, i % 2 === 0 ? 0 : 0.000001]);
  }
  denseRing.push(denseRing[0]);
  const sampleData = { polygons: [[denseRing]] };

  const simplified = simplifyGeometry(sampleData, 10, 0.001);
  assert.ok(simplified.polygons[0][0].length < denseRing.length);
});

test("calculateAreaHectares computes correct area with 2 decimals", () => {
  const squarePolygon = {
    polygons: [
      [
        [
          [-46.6333, -23.5505],
          [-46.6333, -23.5405],
          [-46.6233, -23.5405],
          [-46.6233, -23.5505],
          [-46.6333, -23.5505],
        ],
      ],
    ],
  };
  const area = calculateAreaHectares(squarePolygon);
  assert.strictEqual(typeof area, "number");
  assert.ok(area > 100 && area < 150);
});
