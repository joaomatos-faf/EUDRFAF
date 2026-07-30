import { getPublishedPlots } from "@/app/lib/clientPortalStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId") || undefined;
    const plots = getPublishedPlots(contractId);

    return new Response(
      JSON.stringify({
        success: true,
        total: plots.length,
        contractFilter: contractId || "TODOS",
        plots,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao listar talhões publicados.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
