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
  onOpenCloudExplorer?: () => void;
  onOpenLanding?: () => void;
  onOpenDashboard?: () => void;
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
  onOpenCloudExplorer,
  onOpenLanding,
  onOpenDashboard,
}: EudrHeaderProps) {
  return (
    <header className="topbar">
      <div className="brand-lockup" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <img
          src="/faf-logo-transparent.png"
          alt="FAF Coffees"
          style={{ height: "42px", width: "auto", objectFit: "contain", display: "block" }}
        />
        <div>
          <p className="eyebrow" style={{ color: "#dfa84a", fontSize: "10.5px", fontWeight: 800, margin: "0 0 2px" }}>
            FAF COFFEES · SUSTENTABILIDADE & CONFORMIDADE
          </p>
          <h1 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#ffffff" }}>
            Preparador de Dossiê EUDR
          </h1>
        </div>
      </div>

      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span className="privacy-pill">
          <span></span>Privacidade local ativada
        </span>

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(209, 160, 104, 0.25)",
              color: "#fcf9f5",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🏠 Início
          </button>
        )}

        {onOpenDashboard && (
          <button
            onClick={onOpenDashboard}
            style={{
              background: "linear-gradient(135deg, rgba(209, 160, 104, 0.2), rgba(189, 40, 32, 0.15))",
              border: "1px solid rgba(209, 160, 104, 0.4)",
              color: "#dfa84a",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            📊 Dashboard & Métricas
          </button>
        )}

        {isAuthenticated && (
          <>
            {loggedUserRole !== "client" && onNewProcess && (
              <button
                onClick={onNewProcess}
                style={{
                  background: "linear-gradient(135deg, #bd2820, #8d1b15)",
                  border: "1px solid rgba(209, 160, 104, 0.3)",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(189, 40, 32, 0.3)",
                }}
              >
                + Novo Processo
              </button>
            )}

            {loggedUserRole !== "client" && onOpenLogsModal && (
              <button
                onClick={onOpenLogsModal}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(209, 160, 104, 0.25)",
                  color: "#fcf9f5",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📋 Audit Logs
              </button>
            )}

            {loggedUserRole === "admin" && (
              <button
                onClick={onOpenAdminModal}
                style={{
                  background: "linear-gradient(135deg, #d1a068, #a8793e)",
                  color: "#1a0f0d",
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(209, 160, 104, 0.3)",
                }}
              >
                ⚙️ Gerenciar Usuários
              </button>
            )}

            <button
              onClick={onLogout}
              style={{
                background: "rgba(189, 40, 32, 0.15)",
                border: "1px solid rgba(189, 40, 32, 0.35)",
                color: "#fca5a5",
                borderRadius: "8px",
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: 700,
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
