import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, hashPasswordLegacy, checkPasswordMatch } from "../app/lib/eudr.ts";

test("PBKDF2 gera hashes com 100.000 iterações e salt único", async () => {
  const pass = "senhaSeguraFAF2026";
  const hash1 = await hashPassword(pass);
  const hash2 = await hashPassword(pass);

  assert.match(hash1, /^pbkdf2:100000:[0-9a-f]{32}:[0-9a-f]{64}$/);
  assert.match(hash2, /^pbkdf2:100000:[0-9a-f]{32}:[0-9a-f]{64}$/);

  // Hashes devem ser distintos devido a salts criptográficos diferentes
  assert.notEqual(hash1, hash2);

  // Ambos devem validar com a senha original
  assert.equal(await checkPasswordMatch(pass, hash1), true);
  assert.equal(await checkPasswordMatch(pass, hash2), true);
  assert.equal(await checkPasswordMatch("senhaIncorreta", hash1), false);
});

test("Mantém compatibilidade reversa com hashes legados SHA-256 e texto puro", async () => {
  const pass = "eudr2026";
  const legacySha256 = await hashPasswordLegacy(pass);

  assert.equal(legacySha256.length, 64);
  assert.equal(await checkPasswordMatch(pass, legacySha256), true);
  assert.equal(await checkPasswordMatch("errada", legacySha256), false);

  // Plaintext inicial
  assert.equal(await checkPasswordMatch("faf123", "faf123"), true);
  assert.equal(await checkPasswordMatch("faf123", "faf124"), false);
});
