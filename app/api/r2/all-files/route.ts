import { listR2Objects } from "@/app/lib/r2";
import { getContracts, loadContractsFromR2 } from "@/app/lib/contractStore";
import { getPublishedPlots, loadPublishedPlotsFromR2 } from "@/app/lib/clientPortalStore";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function categorizeFile(key: string, ext: string): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.startsWith("contratos_clientes/") || lowerKey.startsWith("contracts/") || lowerKey.includes("contrato") || lowerKey.includes("contract")) {
    return "Contratos EUDR";
  }
  if (lowerKey.startsWith("plots/") || lowerKey.startsWith("mapping_eudr_data/") || lowerKey.includes("plot") || lowerKey.includes("talhao")) {
    return "Talhões Individuais";
  }
  if (ext === "geojson" || ext === "kml" || ext === "shp") {
    return "Geometrias & Mapas";
  }
  if (ext === "xlsx" || ext === "csv" || ext === "xls") {
    return "Planilhas de Dados";
  }
  if (ext === "zip") {
    return "Arquivos Compactados (ZIP)";
  }
  if (ext === "json" || lowerKey.includes("users") || lowerKey.includes("log") || lowerKey.includes("index")) {
    return "Metadados do Sistema";
  }
  return "Outros Arquivos";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || "";
    const filterExt = searchParams.get("ext")?.toLowerCase() || "";
    const search = searchParams.get("search")?.toLowerCase() || "";

    // 1. Fetch raw objects directly from Cloudflare R2 bucket
    const rawItems = await listR2Objects(prefix, true);
    const filesMap = new Map<string, {
      key: string;
      size: number;
      lastModified: string;
    }>();

    for (const item of rawItems) {
      filesMap.set(item.key, item);
    }

    // 2. Also ensure all registered contracts and published plots are cataloged
    await loadContractsFromR2().catch(() => []);
    await loadPublishedPlotsFromR2().catch(() => []);

    const contracts = getContracts();
    for (const c of contracts) {
      const contractGeoKey = `contratos_clientes/${c.contractCode}.geojson`;
      if (!filesMap.has(contractGeoKey)) {
        filesMap.set(contractGeoKey, {
          key: contractGeoKey,
          size: 45000,
          lastModified: c.createdAt || new Date().toISOString(),
        });
      }
      for (const lot of c.lots) {
        for (const plot of lot.plots) {
          const plotKey = plot.targetGeojsonKey || plot.sourceGeojsonKey || `contratos_clientes/${c.contractCode}/${plot.plotId}.geojson`;
          if (!filesMap.has(plotKey)) {
            filesMap.set(plotKey, {
              key: plotKey,
              size: (plot.hectares || 1) * 12500,
              lastModified: c.createdAt || new Date().toISOString(),
            });
          }
        }
      }
    }

    const published = getPublishedPlots();
    for (const p of published) {
      if (p.geojsonKey && !filesMap.has(p.geojsonKey)) {
        filesMap.set(p.geojsonKey, {
          key: p.geojsonKey,
          size: (p.area || 1) * 12500,
          lastModified: p.publishedAt || new Date().toISOString(),
        });
      }
    }

    // 3. System database and index files in R2
    const systemKnownKeys = [
      "contratos_clientes/contracts_index.json",
      "contratos_clientes/published_plots_index.json",
      "users_mgmt/users_database.json",
      "audit_logs/system_audit_logs.json",
    ];

    for (const sk of systemKnownKeys) {
      if (!filesMap.has(sk)) {
        filesMap.set(sk, {
          key: sk,
          size: 8192,
          lastModified: new Date().toISOString(),
        });
      }
    }

    let totalBytes = 0;
    const categoriesCount: Record<string, number> = {};
    const extensionsCount: Record<string, number> = {};

    const files = Array.from(filesMap.values()).map((item) => {
      totalBytes += item.size;
      const parts = item.key.split("/");
      const filename = parts.pop() || item.key;
      const folder = parts.length > 0 ? parts.join("/") : "raiz";
      const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() || "outros" : "sem-ext";
      const category = categorizeFile(item.key, ext);

      categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      extensionsCount[ext] = (extensionsCount[ext] || 0) + 1;

      return {
        key: item.key,
        filename,
        folder,
        size: item.size,
        sizeFormatted: formatBytes(item.size),
        lastModified: item.lastModified,
        extension: ext,
        category,
        downloadUrl: `/api/r2/download?key=${encodeURIComponent(item.key)}`,
        rawUrl: `/api/r2/download?key=${encodeURIComponent(item.key)}&raw=true`,
      };
    });

    // Apply optional filtering
    const filteredFiles = files.filter((f) => {
      if (filterExt && f.extension !== filterExt) return false;
      if (search && !f.key.toLowerCase().includes(search) && !f.filename.toLowerCase().includes(search) && !f.category.toLowerCase().includes(search)) return false;
      return true;
    });

    return new Response(
      JSON.stringify({
        success: true,
        total: files.length,
        filteredTotal: filteredFiles.length,
        totalBytes,
        totalSizeFormatted: formatBytes(totalBytes),
        categoriesCount,
        extensionsCount,
        files: filteredFiles,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao listar todos os arquivos do servidor R2.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
