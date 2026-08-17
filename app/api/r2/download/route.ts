import { getObjectFromR2 } from "@/app/lib/r2";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/app/lib/auth";

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

    // Security: sanitize key against path traversal
    key = key.replace(/\\/g, "/").replace(/\.\.+/g, "").replace(/^\/+/, "");
    if (!key || key.includes("..")) {
      return Response.json({ error: "Caminho de arquivo inválido." }, { status: 400 });
    }

    // Fetch exclusively from Cloudflare R2 Object Storage
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
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao baixar arquivo do R2.";
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
