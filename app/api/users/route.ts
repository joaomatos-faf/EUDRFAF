import { env } from "cloudflare:workers";

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

// Servidor em memória compartilhado
let memoryUsersStore: Record<string, UserProfile> | null = null;

export async function GET() {
  try {
    const cfEnv = env as any;
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.get === "function") {
      const data = await cfEnv.USERS_KV.get("faf_eudr_users", { type: "json" });
      if (data) {
        return Response.json({ users: data });
      }
    }

    if (memoryUsersStore) {
      return Response.json({ users: memoryUsersStore });
    }

    return Response.json({ users: DEFAULT_USERS_DATA });
  } catch {
    return Response.json({ users: memoryUsersStore || DEFAULT_USERS_DATA });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { users?: Record<string, UserProfile> };
    if (!payload?.users || typeof payload.users !== "object") {
      return Response.json({ error: "Dados de usuários inválidos." }, { status: 400 });
    }

    const newUsers = payload.users;
    memoryUsersStore = newUsers;

    const cfEnv = env as any;
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.put === "function") {
      await cfEnv.USERS_KV.put("faf_eudr_users", JSON.stringify(newUsers));
    }

    return Response.json({ success: true, users: newUsers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar usuários no servidor.";
    return Response.json({ error: message }, { status: 500 });
  }
}
