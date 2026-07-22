const IBGE_MUNICIPALITIES =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome";

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
    const response = await fetch(IBGE_MUNICIPALITIES, {
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
      { municipalities },
      { headers: { "cache-control": "public, max-age=86400" } },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível carregar a lista de municípios do IBGE." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
