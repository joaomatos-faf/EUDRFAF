"use client";

import React from "react";

interface EudrHeaderProps {
  isAuthenticated: boolean;
  loggedUserRole: "admin" | "user";
  loggedUserKey: string;
  onOpenAdminModal: () => void;
  onLogout: () => void;
  onNewProcess?: () => void;
  onOpenLogsModal?: () => void;
}

export function EudrHeader({
  isAuthenticated,
  loggedUserRole,
  loggedUserKey,
  onOpenAdminModal,
  onLogout,
  onNewProcess,
  onOpenLogsModal,
}: EudrHeaderProps) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark">FAF</div>
        <div>
          <p className="eyebrow">FAF COFFEES · SUSTENTABILIDADE & CONFORMIDADE</p>
          <h1>Preparador de Dossiê EUDR</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <span className="privacy-pill">
          <span></span>Privacidade local ativada
        </span>

        {isAuthenticated && (
          <>
            {onNewProcess && (
              <button
                onClick={onNewProcess}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "#e7f0eb",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 650,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 0.16s ease, border-color 0.16s ease",
                }}
                title="Limpar formulário e iniciar o mapeamento de um novo talhão"
              >
                <span style={{ fontSize: "13px" }}>＋</span> Novo Processo
              </button>
            )}
            {onOpenLogsModal && (
              <button
                onClick={onOpenLogsModal}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  color: "#dce8e2",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title="Visualizar histórico e logs de auditoria"
              >
                📋 Logs
              </button>
            )}
            <button
              onClick={onOpenAdminModal}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#dce8e2",
                borderRadius: "8px",
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {loggedUserRole === "admin" ? "⚙️ Usuários" : "🔑 Minha Senha"}
            </button>
            <button
              onClick={onLogout}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffd1d1",
                borderRadius: "8px",
                padding: "7px 10px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Sair ({loggedUserKey})
            </button>
          </>
        )}

        <span className="version-pill">v0.2.1</span>
      </div>
    </header>
  );
}
