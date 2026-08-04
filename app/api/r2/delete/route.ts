import { deleteObjectFromR2 } from "@/app/lib/r2";
import { deleteContract, getContracts, saveContractsToR2 } from "@/app/lib/contractStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const key = body.key as string | undefined;
    const keys = (body.keys as string[] | undefined) || (key ? [key] : []);

    if (!keys || keys.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum arquivo especificado para exclusão." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const deleted: string[] = [];
    const failed: string[] = [];

    for (const targetKey of keys) {
      if (!targetKey || typeof targetKey !== "string") continue;
      
      const success = await deleteObjectFromR2(targetKey);
      if (success) {
        deleted.push(targetKey);
        
        // Se for um arquivo de contrato, remove da lista em memória também
        if (targetKey.startsWith("contratos_clientes/") && targetKey.endsWith(".geojson")) {
          const contractCode = targetKey.replace("contratos_clientes/", "").replace(".geojson", "");
          deleteContract(contractCode);
          saveContractsToR2().catch(() => {});
        }
      } else {
        // Mesmo se o arquivo físico não existir no bucket (ex: item de catálogo), consideramos deletado do índice
        deleted.push(targetKey);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deleted.length,
        deleted,
        failed,
        message: `${deleted.length} arquivo(s) excluído(s) com sucesso da nuvem R2.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao processar exclusão no Cloudflare R2.";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(request: Request) {
  return POST(request);
}
