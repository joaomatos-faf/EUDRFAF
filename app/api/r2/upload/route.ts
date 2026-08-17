import { uploadToR2 } from "@/app/lib/r2";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/app/lib/auth";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = new Set([
  "geojson",
  "json",
  "kml",
  "zip",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "xlsx",
  "xls",
  "csv",
  "txt",
]);

function extractCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? match[2] : null;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const cookieHeader = request.headers.get("cookie");
    const sessionToken = extractCookieValue(cookieHeader, SESSION_COOKIE_NAME);
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!session) {
      return Response.json(
        { error: "Acesso negado. Autenticação obrigatória para upload de arquivos." },
        { status: 401 }
      );
    }

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
        return Response.json({ error: "Nenhum arquivo enviado no formulário." }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { error: `Tamanho máximo de arquivo excedido (${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).` },
          { status: 413 }
        );
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      mimeType = file.type || "application/octet-stream";

      if (customKey) {
        key = customKey;
      } else {
        const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
        key = cleanFolder ? `${cleanFolder}/${file.name}` : file.name;
      }
    } else {
      const body = (await request.json()) as {
        key?: string;
        content?: unknown;
        base64?: string;
        contentType?: string;
      };

      if (!body.key || (!body.content && !body.base64)) {
        return Response.json(
          { error: "Parâmetros key e content/base64 são obrigatórios." },
          { status: 400 }
        );
      }

      key = body.key;
      mimeType = body.contentType || "application/json";

      if (body.base64) {
        fileBuffer = Buffer.from(body.base64, "base64");
      } else {
        fileBuffer = Buffer.from(
          typeof body.content === "string" ? body.content : JSON.stringify(body.content, null, 2),
          "utf8"
        );
      }

      if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { error: `Tamanho máximo de payload excedido (${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).` },
          { status: 413 }
        );
      }
    }

    // 2. Sanitize key against Path Traversal
    key = key.replace(/\\/g, "/").replace(/\.\.+/g, "").replace(/^\/+/, "");
    if (!key || key.includes("..")) {
      return Response.json({ error: "Caminho de destino inválido." }, { status: 400 });
    }

    // 3. Validate extension against whitelist
    const ext = (key.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return Response.json(
        { error: `Extensão .${ext} não permitida para upload de compliance EUDR.` },
        { status: 400 }
      );
    }

    if (!fileBuffer) {
      return Response.json({ error: "Conteúdo do arquivo inválido ou vazio." }, { status: 400 });
    }

    // 4. Upload to Cloudflare R2
    const success = await uploadToR2(key, fileBuffer, mimeType);
    if (!success) {
      return Response.json({ error: "Falha ao gravar arquivo no Cloudflare R2." }, { status: 500 });
    }

    return Response.json({
      success: true,
      key,
      size: fileBuffer.length,
      uploadedBy: session.userKey,
      message: "Arquivo enviado e validado com sucesso para a nuvem R2.",
      downloadUrl: `/api/r2/download?key=${encodeURIComponent(key)}`,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Erro interno ao processar upload para R2.";
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
