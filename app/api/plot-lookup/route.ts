import { getDecryptedPlotMasterList, PlotMasterRecord } from "@/app/lib/plotMasterData";

let dynamicMasterList: PlotMasterRecord[] = [];

function getMasterList(): PlotMasterRecord[] {
  if (dynamicMasterList.length === 0) {
    dynamicMasterList = [...getDecryptedPlotMasterList()];
  }
  return dynamicMasterList;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || searchParams.get("plotId") || "").trim().toUpperCase();

  const currentList = getMasterList();

  if (query) {
    const cleanQuery = query.replace(/[^A-Z0-9]/g, "");
    const matched = currentList.filter((p) => {
      const cleanP = p.plotId.replace(/[^A-Z0-9]/g, "");
      return (
        p.plotId.includes(query) ||
        cleanP === cleanQuery ||
        p.producer.toUpperCase().includes(query) ||
        p.farm.toUpperCase().includes(query)
      );
    });
    return new Response(JSON.stringify({ plots: matched }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ plots: currentList }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plotId, farm = "", producer = "", supplier = "", region = "", hectares = 0 } = body;

    if (!plotId) {
      return new Response(JSON.stringify({ error: "plotId é obrigatório." }), { status: 400 });
    }

    const cleanPlotId = String(plotId).trim().toUpperCase();
    const currentList = getMasterList();

    const existingIdx = currentList.findIndex((p) => p.plotId === cleanPlotId);
    const newRecord: PlotMasterRecord = {
      plotId: cleanPlotId,
      farm: String(farm).trim(),
      producer: String(producer).trim(),
      supplier: String(supplier || producer).trim(),
      region: String(region).trim() || "GERAL",
      hectares: Number(hectares) || 0,
    };

    if (existingIdx >= 0) {
      currentList[existingIdx] = newRecord;
    } else {
      currentList.unshift(newRecord);
    }

    return new Response(
      JSON.stringify({ success: true, record: newRecord, totalPlots: currentList.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar talhão na lista master.";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
