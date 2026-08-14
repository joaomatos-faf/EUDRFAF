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
  title = "Autenticação Corporativa",
  eyebrow = "FAF Coffees · Sustentabilidade",
  subtitle = "Informe suas credenciais para gerenciar contratos, talhões e conformidade EUDR.",
  buttonText = "Entrar no Sistema ➔",
  userLabel = "Usuário",
  passLabel = "Senha",
  userPlaceholder = "Digite seu usuário",
  passPlaceholder = "Digite sua senha",
  backText = "← Voltar à Página Inicial",
}: LoginScreenProps) {
  const { isDark } = useTheme();

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (
        host.startsWith("contratos.") ||
        host.startsWith("portal.") ||
        host.startsWith("cliente.") ||
        host.startsWith("cloud.") ||
        host.startsWith("app.") ||
        host.includes("fafeu.online")
      ) {
        window.location.href = "https://fafeu.online";
        return;
      }
    }
    onBackToLanding?.();
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
          maxWidth: "420px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: "12px",
          padding: "36px 32px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {onBackToLanding && (
          <button
            onClick={handleBack}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--brand-ochre)",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "20px",
              padding: 0,
            }}
          >
            {backText}
          </button>
        )}

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{
              height: "56px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 14px",
              display: "block",
            }}
          />
          <span
            style={{
              display: "block",
              fontSize: "10.5px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--brand-ochre)",
              marginBottom: "4px",
            }}
          >
            {eyebrow}
          </span>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.01em",
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
              lineHeight: "1.5",
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
              fontWeight: 700,
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
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-strong)",
                outline: "none",
                fontSize: "13.5px",
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
              fontWeight: 700,
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
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-strong)",
                outline: "none",
                fontSize: "13.5px",
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
                border: "1px solid rgba(166, 38, 29, 0.3)",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 650,
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
              marginTop: "6px",
              fontSize: "13.5px",
              fontWeight: 750,
              borderRadius: "8px",
              background: "var(--brand-crimson)",
              color: "#ffffff",
              border: "1px solid var(--brand-crimson-dark)",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(166, 38, 29, 0.2)",
              transition: "background-color 0.15s ease",
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </main>
  );
}
