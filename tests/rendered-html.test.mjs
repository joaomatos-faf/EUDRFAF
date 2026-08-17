import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza a interface completa do Preparador EUDR", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Preparador EUDR · FAF Coffees<\/title>/i);
  assert.match(html, /Selecione seu portal de entrada|Plataforma EUDR|FAF Coffees|Carregando sistema/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("mantém a integridade de estilos e configuração web", async () => {
  const [css, packageJson] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(css, /\.topbar\s*\{/);
  assert.match(css, /\.workspace-grid\s*\{/);
  assert.match(css, /\.status-summary\s*\{/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(packageJson, /"dev": "vinext dev"/);
  assert.match(packageJson, /"deploy": "wrangler deploy"/);
});

