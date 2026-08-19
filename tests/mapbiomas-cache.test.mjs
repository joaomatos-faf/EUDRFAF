import test from "node:test";
import assert from "node:assert/strict";

async function computeGeometryHash(geometry) {
  const coordsStr = geometry.polygons
    .map((poly) => poly.map((ring) => ring.map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`).join(";")).join("|"))
    .join("#");
  const msgUint8 = new TextEncoder().encode(coordsStr);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

test("computeGeometryHash gera hash determinístico e consistente", async () => {
  const geometry1 = {
    polygons: [
      [
        [
          [-46.987654, -21.123456],
          [-46.980000, -21.120000],
          [-46.985000, -21.130000],
          [-46.987654, -21.123456],
        ],
      ],
    ],
  };

  const geometry2 = JSON.parse(JSON.stringify(geometry1));

  const hash1 = await computeGeometryHash(geometry1);
  const hash2 = await computeGeometryHash(geometry2);

  assert.equal(hash1, hash2, "Geometrias idênticas devem gerar exatamente o mesmo hash SHA-256");
  assert.equal(hash1.length, 64, "O hash SHA-256 deve ter 64 caracteres hexadecimais");
});
