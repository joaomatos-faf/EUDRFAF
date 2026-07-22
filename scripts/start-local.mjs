import { loadVinextProdServer } from "../desktop/vinext-runtime.mjs";

const { startProdServer } = await loadVinextProdServer();
await startProdServer({ host: "0.0.0.0", port: Number(process.env.PORT || 3000), outDir: "dist" });
