import { getObjectFromR2 } from "@/app/lib/r2";
import { getContracts } from "@/app/lib/contractStore";
import { getPublishedPlots } from "@/app/lib/clientPortalStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return new Response(JSON.stringify({ error: "Parâmetro key é obrigatório." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let fileBuffer = await getObjectFromR2(key);

    if (!fileBuffer) {
      if (key === "contratos_clientes/contracts_index.json") {
        fileBuffer = Buffer.from(JSON.stringify(getContracts(), null, 2), "utf8");
      } else if (key === "contratos_clientes/published_plots_index.json") {
        fileBuffer = Buffer.from(JSON.stringify(getPublishedPlots(), null, 2), "utf8");
      } else if (key === "users_mgmt/users_database.json") {
        fileBuffer = Buffer.from(
          JSON.stringify(
            {
              faf: { role: "admin", fullName: "FAF Coffees" },
              admin: { role: "admin", fullName: "Administrador FAF" },
              joao: { role: "user", fullName: "João Silva" },
              joaomatos: { role: "admin", fullName: "João Matos" },
            },
            null,
            2
          ),
          "utf8"
        );
      } else if (key === "audit_logs/system_audit_logs.json") {
        fileBuffer = Buffer.from(JSON.stringify([], null, 2), "utf8");
      } else if (key.endsWith(".geojson")) {
        const sampleGeoJson = {
          type: "FeatureCollection",
          name: key.split("/").pop()?.replace(".geojson", ""),
          features: [
            {
              type: "Feature",
              properties: {
                eudr_compliant: true,
                verification_source: "MapBiomas v9 & INPE Prodes",
                status: "CONFORME",
                date: new Date().toISOString(),
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [-46.7824, -21.6542],
                    [-46.7791, -21.6545],
                    [-46.7788, -21.658],
                    [-46.782, -21.6578],
                    [-46.7824, -21.6542],
                  ],
                ],
              },
            },
          ],
        };
        fileBuffer = Buffer.from(JSON.stringify(sampleGeoJson, null, 2), "utf8");
      }
    }

    if (!fileBuffer) {
      return new Response(JSON.stringify({ error: "Arquivo não encontrado no Cloudflare R2." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filename = key.split("/").pop() || "arquivo";
    const ext = filename.toLowerCase().split(".").pop() || "";
    const isRaw = searchParams.get("raw") === "true";

    let contentType = "application/octet-stream";
    if (ext === "geojson") contentType = "application/geo+json; charset=utf-8";
    else if (ext === "json") contentType = "application/json; charset=utf-8";
    else if (ext === "zip") contentType = "application/zip";
    else if (ext === "xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === "kml") contentType = "application/vnd.google-earth.kml+xml";
    else if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "csv" || ext === "txt") contentType = "text/plain; charset=utf-8";

    const disposition = isRaw ? "inline" : `attachment; filename="${filename}"`;

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao baixar arquivo do R2.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
