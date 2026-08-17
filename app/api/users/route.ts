interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

const DEFAULT_USERS_DATA: Record<string, UserProfile> = {
  faf: { pass: "eudr2026", fullName: "FAF Coffees", role: "admin" },
  admin: { pass: "faf2026", fullName: "Administrador FAF", role: "admin" },
  joao: { pass: "faf1234", fullName: "João Silva", role: "user" },
  joaomatos: { pass: "123", fullName: "João Matos", role: "admin" },
  cliente: { pass: "cliente123", fullName: "Cliente Demo", role: "client", clientName: "BELCO" },
};

let memoryUsersStore: Record<string, UserProfile> | null = null;

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
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const cfEnv = await getCloudflareEnv();
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.get === "function") {
      const data = await cfEnv.USERS_KV.get("faf_eudr_users", { type: "json" });
      if (data) {
        return Response.json({ success: true, users: data }, { headers: corsHeaders });
      }
    }

    if (memoryUsersStore) {
      return Response.json({ success: true, users: memoryUsersStore }, { headers: corsHeaders });
    }

    return Response.json({ success: true, users: DEFAULT_USERS_DATA }, { headers: corsHeaders });
  } catch {
    return Response.json({ success: true, users: memoryUsersStore || DEFAULT_USERS_DATA }, { headers: corsHeaders });
  }
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (rateLimitMap.size > 1000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
    }
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }

  record.count += 1;
  if (record.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, retryAfter: 0 };
}

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: `Muitas requisições. Aguarde ${rateLimit.retryAfter} segundos.` },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const payload = (await request.json()) as { users?: Record<string, UserProfile> };
    if (!payload?.users || typeof payload.users !== "object") {
      return Response.json({ error: "Dados de usuários inválidos." }, { status: 400, headers: corsHeaders });
    }

    const newUsers = payload.users;
    memoryUsersStore = newUsers;

    const cfEnv = await getCloudflareEnv();
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.put === "function") {
      await cfEnv.USERS_KV.put("faf_eudr_users", JSON.stringify(newUsers));
    }

    return Response.json(
      { success: true, users: newUsers },
      {
        headers: {
          ...corsHeaders,
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar usuários no servidor.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}

