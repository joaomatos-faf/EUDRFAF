import assert from "node:assert/strict";
import test from "node:test";
import {
  hashPassword,
  hashPasswordLegacy,
  checkPasswordMatch,
  isAuthorizedForStorageKey,
} from "../app/lib/auth.ts";

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

test("Mantém compatibilidade com hashes legados SHA-256 e REJEITA texto puro", async () => {
  const pass = "eudr2026";
  const legacySha256 = await hashPasswordLegacy(pass);

  assert.equal(legacySha256.length, 64);
  assert.equal(await checkPasswordMatch(pass, legacySha256), true);
  assert.equal(await checkPasswordMatch("errada", legacySha256), false);

  // SEGURANÇA ESTRITA: Plaintext NUNCA é aceito
  assert.equal(await checkPasswordMatch("faf123", "faf123"), false);
  assert.equal(await checkPasswordMatch("123", "123"), false);
});

test("isAuthorizedForStorageKey isola o acesso entre clientes e garante RBAC multi-inquilino", () => {
  // Administradores e Staff têm acesso universal
  assert.equal(isAuthorizedForStorageKey("admin", undefined, "contratos/BELCO/talhao.geojson"), true);
  assert.equal(isAuthorizedForStorageKey("user", undefined, "contratos/CLIENTE_X/talhao.geojson"), true);

  // Cliente BELCO acessa apenas seus próprios arquivos
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/BELCO/lote_01.geojson"), true);
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "publicados/BELCO/dossie.zip"), true);

  // Cliente BELCO é PROIBIDO de acessar dados de outro cliente
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/OUTRO_CLIENTE/lote_01.geojson"), false);
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "publicados/STARBUCKS/dossie.zip"), false);
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "users_mgmt/users_database.json"), false);
});
