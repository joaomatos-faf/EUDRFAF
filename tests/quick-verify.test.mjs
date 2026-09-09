import test from "node:test";
import assert from "node:assert/strict";

function detectActiveView(host, search = "", hash = "", savedView = null) {
  if (host.startsWith("verify.") || search.includes("view=verify") || hash.includes("verify")) return "verify";
  if (host.startsWith("dashboard.") || search.includes("view=dashboard") || hash.includes("dashboard")) return "dashboard";
  if (host.startsWith("contratos.") || search.includes("view=contratos") || hash.includes("contratos")) return "contratos";
  if (host.startsWith("portal.") || host.startsWith("cliente.") || search.includes("view=portal") || hash.includes("portal")) return "portal";
  if (host.startsWith("app.") || host.startsWith("preparador.") || search.includes("view=app") || hash.includes("app")) return "app";
  if (search.includes("view=landing") || hash.includes("landing")) return "landing";
  if (savedView && ["landing", "app", "portal", "contratos", "dashboard", "verify"].includes(savedView)) return savedView;
  return "landing";
}

function sanitizePlotId(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

function validateDetailsForQuickVerify(value) {
  const input = value && typeof value === "object" ? value : {};
  const text = (field) => String(input[field] ?? "").trim().slice(0, 120);
  let plotId = sanitizePlotId(text("plotId"));
  if (!plotId) {
    plotId = `VERIFY-${Date.now().toString(36).toUpperCase()}`;
  }
  const attributes = {
    farm: text("farm") || "Talhão Verificação Rápida",
    producer: text("producer") || "Operador FAF",
    supplier: text("supplier") || "Verificação Rápida",
    region: text("region") || "Brasil",
    municipality: text("municipality") || "Brasil",
    state: text("state") || "BR",
    mappedAt: text("mappedAt") || new Date().toISOString().slice(0, 10),
    checkedAt: text("checkedAt") || new Date().toISOString().slice(0, 10),
    compliance: text("compliance") || "Em Análise",
    mappedBy: text("mappedBy") || "FAF Verificador",
    car: text("car") || "N/A",
  };
  return { plotId, attributes };
}

test("detectActiveView roteia 'verify.fafeu.online' e query params para 'verify'", () => {
  assert.equal(detectActiveView("verify.fafeu.online"), "verify");
  assert.equal(detectActiveView("fafeu.online", "?view=verify"), "verify");
  assert.equal(detectActiveView("localhost", "", "#verify"), "verify");
});

test("validateDetailsForQuickVerify permite verificação 100% sem preenchimento de formulário", () => {
  const emptyResult = validateDetailsForQuickVerify({});
  assert.ok(emptyResult.plotId.startsWith("VERIFY-"), "Gera ID de plot automático");
  assert.equal(emptyResult.attributes.supplier, "Verificação Rápida");
  assert.equal(emptyResult.attributes.mappedBy, "FAF Verificador");

  const nullResult = validateDetailsForQuickVerify(null);
  assert.ok(nullResult.plotId.startsWith("VERIFY-"));
  assert.equal(nullResult.attributes.state, "BR");
});
