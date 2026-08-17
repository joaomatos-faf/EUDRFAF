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

/**
 * Validates actual binary content / structure against declared file extension
 */
function validateFileContent(buffer: Buffer, ext: string): { valid: boolean; error?: string } {
  if (buffer.length === 0) {
    return { valid: false, error: "Arquivo vazio (0 bytes)." };
  }

  // 1. Image & Binary Magic Bytes
  if (ext === "zip" || ext === "xlsx") {
    // ZIP / OOXML magic bytes: PK (0x50 0x4B)
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return { valid: false, error: "Arquivo ZIP/Excel corrompido ou com assinatura inválida." };
    }
  } else if (ext === "pdf") {
    // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
    if (buffer.length < 4 || buffer.toString("utf8", 0, 4) !== "%PDF") {
      return { valid: false, error: "Arquivo PDF com assinatura binária inválida." };
    }
  } else if (ext === "png") {
    // PNG magic bytes: \x89PNG
    if (
      buffer.length < 8 ||
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47
    ) {
      return { valid: false, error: "Arquivo PNG com cabeçalho binário inválido." };
    }
  } else if (ext === "jpg" || ext === "jpeg") {
    // JPEG magic bytes: FF D8 FF
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return { valid: false, error: "Arquivo JPEG com cabeçalho binário inválido." };
    }
  } else if (ext === "geojson" || ext === "json") {
    // JSON / GeoJSON content parsing validation
    try {
      const text = buffer.toString("utf8");
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null) {
        return { valid: false, error: "Estrutura JSON inválida." };
      }
      if (ext === "geojson") {
        if (!parsed.type) {
          return { valid: false, error: "GeoJSON deve possuir um campo 'type' (FeatureCollection, Feature ou Polygon)." };
        }
      }
    } catch {
      return { valid: false, error: "Conteúdo não é um JSON válido." };
    }
  } else if (ext === "kml") {
    // KML XML validation
    const text = buffer.toString("utf8");
    if (!text.includes("<") || (!text.includes("kml") && !text.includes("coordinates"))) {
      return { valid: false, error: "Conteúdo KML/XML inválido." };
    }
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const cookieHeader = request.headers.get("cookie");
    let sessionToken = extractCookieValue(cookieHeader, SESSION_COOKIE_NAME);

    if (!sessionToken) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        sessionToken = authHeader.substring(7).trim();
      }
    }

    if (!sessionToken) {
      return Response.json(
        { error: "Acesso negado. Autenticação obrigatória para upload de arquivos." },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(sessionToken);
    if (!session) {
      return Response.json(
        { error: "Sessão expirada ou inválida. Faça login novamente." },
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

    // 2. Strict key validation against Path Traversal & invalid characters
    if (
      key.includes("..") ||
      key.includes("\\") ||
      key.includes("\0") ||
      key.startsWith("/") ||
      key.split("/").some((segment) => segment === "." || segment === ".." || !segment.trim())
    ) {
      return Response.json({ error: "Caminho de destino inválido ou suspeito." }, { status: 400 });
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

    // 4. Real Content / Magic Bytes Inspection
    const contentValidation = validateFileContent(fileBuffer, ext);
    if (!contentValidation.valid) {
      return Response.json({ error: contentValidation.error }, { status: 400 });
    }

    // 5. Upload to Cloudflare R2
    const success = await uploadToR2(key, fileBuffer, mimeType);
    if (!success) {
      return Response.json({ error: "Falha ao gravar arquivo no Cloudflare R2." }, { status: 500 });
    }

    return Response.json({
      success: true,
      key,
      size: fileBuffer.length,
      uploadedBy: session.userKey,
      message: "Arquivo validado e armazenado com sucesso no Cloudflare R2.",
      downloadUrl: `/api/r2/download?key=${encodeURIComponent(key)}`,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Erro interno ao processar upload para R2.";
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
