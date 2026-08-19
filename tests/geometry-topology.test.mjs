import assert from "node:assert";
import test from "node:test";
import { validatePolygonTopology } from "../app/lib/eudr.ts";

test("validatePolygonTopology aprova polígono válido e fechado", () => {
  const validGeometry = {
    polygons: [
      [
        [
          [-46.9876, -21.1234],
          [-46.9800, -21.1200],
          [-46.9850, -21.1300],
          [-46.9876, -21.1234],
        ],
      ],
    ],
  };

  const result = validatePolygonTopology(validGeometry);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.stats.polygonCount, 1);
  assert.strictEqual(result.stats.ringCount, 1);
  assert.strictEqual(result.stats.totalVertices, 4);
  assert.ok(result.stats.areaHa > 0);
});

test("validatePolygonTopology detecta polígono com auto-interseção (bowtie)", () => {
  const bowtieGeometry = {
    polygons: [
      [
        [
          [-46.0, -21.0],
          [-45.0, -20.0],
          [-46.0, -20.0],
          [-45.0, -21.0],
          [-46.0, -21.0],
        ],
      ],
    ],
  };

  const result = validatePolygonTopology(bowtieGeometry);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes("auto-interseção")));
});

test("validatePolygonTopology rejeita anéis com menos de 4 pontos ou vazios", () => {
  const invalidRing = {
    polygons: [
      [
        [
          [-46.0, -21.0],
          [-45.0, -20.0],
          [-46.0, -21.0],
        ],
      ],
    ],
  };

  const result = validatePolygonTopology(invalidRing);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes("menos de 4 pontos")));
});

test("validatePolygonTopology detecta coordenadas fora dos limites WGS84", () => {
  const outOfBoundsGeometry = {
    polygons: [
      [
        [
          [-200.0, -21.0],
          [-45.0, 105.0],
          [-46.0, -21.0],
          [-200.0, -21.0],
        ],
      ],
    ],
  };

  const result = validatePolygonTopology(outOfBoundsGeometry);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes("limites WGS84")));
});
