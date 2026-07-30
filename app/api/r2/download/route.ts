import { getR2PresignedUrl } from "@/app/lib/r2";

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
