import crypto from "node:crypto";
import { ENCRYPTED_PAYLOAD, PlotMasterRecord } from "@/app/lib/plotMasterData";
import { getAuthenticatedSession } from "@/app/lib/auth";

let dynamicMasterList: PlotMasterRecord[] = [];

function getMasterList(): PlotMasterRecord[] {
  if (dynamicMasterList.length === 0) {
    const rawKey =
      (typeof process !== "undefined" && process.env?.FAF_EUDR_SECRET_KEY) ||
      "";
    if (!rawKey) {
      return [];
    }
    try {
      const secretKey = crypto.createHash("sha256").update(rawKey).digest();
      const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, Buffer.from(ENCRYPTED_PAYLOAD.iv, "hex"));
      let decrypted = decipher.update(ENCRYPTED_PAYLOAD.data, "hex", "utf8");
      decrypted += decipher.final("utf8");
      dynamicMasterList = JSON.parse(decrypted);
    } catch (err) {
      console.error("Erro ao decriptografar dados de IDPLOT no servidor:", err);
      dynamicMasterList = [];
    }
  }
  return dynamicMasterList;
}

export async function GET(request: Request) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return Response.json(
      { error: "Acesso negado. Autenticação obrigatória para consultar talhões." },
      { status: 401 }
    );
  }

  // Clientes não possuem permissão para consultar a base mestra global de talhões de terceiros
  if (session.role === "client") {
    return Response.json(
      { error: "Acesso restrito à equipe operacional e administradores." },
      { status: 403 }
    );
  }

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
    const session = await getAuthenticatedSession(request);
    if (!session) {
      return Response.json(
        { error: "Acesso negado. Autenticação obrigatória." },
        { status: 401 }
      );
    }

    if (session.role !== "admin" && session.role !== "user") {
      return Response.json(
        { error: "Acesso proibido. Apenas administradores e equipe operacional podem cadastrar ou editar talhões." },
        { status: 403 }
      );
    }

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
