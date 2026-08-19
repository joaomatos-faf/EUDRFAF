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
    | "GEOMETRY_LOADED"
    | "MAPBIOMAS_CHECKED"
    | "GFW_CHECKED"
    | "PACKAGE_EXPORTED"
    | "GEOJSON_EXPORTED"
    | "SHAREPOINT_COPIED"
    | "R2_PUBLISHED"
    | "PROCESS_RESET"
    | "AUDITORIA";
  category: "ACESSO" | "USUARIOS" | "GEOMETRIA" | "MAPBIOMAS" | "GFW" | "EXPORTACAO" | "AUDITORIA";
  details: string;
  plotId?: string;
  meta?: Record<string, unknown>;
}

const LOCAL_STORAGE_LOGS_KEY = "faf_eudr_local_audit_logs";

export function getLocalAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAuditLog(entry: AuditLogEntry): AuditLogEntry[] {
  const current = getLocalAuditLogs();
  const updated = [entry, ...current].slice(0, 500);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(updated));
    } catch {
      // Ignora erro de cota de armazenamento se houver
    }
  }
  return updated;
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const response = await fetch("/api/logs");
    if (response.ok) {
      const data = (await response.json()) as { success?: boolean; logs?: AuditLogEntry[] };
      if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(data.logs));
        }
        return data.logs;
      }
    }
  } catch {
    // Fallback silencioso para o localStorage
  }
  return getLocalAuditLogs();
}

export async function recordAuditLog(
  user: string,
  userFullName: string,
  action: AuditLogEntry["action"],
  category: AuditLogEntry["category"],
  details: string,
  plotId?: string,
  meta?: Record<string, unknown>
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    user: user || "sistema",
    userFullName: userFullName || user || "Usuário do Sistema",
    action,
    category,
    details,
    plotId,
    meta,
  };

  saveLocalAuditLog(entry);

  // Sincroniza assincronamente com o servidor Cloudflare KV
  try {
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log: entry }),
    }).catch(() => {});
  } catch {
    // Erros de rede são ignorados no background
  }

  return entry;
}

export function exportAuditLogsCsv(logs: AuditLogEntry[]): string {
  const headers = ["Data e Hora", "Usuário", "Nome", "Categoria", "Ação", "Código do Talhão", "Detalhes"];
  const rows = logs.map((log) => {
    const formattedDate = new Date(log.timestamp).toLocaleString("pt-BR");
    return [
      `"${formattedDate}"`,
      `"${log.user.replace(/"/g, '""')}"`,
      `"${log.userFullName.replace(/"/g, '""')}"`,
      `"${log.category}"`,
      `"${log.action}"`,
      `"${(log.plotId || "").replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ].join(";");
  });

  return "\uFEFF" + [headers.map((h) => `"${h}"`).join(";"), ...rows].join("\n");
}
