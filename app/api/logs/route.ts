export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userFullName: string;
  action:
    | "LOGIN"
    | "LOGOUT"
    | "USER_CREATED"
    | "USER_UPDATED"
    | "PASSWORD_CHANGED"
    | "FILE_UPLOADED"
    | "MAPBIOMAS_CHECKED"
    | "GFW_CHECKED"
    | "PACKAGE_EXPORTED"
    | "PROCESS_RESET";
  category: "ACESSO" | "USUARIOS" | "GEOMETRIA" | "MAPBIOMAS" | "GFW" | "EXPORTACAO";
  details: string;
  plotId?: string;
  meta?: Record<string, unknown>;
}

let memoryLogsStore: AuditLogEntry[] = [];

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
      const data = await cfEnv.USERS_KV.get("faf_eudr_audit_logs", { type: "json" });
      if (Array.isArray(data)) {
        return Response.json({ success: true, logs: data }, { headers: corsHeaders });
      }
    }

    return Response.json({ success: true, logs: memoryLogsStore }, { headers: corsHeaders });
  } catch {
    return Response.json({ success: true, logs: memoryLogsStore }, { headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { log?: AuditLogEntry; logs?: AuditLogEntry[] };
    let currentLogs: AuditLogEntry[] = [];

    const cfEnv = await getCloudflareEnv();
    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.get === "function") {
      const existing = await cfEnv.USERS_KV.get("faf_eudr_audit_logs", { type: "json" });
      if (Array.isArray(existing)) {
        currentLogs = existing as AuditLogEntry[];
      }
    } else {
      currentLogs = [...memoryLogsStore];
    }

    if (payload.log) {
      currentLogs.unshift(payload.log);
    } else if (Array.isArray(payload.logs)) {
      currentLogs = [...payload.logs, ...currentLogs];
    }

    // Limita o histórico a 500 registros para otimizar desempenho
    if (currentLogs.length > 500) {
      currentLogs = currentLogs.slice(0, 500);
    }

    memoryLogsStore = currentLogs;

    if (cfEnv?.USERS_KV && typeof cfEnv.USERS_KV.put === "function") {
      await cfEnv.USERS_KV.put("faf_eudr_audit_logs", JSON.stringify(currentLogs));
    }

    return Response.json({ success: true, logs: currentLogs }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao registrar log de auditoria.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
