import { getObjectFromR2 } from "@/app/lib/r2";
import { isAuthorizedForStorageKey, SESSION_COOKIE_NAME, verifySessionToken } from "@/app/lib/auth";

function extractCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? match[2] : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawKey = searchParams.get("key");

    if (!rawKey) {
      return Response.json({ error: "Parâmetro key é obrigatório." }, { status: 400 });
    }

    let key = rawKey;
    try {
      key = decodeURIComponent(rawKey);
    } catch {}

    // Security: Strict validation against Path Traversal and illegal characters
    if (
      key.includes("..") ||
      key.includes("\\") ||
      key.includes("\0") ||
      key.startsWith("/") ||
      key.split("/").some((segment) => segment === "." || segment === ".." || !segment.trim())
    ) {
      return Response.json(
        { error: "Caminho de arquivo inválido ou suspeito." },
        { status: 400 }
      );
    }

    // 1. Authenticate user session
    const cookieHeader = request.headers.get("cookie");
    let sessionToken = extractCookieValue(cookieHeader, SESSION_COOKIE_NAME);

    if (!sessionToken) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        sessionToken = authHeader.substring(7).trim();
      } else if (searchParams.get("token")) {
        sessionToken = searchParams.get("token")!;
      }
    }

    if (!sessionToken) {
      return Response.json(
        { error: "Acesso negado. Autenticação obrigatória para download de arquivos." },
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

    // 2. Resource-level Multi-Tenant Access Authorization
    const authorized = isAuthorizedForStorageKey(session.role, session.clientName, key);
    if (!authorized) {
      return Response.json(
        { error: "Acesso proibido. Você não possui permissão para acessar arquivos deste cliente ou pasta restrita." },
        { status: 403 }
      );
    }

    // 3. Fetch exclusively from Cloudflare R2 Object Storage
    const fileBuffer = await getObjectFromR2(key);

    if (!fileBuffer) {
      return Response.json(
        { error: "Arquivo ou geometria real não encontrada no Cloudflare R2." },
        { status: 404 }
      );
    }

    const filename = key.split("/").pop() || "arquivo";
    const ext = filename.toLowerCase().split(".").pop() || "";
    const isRaw = searchParams.get("raw") === "true";

    let contentType = "application/octet-stream";
    if (ext === "geojson") contentType = "application/geo+json; charset=utf-8";
    else if (ext === "json") contentType = "application/json; charset=utf-8";
    else if (ext === "zip") contentType = "application/zip";
    else if (ext === "xlsx")
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === "kml") contentType = "application/vnd.google-earth.kml+xml";
    else if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "csv" || ext === "txt") contentType = "text/plain; charset=utf-8";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";

    const disposition = isRaw ? "inline" : `attachment; filename="${filename}"`;

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao baixar arquivo do R2.";
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
