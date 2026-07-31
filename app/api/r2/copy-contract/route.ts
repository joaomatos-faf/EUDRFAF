import { uploadToR2 } from "@/app/lib/r2";
import { addContract, updateContract, deleteContract, loadContractsFromR2, saveContractsToR2, ContractRecord, ContractLotItem, ContractPlotItem } from "@/app/lib/contractStore";
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

    // Garantir sincronização com os contratos salvos no Cloudflare R2
    const existingContracts = await loadContractsFromR2();
    const isDuplicate = existingContracts.some((c) => c.contractCode === cleanContractCode);

    if (isDuplicate) {
      return new Response(
        JSON.stringify({ error: `Já existe um contrato cadastrado com o código "${cleanContractCode}". Por favor, informe um código de contrato diferente.` }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const processedLots: ContractLotItem[] = [];
    const publishedPlots = getPublishedPlots();

    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      const lotNumber = lot.lotNumber?.trim() || `LOTE_${String(i + 1).padStart(2, "0")}`;
      const cleanLot = sanitizeSegment(lotNumber, `LOTE_${i + 1}`);
      const cleanRegion = sanitizeSegment(lot.region || "GERAL", "GERAL");

      const rawPlots = Array.isArray(lot.plots) ? lot.plots : [];
      const processedPlots: ContractPlotItem[] = [];

      for (let j = 0; j < rawPlots.length; j++) {
        const plotObj = rawPlots[j];
        const rawPlotId = typeof plotObj === "string" ? plotObj : plotObj.plotId || "";
        const plotId = rawPlotId.trim().toUpperCase() || `TALHAO-${j + 1}`;

        const producer = typeof plotObj === "object" ? (plotObj.producer || plotObj.supplier || "PRODUTOR") : "PRODUTOR";
        const supplier = typeof plotObj === "object" ? (plotObj.supplier || producer) : "FORNECEDOR";
        const farm = typeof plotObj === "object" ? (plotObj.farm || "FAZENDA") : "FAZENDA";
        const hectares = typeof plotObj === "object" ? (Number(plotObj.hectares) || 0) : 0;

        const cleanProducer = sanitizeSegment(producer, "PRODUTOR");
        const cleanSupplier = sanitizeSegment(supplier, "FORNECEDOR");
        const cleanFarm = sanitizeSegment(farm, "FAZENDA");

        const sourceKey = `mapping_eudr_data/${cleanRegion}/${cleanProducer}/${cleanFarm}/${plotId}.geojson`;
        const targetKey = `contratos_clientes/${cleanClient}/${cleanContractCode}/${cleanLot}/${plotId}.geojson`;

        let geojsonContent = "";
        const matched = publishedPlots.find((p) => p.plotId === plotId);
        if (matched) {
          geojsonContent = JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  PLOT_ID: plotId,
                  CLIENTE: clientName.trim(),
                  CONTRATO: cleanContractCode,
                  LOTE: cleanLot,
                  HECTARES: hectares,
                },
                geometry: matched.geometry,
              },
            ],
          });
        } else {
          geojsonContent = JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  PLOT_ID: plotId,
                  CLIENTE: clientName.trim(),
                  CONTRATO: cleanContractCode,
                  LOTE: cleanLot,
                  HECTARES: hectares,
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
          producer: cleanProducer,
          supplier: cleanSupplier,
          farm: cleanFarm,
          hectares,
          sourceGeojsonKey: sourceKey,
          targetGeojsonKey: targetKey,
        });
      }

      processedLots.push({
        id: `lot-${Date.now()}-${i}`,
        lotNumber: cleanLot,
        region: cleanRegion,
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
    await saveContractsToR2();

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id = "",
      contractCode = "",
      clientName = "",
      lots = [],
      createdBy = "joao.matos",
    } = body;

    if (!id || !contractCode.trim() || !clientName.trim() || !Array.isArray(lots) || lots.length === 0) {
      return new Response(
        JSON.stringify({ error: "id, contractCode, clientName e ao menos 1 lote são obrigatórios para edição." }),
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
      const cleanRegion = sanitizeSegment(lot.region || "GERAL", "GERAL");

      const rawPlots = Array.isArray(lot.plots) ? lot.plots : [];
      const processedPlots: ContractPlotItem[] = [];

      for (let j = 0; j < rawPlots.length; j++) {
        const plotObj = rawPlots[j];
        const rawPlotId = typeof plotObj === "string" ? plotObj : plotObj.plotId || "";
        const plotId = rawPlotId.trim().toUpperCase() || `TALHAO-${j + 1}`;

        const producer = typeof plotObj === "object" ? (plotObj.producer || plotObj.supplier || "PRODUTOR") : "PRODUTOR";
        const supplier = typeof plotObj === "object" ? (plotObj.supplier || producer) : "FORNECEDOR";
        const farm = typeof plotObj === "object" ? (plotObj.farm || "FAZENDA") : "FAZENDA";
        const hectares = typeof plotObj === "object" ? (Number(plotObj.hectares) || 0) : 0;

        const cleanProducer = sanitizeSegment(producer, "PRODUTOR");
        const cleanSupplier = sanitizeSegment(supplier, "FORNECEDOR");
        const cleanFarm = sanitizeSegment(farm, "FAZENDA");

        const sourceKey = `mapping_eudr_data/${cleanRegion}/${cleanProducer}/${cleanFarm}/${plotId}.geojson`;
        const targetKey = `contratos_clientes/${cleanClient}/${cleanContractCode}/${cleanLot}/${plotId}.geojson`;

        let geojsonContent = "";
        const matched = publishedPlots.find((p) => p.plotId === plotId);
        if (matched) {
          geojsonContent = JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  PLOT_ID: plotId,
                  CLIENTE: clientName.trim(),
                  CONTRATO: cleanContractCode,
                  LOTE: cleanLot,
                  HECTARES: hectares,
                },
                geometry: matched.geometry,
              },
            ],
          });
        } else {
          geojsonContent = JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  PLOT_ID: plotId,
                  CLIENTE: clientName.trim(),
                  CONTRATO: cleanContractCode,
                  LOTE: cleanLot,
                  HECTARES: hectares,
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [[[-46.72, -21.65], [-46.71, -21.65], [-46.71, -21.64], [-46.72, -21.64], [-46.72, -21.65]]],
                },
              },
            ],
          });
        }

        // Atualizar/Sobrescrever o arquivo GeoJSON no Cloudflare R2
        await uploadToR2(targetKey, geojsonContent, "application/geo+json");

        processedPlots.push({
          plotId,
          producer: cleanProducer,
          supplier: cleanSupplier,
          farm: cleanFarm,
          hectares,
          sourceGeojsonKey: sourceKey,
          targetGeojsonKey: targetKey,
        });
      }

      processedLots.push({
        id: `lot-${Date.now()}-${i}`,
        lotNumber: cleanLot,
        region: cleanRegion,
        plots: processedPlots,
      });
    }

    const record: ContractRecord = {
      id,
      contractCode: cleanContractCode,
      clientName: clientName.trim(),
      lots: processedLots,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    updateContract(id, record);
    await saveContractsToR2();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Contrato ${cleanContractCode} para o cliente ${clientName} atualizado com sucesso no R2.`,
        record,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar contrato no R2.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  const contracts = await loadContractsFromR2();
  return new Response(JSON.stringify({ contracts }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
  });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    if (!id) {
      return new Response(JSON.stringify({ error: "ID do contrato é obrigatório." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    deleteContract(id);
    await saveContractsToR2();

    return new Response(
      JSON.stringify({ success: true, message: `Contrato ${id} excluído com sucesso.` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao excluir contrato.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
