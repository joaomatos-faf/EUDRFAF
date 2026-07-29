"use client";

import React, { useEffect, useState } from "react";
import { AuditLogEntry } from "../api/logs/route";
import { fetchAuditLogs, exportAuditLogsCsv } from "../lib/auditLogger";
import { downloadBlob } from "../lib/eudr";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("TODAS");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAuditLogs()
        .then((data) => setLogs(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === "TODAS" || log.category === categoryFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      log.user.toLowerCase().includes(searchLower) ||
      log.userFullName.toLowerCase().includes(searchLower) ||
      log.details.toLowerCase().includes(searchLower) ||
      (log.plotId && log.plotId.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  const handleExportCsv = () => {
    const csvContent = exportAuditLogsCsv(filteredLogs);
    const filename = `eudr-logs-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(filename, new Blob([csvContent], { type: "text/csv;charset=utf-8" }));
  };

  const getCategoryBadgeStyle = (category: AuditLogEntry["category"]) => {
    switch (category) {
      case "ACESSO":
        return { background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe" };
      case "USUARIOS":
        return { background: "#f3e8ff", color: "#6b21a8", border: "1px solid #e9d5ff" };
      case "GEOMETRIA":
        return { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" };
      case "MAPBIOMAS":
        return { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" };
      case "EXPORTACAO":
        return { background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" };
      default:
        return { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: "rgba(16, 44, 36, 0.65)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          maxHeight: "88vh",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--forest-950)",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.12)",
                display: "grid",
                placeItems: "center",
                fontSize: "18px",
              }}
            >
              📋
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#fff" }}>
                Logs de Auditoria & Atividades
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#b8c9c1" }}>
                Histórico completo de acessos, alterações e exportações do sistema.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "16px",
              display: "grid",
              placeItems: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            padding: "14px 24px",
            background: "var(--canvas)",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Buscar por usuário, código de talhão ou texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid var(--line-strong)",
                background: "#fff",
                minHeight: "36px",
              }}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: "auto",
                minWidth: "150px",
                padding: "8px 12px",
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid var(--line-strong)",
                background: "#fff",
                minHeight: "36px",
              }}
            >
              <option value="TODAS">Todas Categorias</option>
              <option value="ACESSO">🔑 Acesso / Login</option>
              <option value="USUARIOS">👤 Usuários</option>
              <option value="GEOMETRIA">🗺️ Geometria</option>
              <option value="MAPBIOMAS">🌳 MapBiomas</option>
              <option value="EXPORTACAO">📦 Exportação</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            style={{
              padding: "8px 14px",
              background: "var(--forest-800)",
              color: "#fff",
              border: 0,
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: filteredLogs.length === 0 ? "not-allowed" : "pointer",
              opacity: filteredLogs.length === 0 ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📥 Exportar Logs (CSV)
          </button>
        </div>

        {/* Log Table Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              Carregando registros de auditoria...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Nenhum log encontrado.</p>
              <small style={{ color: "var(--subtle)" }}>Tente alterar os filtros de busca.</small>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px", color: "var(--muted)", fontWeight: 700 }}>Data / Hora</th>
                  <th style={{ padding: "8px 10px", color: "var(--muted)", fontWeight: 700 }}>Usuário</th>
                  <th style={{ padding: "8px 10px", color: "var(--muted)", fontWeight: 700 }}>Categoria</th>
                  <th style={{ padding: "8px 10px", color: "var(--muted)", fontWeight: 700 }}>Talhão</th>
                  <th style={{ padding: "8px 10px", color: "var(--muted)", fontWeight: 700 }}>Detalhes da Atividade</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const badgeStyle = getCategoryBadgeStyle(log.category);
                  const dateStr = new Date(log.timestamp).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid #edf1ee",
                        transition: "background 0.12s ease",
                      }}
                    >
                      <td style={{ padding: "10px", color: "var(--muted)", whiteSpace: "nowrap", fontWeight: 500 }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        <strong style={{ color: "var(--forest-950)", display: "block" }}>
                          {log.userFullName || log.user}
                        </strong>
                        <span style={{ color: "var(--subtle)", fontSize: "10px" }}>@{log.user}</span>
                      </td>
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: 750,
                            letterSpacing: "0.03em",
                            ...badgeStyle,
                          }}
                        >
                          {log.category}
                        </span>
                      </td>
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        {log.plotId ? (
                          <code
                            style={{
                              background: "var(--canvas)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 700,
                              color: "var(--forest-900)",
                            }}
                          >
                            {log.plotId}
                          </code>
                        ) : (
                          <span style={{ color: "var(--subtle)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px", color: "var(--ink)", lineHeight: 1.4 }}>{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "12px 24px",
            background: "var(--canvas)",
            borderTop: "1px solid var(--line)",
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "var(--muted)",
          }}
        >
          <span>Exibindo {filteredLogs.length} de {logs.length} registros</span>
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px",
              background: "#fff",
              border: "1px solid var(--line-strong)",
              borderRadius: "8px",
              fontWeight: 700,
              color: "var(--forest-950)",
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
