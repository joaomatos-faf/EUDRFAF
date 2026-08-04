import { uploadToR2 } from "@/app/lib/r2";

export async function POST(request: Request) {
  try {
    const contentTypeHeader = request.headers.get("content-type") || "";

    let key = "";
    let fileBuffer: Buffer | null = null;
    let mimeType = "application/octet-stream";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "uploads";
      const customKey = formData.get("key") as string | null;

      if (!file) {
        return new Response(
          JSON.stringify({ error: "Nenhum arquivo enviado no formulário." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      mimeType = file.type || "application/octet-stream";

      if (customKey) {
        key = customKey.replace(/^\/+/, "");
      } else {
        const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
        key = cleanFolder ? `${cleanFolder}/${file.name}` : file.name;
      }
    } else {
      const body = await request.json();
      if (!body.key || (!body.content && !body.base64)) {
        return new Response(
          JSON.stringify({ error: "Parâmetros key e content/base64 são obrigatórios." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      key = body.key.replace(/^\/+/, "");
      mimeType = body.contentType || "application/json";

      if (body.base64) {
        fileBuffer = Buffer.from(body.base64, "base64");
      } else {
        fileBuffer = Buffer.from(typeof body.content === "string" ? body.content : JSON.stringify(body.content, null, 2), "utf8");
      }
    }

    if (!fileBuffer || !key) {
      return new Response(
        JSON.stringify({ error: "Arquivo ou chave de destino inválidos." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const success = await uploadToR2(key, fileBuffer, mimeType);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Falha ao gravar arquivo no Cloudflare R2." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        key,
        size: fileBuffer.length,
        message: "Arquivo enviado com sucesso para a nuvem R2.",
        downloadUrl: `/api/r2/download?key=${encodeURIComponent(key)}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro interno ao processar upload para R2.";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
