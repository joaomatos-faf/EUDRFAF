import { uploadToR2 } from "@/app/lib/r2";
import { addPublishedPlot, PublishedPlotRecord } from "@/app/lib/clientPortalStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      plotId,
      contractId = "2026-C001",
      producer = "",
      farm = "",
      municipality = "",
      state = "",
      area = 0,
      compliance = "CONFORME",
      publishedBy = "usuario.faf",
      geojsonContent = "",
      xlsxBase64 = "",
      shapeZipBase64 = "",
    } = body;

    if (!plotId || !geojsonContent) {
      return new Response(JSON.stringify({ error: "plotId e geojsonContent são obrigatórios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanContractId = contractId.trim().toUpperCase() || "2026-C001";
    const geojsonKey = `contratos/${cleanContractId}/${plotId}/${plotId}.geojson`;
    const xlsxKey = `contratos/${cleanContractId}/${plotId}/${plotId}-cadastro.xlsx`;
    const shapeKey = `contratos/${cleanContractId}/${plotId}/${plotId}-shapefile.zip`;

    // 1. Upload GeoJSON
    await uploadToR2(geojsonKey, geojsonContent, "application/geo+json");

    // 2. Upload XLSX if provided
    if (xlsxBase64) {
      const xlsxBuffer = Buffer.from(xlsxBase64, "base64");
      await uploadToR2(xlsxKey, xlsxBuffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    // 3. Upload Shapefile ZIP if provided
    if (shapeZipBase64) {
      const zipBuffer = Buffer.from(shapeZipBase64, "base64");
      await uploadToR2(shapeKey, zipBuffer, "application/zip");
    }

    const record: PublishedPlotRecord = {
      id: `pub-${Date.now()}`,
      plotId,
      contractId: cleanContractId,
      producer,
      farm,
      municipality,
      state,
      area,
      compliance,
      publishedAt: new Date().toISOString(),
      publishedBy,
      geojsonKey,
      xlsxKey,
      shapeKey,
    };

    addPublishedPlot(record);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Talhão ${plotId} publicado com sucesso no Cloudflare R2 para o contrato ${cleanContractId}.`,
        record,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro interno ao publicar no Cloudflare R2.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
