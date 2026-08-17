import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, verifySessionToken } from "../app/lib/auth.ts";

test("createSessionToken gera token assinado com HMAC-SHA256 válido", async () => {
  const payload = {
    userKey: "joao",
    fullName: "João Silva",
    role: "user",
    clientName: "FAFCOFFEES",
  };

  const token = await createSessionToken(payload, 3600);
  assert.ok(token.includes("."), "Token deve ter formato <payload>.<assinatura>");

  const verified = await verifySessionToken(token);
  assert.ok(verified !== null, "Token assinado deve ser verificado com sucesso");
  assert.equal(verified?.userKey, "joao");
  assert.equal(verified?.role, "user");
  assert.ok((verified?.exp ?? 0) > Math.floor(Date.now() / 1000));
});

test("verifySessionToken rejeita tokens adulterados ou com assinatura inválida", async () => {
  const payload = {
    userKey: "cliente",
    fullName: "Cliente Demo",
    role: "client",
  };

  const token = await createSessionToken(payload, 3600);
  const [b64, sig] = token.split(".");

  // Adulterando a assinatura
  const tamperedSig = sig.slice(0, -4) + "0000";
  assert.equal(await verifySessionToken(`${b64}.${tamperedSig}`), null);

  // Adulterando o payload
  const tamperedPayload = btoa(JSON.stringify({ ...payload, role: "admin" }));
  assert.equal(await verifySessionToken(`${tamperedPayload}.${sig}`), null);
});

test("verifySessionToken rejeita tokens expirados", async () => {
  const payload = {
    userKey: "admin",
    fullName: "Admin FAF",
    role: "admin",
  };

  // Cria token com duração negativa (-10s)
  const token = await createSessionToken(payload, -10);
  const verified = await verifySessionToken(token);
  assert.equal(verified, null, "Token expirado não deve ser aceito");
});
