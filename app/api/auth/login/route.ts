import { checkPasswordMatch, createSessionToken, SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { DEFAULT_USERS_DATA, type UserProfile } from "@/app/lib/defaultUsers";

async function getCloudflareEnv() {
  try {
    const cf = await import("cloudflare:workers");
    return cf.env as any;
  } catch {
    return {} as any;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = (body?.username || "").trim().toLowerCase();
    const password = body?.password || "";

    if (!username || !password) {
      return Response.json({ error: "Informe usuário e senha." }, { status: 400, headers: corsHeaders });
    }

    // Load users from Cloudflare KV merged with default users
    let users: Record<string, UserProfile> = { ...DEFAULT_USERS_DATA };
    const cfEnv = await getCloudflareEnv();
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.get === "function") {
      const data = (await cfEnv.USERS_KV.get("faf_eudr_users", { type: "json" })) as Record<string, UserProfile> | null;
      if (data && typeof data === "object") {
        users = { ...DEFAULT_USERS_DATA, ...data };
      }
    }

    const profile = users[username];
    if (!profile) {
      return Response.json({ error: "Usuário ou senha incorretos." }, { status: 401, headers: corsHeaders });
    }

    const storedPass = typeof profile === "string" ? profile : (profile.pass || "");
    const isMatch = await checkPasswordMatch(password, storedPass);

    if (!isMatch) {
      return Response.json({ error: "Usuário ou senha incorretos." }, { status: 401, headers: corsHeaders });
    }

    const fullName = typeof profile === "string" ? username.toUpperCase() : (profile.fullName || username.toUpperCase());
    const role = typeof profile === "string" ? "user" : (profile.role || "user");
    const clientName = typeof profile === "string" ? "" : (profile.clientName || fullName);

    const token = await createSessionToken({
      userKey: username,
      fullName,
      role,
      clientName,
    });

    const maxAge = 7 * 24 * 60 * 60; // 7 days
    const cookieHeader = `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

    return Response.json(
      {
        success: true,
        user: { userKey: username, fullName, role, clientName },
      },
      {
        headers: {
          ...corsHeaders,
          "Set-Cookie": cookieHeader,
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar login.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
