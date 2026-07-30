import { readFile } from "node:fs/promises";
import path from "node:path";
import * as xlsx from "xlsx";

export interface PlotMasterRecord {
  plotId: string;
  farm: string;
  producer: string;
  supplier: string;
  region: string;
  hectares: number;
}

let cachedPlotsMaster: PlotMasterRecord[] | null = null;

async function loadPlotMasterList(): Promise<PlotMasterRecord[]> {
  if (cachedPlotsMaster) return cachedPlotsMaster;

  try {
    const filePath = path.join(process.cwd(), "Lista IDPLOT geojson.xlsx");
    const fileBuffer = await readFile(filePath);
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawRows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    cachedPlotsMaster = rawRows.map((row) => {
      const plotId = String(row["PLOT ID"] || row["plotId"] || "").trim().toUpperCase();
      const farm = String(row["Nome da Fazenda "] || row["Nome da Fazenda"] || row["farm"] || "").trim();
      const producer = String(row["Nome do Produtor "] || row["Nome do Produtor"] || row["producer"] || "").trim();
      const supplier = String(row["Fornecedor"] || row["supplier"] || producer).trim();
      const region = String(row["Região"] || row["region"] || "GERAL").trim();
      const hectares = parseFloat(row["Hectares"] || row["hectares"] || "0") || 0;

      return {
        plotId,
        farm,
        producer,
        supplier,
        region,
        hectares,
      };
    }).filter((p) => p.plotId.length > 0);

    return cachedPlotsMaster;
  } catch (err) {
    console.error("Erro ao carregar Lista IDPLOT geojson.xlsx:", err);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || searchParams.get("plotId") || "").trim().toUpperCase();

  const allPlots = await loadPlotMasterList();

  if (query) {
    const matched = allPlots.filter((p) => p.plotId.includes(query) || p.producer.toUpperCase().includes(query) || p.farm.toUpperCase().includes(query));
    return new Response(JSON.stringify({ plots: matched }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ plots: allPlots }), {
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
    const allPlots = await loadPlotMasterList();

    const existingIdx = allPlots.findIndex((p) => p.plotId === cleanPlotId);
    const newRecord: PlotMasterRecord = {
      plotId: cleanPlotId,
      farm: String(farm).trim(),
      producer: String(producer).trim(),
      supplier: String(supplier || producer).trim(),
      region: String(region).trim() || "GERAL",
      hectares: Number(hectares) || 0,
    };

    if (existingIdx >= 0) {
      allPlots[existingIdx] = newRecord;
    } else {
      allPlots.unshift(newRecord);
    }

    cachedPlotsMaster = allPlots;

    return new Response(JSON.stringify({ success: true, record: newRecord, totalPlots: allPlots.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar talhão na lista master.";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
