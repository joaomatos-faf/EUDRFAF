import { loadVinextProdServer } from "../desktop/vinext-runtime.mjs";

const { startProdServer } = await loadVinextProdServer();
const localServer = await startProdServer({ host: "127.0.0.1", port: 0, outDir: "dist" });
try {
  const baseUrl = `http://127.0.0.1:${localServer.port}`;
  const htmlResponse = await fetch(baseUrl);
  const html = await htmlResponse.text();
  const cssPath = html.match(/href="([^"]+\.css)"/)?.[1];
  if (!cssPath) throw new Error("A página não informou o arquivo de estilos.");
  const cssResponse = await fetch(new URL(cssPath, baseUrl));
  const css = await cssResponse.text();
  if (!cssResponse.ok || !css.includes(".topbar")) {
    throw new Error(`O arquivo de estilos não foi servido corretamente (${cssResponse.status}).`);
  }
  console.log(`Estilos disponíveis: ${cssPath} (${css.length} caracteres)`);
} finally {
  await new Promise((resolve) => localServer.server.close(resolve));
}
