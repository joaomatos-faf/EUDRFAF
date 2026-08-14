"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/app/hooks/useTheme";

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
  const { isDark } = useTheme();

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <img
          src="/faf-logo-transparent.png"
          alt="FAF Coffees"
          style={{
            height: "40px",
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="eyebrow">
            FAF Coffees · Agronomia & Operações
          </span>
          <h1>
            Preparador de Dossiê EUDR
          </h1>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeToggle />

        <span className="privacy-pill">
          <span />
          WGS84 Submétrico
        </span>

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 650,
              boxShadow: "var(--shadow-subtle)",
              transition: "all 0.15s ease",
            }}
          >
            🏠 Início
          </button>
        )}

        {onOpenDashboard && (
          <button
            onClick={onOpenDashboard}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 650,
              boxShadow: "var(--shadow-subtle)",
              transition: "all 0.15s ease",
            }}
          >
            📊 Dashboard
          </button>
        )}

        {isAuthenticated && (
          <>
            {loggedUserRole !== "client" && onNewProcess && (
              <button
                onClick={onNewProcess}
                style={{
                  background: "var(--brand-crimson)",
                  border: "1px solid var(--brand-crimson-dark)",
                  color: "#ffffff",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 750,
                  boxShadow: "0 2px 6px rgba(166, 38, 29, 0.2)",
                  transition: "all 0.15s ease",
                }}
              >
                + Novo Processo
              </button>
            )}

            {loggedUserRole !== "client" && onOpenLogsModal && (
              <button
                onClick={onOpenLogsModal}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-secondary)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
              >
                📋 Auditoria
              </button>
            )}

            {loggedUserRole === "admin" && (
              <button
                onClick={onOpenAdminModal}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--brand-ochre)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                }}
              >
                ⚙️ Usuários
              </button>
            )}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-hairline)",
                background: "var(--bg-subtle)",
                fontSize: "12px",
                fontWeight: 650,
                color: "var(--text-secondary)",
              }}
            >
              <span>👤 {loggedUserKey}</span>
              <button
                onClick={onLogout}
                title="Encerrar sessão"
                style={{
                  color: "var(--brand-crimson)",
                  fontWeight: 800,
                  fontSize: "11px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "var(--status-danger-bg)",
                }}
              >
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
