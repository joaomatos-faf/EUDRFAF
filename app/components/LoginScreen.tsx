"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/app/hooks/useTheme";

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
  title = "Iniciar Sessão",
  eyebrow = "FAF Coffees · Sustentabilidade",
  subtitle = "Informe suas credenciais para acessar a plataforma geoespacial EUDR.",
  buttonText = "Continuar ›",
  userLabel = "Usuário",
  passLabel = "Senha",
  userPlaceholder = "ex: joao",
  passPlaceholder = "••••••••",
  backText = "‹ Voltar ao Início",
}: LoginScreenProps) {
  const { isDark } = useTheme();

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
      <div style={{ position: "absolute", top: "20px", right: "24px" }}>
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
            href="https://fafeu.online"
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
            {backText}
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
            {title}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
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
            {userLabel}
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder={userPlaceholder}
              autoFocus
              required
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "0.5px solid var(--border-strong)",
                outline: "none",
                fontSize: "14px",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
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
            {passLabel}
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder={passPlaceholder}
              required
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "0.5px solid var(--border-strong)",
                outline: "none",
                fontSize: "14px",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            />
          </label>

          {loginError && (
            <div
              style={{
                color: "var(--status-danger)",
                background: "var(--status-danger-bg)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {loginError}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "999px",
              background: "var(--brand-crimson)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              boxShadow: "var(--shadow-button)",
              transition: "all 0.15s ease",
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </main>
  );
}
