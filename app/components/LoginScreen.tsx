"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./ui/LanguageToggle";
import { useTheme } from "@/app/hooks/useTheme";
import { useTranslation, getSubdomainUrl } from "@/app/hooks/useTranslation";

interface LoginScreenProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string;
  onLogin: (e: React.FormEvent) => void;
  onBackToLanding?: () => void;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  buttonText?: string;
  userLabel?: string;
  passLabel?: string;
  userPlaceholder?: string;
  passPlaceholder?: string;
  backText?: string;
}

export function LoginScreen({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  onLogin,
  onBackToLanding,
  title,
  eyebrow,
  subtitle,
  buttonText,
  userLabel,
  passLabel,
  userPlaceholder,
  passPlaceholder,
  backText,
}: LoginScreenProps) {
  const { isDark } = useTheme();
  const { locale, t } = useTranslation();

  const activeTitle = title || t("auth.login");
  const activeEyebrow = eyebrow || t("auth.eyebrow");
  const activeSubtitle = subtitle || t("auth.subtitle");
  const activeButtonText = buttonText || t("auth.continue");
  const activeUserLabel = userLabel || t("auth.username");
  const activePassLabel = passLabel || t("auth.password");
  const activeUserPlaceholder = userPlaceholder || t("auth.placeholderUser");
  const activePassPlaceholder = passPlaceholder || t("auth.placeholderPass");
  const activeBackText = backText || t("auth.back");

  const handleBack = (e: React.MouseEvent) => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".workers.dev")) {
        e.preventDefault();
        onBackToLanding?.();
      }
    }
  };

  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        background: "var(--bg-canvas)",
        padding: "24px",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: "20px", right: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "var(--bg-surface)",
          border: "0.5px solid var(--border-hairline)",
          borderRadius: "24px",
          padding: "40px 32px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {onBackToLanding && (
          <a
            href={getSubdomainUrl("https://fafeu.online", locale)}
            onClick={handleBack}
            style={{
              color: "var(--brand-crimson)",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              marginBottom: "24px",
              padding: 0,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            {activeBackText}
          </a>
        )}

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{
              height: "44px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 16px",
              display: "block",
            }}
          />
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            {activeTitle}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {activeSubtitle}
          </p>
        </div>

        <form onSubmit={onLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {activeUserLabel}
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder={activeUserPlaceholder}
              autoFocus
              required
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "0.5px solid var(--border-strong)",
                outline: "none",
                fontSize: "13px",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {activePassLabel}
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder={activePassPlaceholder}
              required
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "0.5px solid var(--border-strong)",
                outline: "none",
                fontSize: "13px",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
              }}
            />
          </label>

          {loginError && (
            <div
              style={{
                background: "var(--status-danger-bg)",
                border: "0.5px solid var(--status-danger-border)",
                color: "var(--status-danger)",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                lineHeight: 1.4,
              }}
            >
              {loginError}
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "var(--brand-crimson)",
              color: "#ffffff",
              border: "none",
              borderRadius: "999px",
              padding: "12px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "8px",
              boxShadow: "var(--shadow-button)",
              fontFamily: "inherit",
            }}
          >
            {activeButtonText}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
            {activeEyebrow}
          </span>
        </div>
      </div>
    </main>
  );
}
