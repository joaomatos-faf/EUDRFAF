import { SESSION_COOKIE_NAME, verifySessionToken } from "@/app/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

function extractCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? match[2] : null;
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const token = extractCookieValue(cookieHeader, SESSION_COOKIE_NAME);

    if (!token) {
      return Response.json({ authenticated: false }, { headers: corsHeaders });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return Response.json({ authenticated: false }, { headers: corsHeaders });
    }

    return Response.json(
      {
        authenticated: true,
        user: {
          userKey: session.userKey,
          fullName: session.fullName,
          role: session.role,
          clientName: session.clientName,
          exp: session.exp,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao verificar sessão.";
    return Response.json({ authenticated: false, error: message }, { status: 500, headers: corsHeaders });
  }
}
