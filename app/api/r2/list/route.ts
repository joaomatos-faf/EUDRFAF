import { getAllCloudR2Plots, loadPublishedPlotsFromR2 } from "@/app/lib/clientPortalStore";
import { loadContractsFromR2 } from "@/app/lib/contractStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId") || undefined;
    const clientName = searchParams.get("clientName") || undefined;
    
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
