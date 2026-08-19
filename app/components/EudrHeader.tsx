import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./ui/LanguageToggle";
import { useTheme } from "@/app/hooks/useTheme";
import { useTranslation, getSubdomainUrl } from "@/app/hooks/useTranslation";

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
  const { locale, t } = useTranslation();

  const handleNavClick = (e: React.MouseEvent, action?: () => void) => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      // If local dev or workers.dev, perform in-app state switch
      if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".workers.dev")) {
        e.preventDefault();
        action?.();
      }
      // On production, let standard browser navigation navigate directly to the subdomain!
    }
  };

  return (
    <header className="topbar">
      <a
        className="brand-lockup"
        href={getSubdomainUrl("https://fafeu.online", locale)}
        onClick={(e) => handleNavClick(e, onOpenLanding)}
        style={{ cursor: "pointer", textDecoration: "none" }}
        title={t("nav.home")}
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
            {t("nav.title")}
          </span>
          <span className="privacy-pill">
            <span />
            WGS84
          </span>
        </div>
      </a>

      <div className="topbar-actions">
        <LanguageToggle />
        <ThemeToggle />

        {onOpenLanding && (
          <a
            href={getSubdomainUrl("https://fafeu.online", locale)}
            onClick={(e) => handleNavClick(e, onOpenLanding)}
            style={{
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              fontWeight: 550,
              padding: "6px 12px",
              borderRadius: "999px",
              textDecoration: "none",
              transition: "all 0.15s ease",
              cursor: "pointer",
            }}
          >
            {t("nav.home")}
          </a>
        )}

        {isAuthenticated && loggedUserRole !== "client" && (
          <>
            {onOpenPreparer && activeView !== "app" && (
              <a
                href={getSubdomainUrl("https://app.fafeu.online", locale)}
                onClick={(e) => handleNavClick(e, onOpenPreparer)}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
              >
                {t("nav.preparer")}
              </a>
            )}

            {onOpenDashboard && activeView !== "dashboard" && (
              <a
                href={getSubdomainUrl("https://dashboard.fafeu.online", locale)}
                onClick={(e) => handleNavClick(e, onOpenDashboard)}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
              >
                {t("nav.dashboard")}
              </a>
            )}

            {onOpenContracts && activeView !== "contratos" && (
              <a
                href={getSubdomainUrl("https://contratos.fafeu.online", locale)}
                onClick={(e) => handleNavClick(e, onOpenContracts)}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
              >
                {t("nav.contracts")}
              </a>
            )}

            {onOpenCloudExplorer && (
              <a
                href={getSubdomainUrl("https://cloud.fafeu.online", locale)}
                onClick={(e) => handleNavClick(e, onOpenCloudExplorer)}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 550,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
              >
                {t("nav.cloud")}
              </a>
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
                  cursor: "pointer",
                }}
              >
                {t("nav.newProcess")}
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
                  cursor: "pointer",
                }}
              >
                {t("nav.audit")}
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
                  cursor: "pointer",
                }}
              >
                {t("nav.users")}
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
                title={t("nav.logout")}
                style={{
                  color: "var(--brand-crimson)",
                  fontWeight: 700,
                  fontSize: "11px",
                  padding: "0 2px",
                  cursor: "pointer",
                }}
              >
                {t("nav.logout")}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
