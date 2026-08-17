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

test("isAuthorizedForStorageKey isola o acesso por segmentos exatos e valida modos READ e WRITE", () => {
  // Administradores têm acesso universal em leitura e escrita
  assert.equal(isAuthorizedForStorageKey("admin", undefined, "contratos_clientes/BELCO/talhao.geojson", "read"), true);
  assert.equal(isAuthorizedForStorageKey("admin", undefined, "contratos_clientes/BELCO/talhao.geojson", "write"), true);

  // Staff (user) tem acesso universal de leitura, e restrição operacional em escrita
  assert.equal(isAuthorizedForStorageKey("user", undefined, "contratos_clientes/CLIENTE_X/talhao.geojson", "read"), true);
  assert.equal(isAuthorizedForStorageKey("user", undefined, "uploads/fazenda_01.kml", "write"), true);
  assert.equal(isAuthorizedForStorageKey("user", undefined, "system_config.json", "write"), false);

  // Cliente BELCO acessa apenas seus próprios segmentos exatos
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/BELCO/lote_01.geojson", "read"), true);
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/BELCO/lote_01.geojson", "write"), true);
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "publicados/BELCO/dossie.zip", "read"), true);

  // Cliente BELCO é PROIBIDO de acessar ou gravar em pastas de outro cliente
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/OUTRO_CLIENTE/lote_01.geojson", "read"), false);
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/OUTRO_CLIENTE/lote_01.geojson", "write"), false);

  // SEGURANÇA ESTRITA: Bloqueia bypass por prefixo similar (BELCO_OUTRA_EMPRESA)
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/BELCO_OUTRA_EMPRESA/lote_01.geojson", "read"), false);
  assert.equal(isAuthorizedForStorageKey("client", "BELCO", "contratos_clientes/BELCO_OUTRA_EMPRESA/lote_01.geojson", "write"), false);
});
