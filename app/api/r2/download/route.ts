import { getObjectFromR2 } from "@/app/lib/r2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return new Response(JSON.stringify({ error: "Parâmetro key é obrigatório." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileBuffer = await getObjectFromR2(key);
    if (!fileBuffer) {
      return new Response(JSON.stringify({ error: "Arquivo não encontrado no Cloudflare R2." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filename = key.split("/").pop() || "talhao.geojson";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/geo+json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao baixar arquivo do R2.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
