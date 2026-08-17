import { hashPassword, SESSION_COOKIE_NAME, verifySessionToken } from "@/app/lib/auth";
import { DEFAULT_USERS_DATA, type UserProfile } from "@/app/lib/defaultUsers";

interface PublicUserProfile {
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

let memoryUsersStore: Record<string, UserProfile> | null = null;

async function getCloudflareEnv() {
  try {
    const cf = await import("cloudflare:workers");
    return cf.env as any;
  } catch {
    return {} as any;
  }
}

function extractCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Sanitizes user records so that passwords are NEVER returned in GET responses
 */
function sanitizeUsersForPublic(users: Record<string, UserProfile>): Record<string, PublicUserProfile> {
  const sanitized: Record<string, PublicUserProfile> = {};
  for (const [key, profile] of Object.entries(users)) {
    if (typeof profile === "object" && profile !== null) {
      sanitized[key] = {
        fullName: profile.fullName || key.toUpperCase(),
        role: profile.role || "user",
        clientName: profile.clientName,
      };
    }
  }
  return sanitized;
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

export async function GET() {
  try {
    const cfEnv = await getCloudflareEnv();
    let currentUsers = DEFAULT_USERS_DATA;

    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.get === "function") {
      const data = await cfEnv.USERS_KV.get("faf_eudr_users", { type: "json" });
      if (data && typeof data === "object") {
        currentUsers = data;
      }
    } else if (memoryUsersStore) {
      currentUsers = memoryUsersStore;
    }

    // Security: NEVER return password hashes or plaintext in GET
    const publicUsers = sanitizeUsersForPublic(currentUsers);
    return Response.json({ success: true, users: publicUsers });
  } catch {
    const publicUsers = sanitizeUsersForPublic(memoryUsersStore || DEFAULT_USERS_DATA);
    return Response.json({ success: true, users: publicUsers });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Protection
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
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Security: Verify Administrator Session
    const cookieHeader = request.headers.get("cookie");
    const sessionToken = extractCookieValue(cookieHeader, SESSION_COOKIE_NAME);
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!session || session.role !== "admin") {
      return Response.json(
        { error: "Acesso negado. Apenas administradores autenticados podem gerenciar usuários." },
        { status: 403 }
      );
    }

    // 3. Process and Hash Any Plaintext Passwords with PBKDF2
    const payload = (await request.json()) as { users?: Record<string, UserProfile> };
    if (!payload?.users || typeof payload.users !== "object") {
      return Response.json({ error: "Dados de usuários inválidos." }, { status: 400 });
    }

    const processedUsers: Record<string, UserProfile> = {};
    for (const [username, profile] of Object.entries(payload.users)) {
      if (typeof profile === "object" && profile !== null) {
        let pass = profile.pass || "";
        // If password is not yet hashed with PBKDF2 or legacy SHA-256, hash it with PBKDF2
        if (pass && !pass.startsWith("pbkdf2:") && pass.length !== 64) {
          pass = await hashPassword(pass);
        }
        processedUsers[username] = {
          pass,
          fullName: profile.fullName || username.toUpperCase(),
          role: profile.role || "user",
          clientName: profile.clientName,
        };
      }
    }

    memoryUsersStore = processedUsers;

    const cfEnv = await getCloudflareEnv();
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.put === "function") {
      await cfEnv.USERS_KV.put("faf_eudr_users", JSON.stringify(processedUsers));
    }

    const publicUsers = sanitizeUsersForPublic(processedUsers);
    return Response.json(
      { success: true, users: publicUsers },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar usuários no servidor.";
    return Response.json({ error: message }, { status: 500 });
  }
}
