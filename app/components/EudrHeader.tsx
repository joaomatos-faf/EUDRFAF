"use client";

import React from "react";

interface EudrHeaderProps {
  isAuthenticated: boolean;
  loggedUserRole: "admin" | "user" | "client";
  loggedUserKey: string;
  onOpenAdminModal: () => void;
  onLogout: () => void;
  onNewProcess?: () => void;
  onOpenLogsModal?: () => void;
  onOpenClientPortal?: () => void;
  onOpenLanding?: () => void;
}

export function EudrHeader({
  isAuthenticated,
  loggedUserRole,
  loggedUserKey,
  onOpenAdminModal,
  onLogout,
  onNewProcess,
  onOpenLogsModal,
  onOpenClientPortal,
  onOpenLanding,
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

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#e7f0eb",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🏠 Início
          </button>
        )}

        {isAuthenticated && (
          <>
            {loggedUserRole !== "client" && onNewProcess && (
              <button
                onClick={onNewProcess}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "#e7f0eb",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Novo Processo
              </button>
            )}

            {loggedUserRole !== "client" && onOpenLogsModal && (
              <button
                onClick={onOpenLogsModal}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "#e7f0eb",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📋 Audit Logs
              </button>
            )}

            {loggedUserRole !== "client" && onOpenClientPortal && (
              <button
                onClick={onOpenClientPortal}
                style={{
                  background: "rgba(52, 211, 153, 0.2)",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  color: "#6ee7b7",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ☁️ Arquivos na Nuvem R2
              </button>
            )}

            {loggedUserRole === "admin" && (
              <button
                onClick={onOpenAdminModal}
                style={{
                  background: "#eab308",
                  color: "#1c1917",
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⚙️ Gerenciar Usuários
              </button>
            )}

            <button
              onClick={onLogout}
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                borderRadius: "8px",
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sair ({loggedUserKey})
            </button>
          </>
        )}
      </div>
    </header>
  );
}
