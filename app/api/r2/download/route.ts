import { getR2PresignedUrl, getObjectFromR2 } from "@/app/lib/r2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const isRaw = searchParams.get("raw") === "true";

    if (!key) {
      return new Response(JSON.stringify({ error: "Parâmetro key é obrigatório." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isRaw) {
      const fileBuffer = await getObjectFromR2(key);
      if (!fileBuffer) {
        return new Response(JSON.stringify({ error: "Arquivo não encontrado no R2." }), {
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
        },
      });
    }

    const downloadUrl = await getR2PresignedUrl(key, 900); // 15 minutos

    return new Response(
      JSON.stringify({
        success: true,
        key,
        downloadUrl,
        expiresInSeconds: 900,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao gerar link de download do Cloudflare R2.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
