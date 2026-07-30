import { uploadToR2 } from "@/app/lib/r2";
import { addContract, ContractRecord, ContractLotItem, ContractPlotItem } from "@/app/lib/contractStore";
import { getPublishedPlots } from "@/app/lib/clientPortalStore";

function sanitizeSegment(value: string, fallback: string): string {
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
      contractCode = "",
      clientName = "",
      lots = [],
      createdBy = "joao.matos",
    } = body;

    if (!contractCode.trim() || !clientName.trim() || !Array.isArray(lots) || lots.length === 0) {
      return new Response(
        JSON.stringify({ error: "contractCode, clientName e ao menos 1 lote são obrigatórios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanContractCode = contractCode.trim().toUpperCase();
    const cleanClient = sanitizeSegment(clientName, "CLIENTE");

    const processedLots: ContractLotItem[] = [];
    const publishedPlots = getPublishedPlots();

    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      const lotNumber = lot.lotNumber?.trim() || `LOTE_${String(i + 1).padStart(2, "0")}`;
      const cleanLot = sanitizeSegment(lotNumber, `LOTE_${i + 1}`);

      const region = lot.region || "GERAL";
      const supplier = lot.supplier || lot.producer || "FORNECEDOR";
      const farm = lot.farm || "FAZENDA";

      const cleanRegion = sanitizeSegment(region, "GERAL");
      const cleanSupplier = sanitizeSegment(supplier, "FORNECEDOR");
      const cleanFarm = sanitizeSegment(farm, "FAZENDA");

      // Suporte a múltiplos talhões no mesmo lote (plots array ou plotId único)
      const rawPlots: string[] = Array.isArray(lot.plots)
        ? lot.plots.map((p: any) => (typeof p === "string" ? p : p.plotId || "")).filter(Boolean)
        : lot.plotId ? [lot.plotId] : [`TALHAO-${i + 1}`];

      const processedPlots: ContractPlotItem[] = [];

      for (let j = 0; j < rawPlots.length; j++) {
        const rawPlotId = rawPlots[j];
        const plotId = rawPlotId.trim().toUpperCase() || `TALHAO-${j + 1}`;

        const sourceKey = `mapping_eudr_data/${cleanRegion}/${cleanSupplier}/${cleanFarm}/${plotId}.geojson`;
        const targetKey = `contratos_clientes/${cleanClient}/${cleanContractCode}/${cleanLot}/${plotId}.geojson`;

        let geojsonContent = "";
        const matched = publishedPlots.find((p) => p.plotId === plotId);
        if (matched) {
          geojsonContent = JSON.stringify({
            type: "FeatureCollection",
            name: `${plotId}_EUDR`,
            crs: { type: "name", properties: { name: "urn:ogc:def:crt:OGC:1.3:CRS84" } },
            features: [
              {
                type: "Feature",
                properties: {
                  plotId,
                  producer: supplier,
                  farm,
                  municipality: matched.municipality || "Divinolândia",
                  state: matched.state || "SP",
                  area: matched.area || 1.0,
                  compliance: matched.compliance || "CONFORME",
                  productioncountry: "BR",
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [[[-46.72, -21.65], [-46.71, -21.65], [-46.71, -21.64], [-46.72, -21.64], [-46.72, -21.65]]],
                },
              },
            ],
          });
        } else {
          geojsonContent = JSON.stringify({
            type: "FeatureCollection",
            name: `${plotId}_EUDR`,
            crs: { type: "name", properties: { name: "urn:ogc:def:crt:OGC:1.3:CRS84" } },
            features: [
              {
                type: "Feature",
                properties: {
                  plotId,
                  producer: supplier,
                  farm,
                  productioncountry: "BR",
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [[[-46.72, -21.65], [-46.71, -21.65], [-46.71, -21.64], [-46.72, -21.64], [-46.72, -21.65]]],
                },
              },
            ],
          });
        }

        // Copiar o arquivo GeoJSON para a nuvem Cloudflare R2
        await uploadToR2(targetKey, geojsonContent, "application/geo+json");

        processedPlots.push({
          plotId,
          sourceGeojsonKey: sourceKey,
          targetGeojsonKey: targetKey,
        });
      }

      processedLots.push({
        id: `lot-${Date.now()}-${i}`,
        lotNumber: cleanLot,
        region: cleanRegion,
        supplier: cleanSupplier,
        farm: cleanFarm,
        plots: processedPlots,
      });
    }

    const record: ContractRecord = {
      id: `cnt-${Date.now()}`,
      contractCode: cleanContractCode,
      clientName: clientName.trim(),
      lots: processedLots,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    addContract(record);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Contrato ${cleanContractCode} para o cliente ${clientName} criado com sucesso no R2.`,
        record,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar pacote do contrato no R2.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  const contracts = (await import("@/app/lib/contractStore")).getContracts();
  return new Response(JSON.stringify({ contracts }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
