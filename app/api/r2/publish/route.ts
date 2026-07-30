import { uploadToR2 } from "@/app/lib/r2";
import { addPublishedPlot, PublishedPlotRecord } from "@/app/lib/clientPortalStore";

function sanitizePathSegment(value: string, fallback: string): string {
  if (!value || !value.trim()) return fallback;
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .replace(/_+/g, "_")
    .toUpperCase() || fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      plotId,
      contractId = "2026-C001",
      producer = "",
      supplier = "",
      farm = "",
      region = "",
      municipality = "",
      state = "",
      area = 0,
      compliance = "CONFORME",
      publishedBy = "usuario.faf",
      geojsonContent = "",
    } = body;

    if (!plotId || !geojsonContent) {
      return new Response(JSON.stringify({ error: "plotId e geojsonContent são obrigatórios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanRegion = sanitizePathSegment(region, "GERAL");
    const cleanSupplier = sanitizePathSegment(supplier || producer, "FORNECEDOR");
    const cleanFarm = sanitizePathSegment(farm, "FAZENDA");
    const cleanContractId = contractId.trim().toUpperCase() || "2026-C001";

    // Estrutura solicitada: mapping_eudr_data > regiao > Fornecedor > Fazenda > geojson
    const geojsonKey = `mapping_eudr_data/${cleanRegion}/${cleanSupplier}/${cleanFarm}/${plotId}.geojson`;

    // Upload APENAS do arquivo GeoJSON para o Cloudflare R2
    await uploadToR2(geojsonKey, geojsonContent, "application/geo+json");

    const record: PublishedPlotRecord = {
      id: `pub-${Date.now()}`,
      plotId,
      contractId: cleanContractId,
      producer: producer || supplier || "N/A",
      supplier: supplier || producer || "N/A",
      farm: farm || "N/A",
      region: cleanRegion,
      municipality,
      state,
      area,
      compliance,
      publishedAt: new Date().toISOString(),
      publishedBy,
      geojsonKey,
    };

    addPublishedPlot(record);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Arquivo GeoJSON enviado com sucesso para o Cloudflare R2 em: ${geojsonKey}`,
        key: geojsonKey,
        record,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro interno ao publicar o GeoJSON no Cloudflare R2.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
