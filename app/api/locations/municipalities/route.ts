import { APP_CONFIG } from "../../../lib/config";

type IbgeMunicipality = {
  "municipio-id"?: number;
  "municipio-nome"?: string;
  "UF-sigla"?: string;
  "UF-nome"?: string;
  "regiao-nome"?: string;
};

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(APP_CONFIG.apis.ibgeMunicipalities, {
      cache: "force-cache",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`IBGE respondeu com erro ${response.status}.`);
    const data = await response.json() as IbgeMunicipality[];
    const municipalities = data
      .filter((item) => item["municipio-id"] && item["municipio-nome"] && item["UF-sigla"])
      .map((item) => ({
        id: Number(item["municipio-id"]),
        name: String(item["municipio-nome"]),
        stateCode: String(item["UF-sigla"]),
        stateName: String(item["UF-nome"] ?? item["UF-sigla"]),
        region: String(item["regiao-nome"] ?? ""),
      }));
    return Response.json(
      { success: true, municipalities },
      { headers: { "cache-control": "public, max-age=86400" } },
    );
  } catch {
    return Response.json(
      { success: false, error: "Não foi possível carregar a lista de municípios do IBGE." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
