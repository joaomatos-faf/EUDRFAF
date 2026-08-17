"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/app/hooks/useTheme";

interface EudrHeaderProps {
  isAuthenticated: boolean;
  loggedUserRole: "admin" | "user" | "client";
  loggedUserKey: string;
  activeView?: "landing" | "app" | "portal" | "contratos" | "dashboard";
  onOpenLanding?: () => void;
  onOpenPreparer?: () => void;
  onOpenDashboard?: () => void;
  onOpenContracts?: () => void;
  onOpenAdminModal?: () => void;
  onLogout: () => void;
  onNewProcess?: () => void;
  onOpenLogsModal?: () => void;
  onOpenCloudExplorer?: () => void;
}

export function EudrHeader({
  isAuthenticated,
  loggedUserRole,
  loggedUserKey,
  activeView = "app",
  onOpenLanding,
  onOpenPreparer,
  onOpenDashboard,
  onOpenContracts,
  onOpenAdminModal,
  onLogout,
  onNewProcess,
  onOpenLogsModal,
  onOpenCloudExplorer,
}: EudrHeaderProps) {
  const { isDark } = useTheme();

  return (
    <header className="topbar">
      <div
        className="brand-lockup"
        style={{ cursor: "pointer" }}
        onClick={onOpenLanding || onOpenPreparer}
        title="Voltar à Página Inicial"
      >
        <img
          src="/faf-logo-transparent.png"
          alt="FAF Coffees"
          style={{
            height: "28px",
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Preparador EUDR
          </span>
          <span className="privacy-pill">
            <span />
            WGS84
          </span>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeToggle />

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            style={{
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              fontWeight: 550,
              padding: "6px 12px",
              borderRadius: "999px",
              transition: "all 0.15s ease",
            }}
          >
            🏠 Início
          </button>
        )}

        {isAuthenticated && loggedUserRole !== "client" && (
          <>
            {onOpenPreparer && activeView !== "app" && (
              <button
                onClick={onOpenPreparer}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  transition: "all 0.15s ease",
                }}
              >
                🗺️ Preparador
              </button>
            )}

            {onOpenDashboard && activeView !== "dashboard" && (
              <button
                onClick={onOpenDashboard}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  transition: "all 0.15s ease",
                }}
              >
                📊 Dashboard
              </button>
            )}

            {onOpenContracts && activeView !== "contratos" && (
              <button
                onClick={onOpenContracts}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  transition: "all 0.15s ease",
                }}
              >
                📑 Contratos
              </button>
            )}

            {onOpenCloudExplorer && (
              <button
                onClick={onOpenCloudExplorer}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  transition: "all 0.15s ease",
                }}
              >
                ☁️ Nuvem R2
              </button>
            )}

            {onNewProcess && activeView === "app" && (
              <button
                onClick={onNewProcess}
                style={{
                  background: "var(--brand-crimson)",
                  color: "#ffffff",
                  borderRadius: "999px",
                  padding: "6px 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  boxShadow: "var(--shadow-button)",
                  transition: "all 0.15s ease",
                }}
              >
                + Novo Processo
              </button>
            )}

            {onOpenLogsModal && (
              <button
                onClick={onOpenLogsModal}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 10px",
                  borderRadius: "999px",
                  transition: "all 0.15s ease",
                }}
              >
                Auditoria
              </button>
            )}

            {loggedUserRole === "admin" && onOpenAdminModal && (
              <button
                onClick={onOpenAdminModal}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 10px",
                  borderRadius: "999px",
                  transition: "all 0.15s ease",
                }}
              >
                Usuários
              </button>
            )}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 10px",
                borderRadius: "999px",
                background: "var(--bg-subtle)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginLeft: "4px",
              }}
            >
              <span>{loggedUserKey}</span>
              <button
                onClick={onLogout}
                title="Encerrar sessão"
                style={{
                  color: "var(--brand-crimson)",
                  fontWeight: 700,
                  fontSize: "11px",
                  padding: "0 2px",
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
