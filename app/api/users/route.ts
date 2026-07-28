interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user";
}

const DEFAULT_USERS_DATA: Record<string, UserProfile> = {
  faf: { pass: "eudr2026", fullName: "FAF Coffees", role: "admin" },
  admin: { pass: "faf2026", fullName: "Administrador FAF", role: "admin" },
  joao: { pass: "faf1234", fullName: "João Silva", role: "user" },
  joaomatos: { pass: "123", fullName: "João Matos", role: "admin" },
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

export async function POST(request: Request) {
  try {
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

    return Response.json({ success: true, users: newUsers }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar usuários no servidor.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
