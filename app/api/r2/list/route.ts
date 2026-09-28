import { getAllCloudR2Plots, loadPublishedPlotsFromR2 } from "@/app/lib/clientPortalStore";
import { loadContractsFromR2 } from "@/app/lib/contractStore";
import { getAuthenticatedSession } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);
    if (!session) {
      return Response.json(
        { error: "Acesso negado. Autenticação obrigatória para consultar talhões publicados." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId") || undefined;
    let clientName = searchParams.get("clientName") || undefined;

    // Isolamento multi-tenant: se o usuário for cliente, restringe estritamente aos seus dados
    if (session.role === "client") {
      if (!session.clientName) {
        return Response.json({
          success: true,
          total: 0,
          contractFilter: contractId || "TODOS",
          clientFilter: "NENHUM",
          plots: [],
        });
      }
      clientName = session.clientName;
    }
    
    await loadContractsFromR2();
    await loadPublishedPlotsFromR2();

    const plots = await getAllCloudR2Plots(contractId, clientName);

    return new Response(
      JSON.stringify({
        success: true,
        total: plots.length,
        contractFilter: contractId || "TODOS",
        clientFilter: clientName || "TODOS",
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
