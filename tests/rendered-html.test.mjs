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
  assert.match(html, /class="app-shell"/);
  assert.match(html, /Prepare um talhão para EUDR/);
  assert.match(html, /Identificação do talhão/);
  assert.match(html, /Selecionar arquivo KML ou GeoJSON/);
  assert.match(html, /Consultar MapBiomas/);
  assert.match(html, /Baixar pacote EUDR/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("mantém o tema desktop e a correção de estilos no Windows", async () => {
  const [css, runtime, packageJson, builder] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../desktop/vinext-runtime.mjs", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../electron-builder.yml", import.meta.url), "utf8"),
  ]);

  assert.match(css, /\.topbar\s*\{/);
  assert.match(css, /\.workspace-grid\s*\{/);
  assert.match(css, /\.status-summary\s*\{/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(runtime, /process\.platform === "win32"/);
  assert.match(runtime, /replaceAll\("\/", "\\\\"\)/);
  assert.match(packageJson, /"start": "node scripts\/start-local\.mjs"/);
  assert.match(builder, /extraResources:/);
  assert.match(builder, /from: dist/);
});
