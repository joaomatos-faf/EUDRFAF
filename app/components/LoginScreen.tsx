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
  title = "Acesso Autorizado FAF",
  eyebrow = "FAF Coffees · Sustentabilidade",
  subtitle = "Informe suas credenciais para gerenciar contratos, talhões e conformidade EUDR.",
  buttonText = "Entrar no Sistema FAF ➔",
  userLabel = "Usuário",
  passLabel = "Senha",
  userPlaceholder = "Informe seu usuário",
  passPlaceholder = "Informe sua senha",
  backText = "← Voltar à Página Inicial (fafeu.online)",
}: LoginScreenProps) {
  const { isDark } = useTheme();

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.startsWith("contratos.") || host.startsWith("portal.") || host.startsWith("cliente.") || host.startsWith("cloud.") || host.includes("fafeu.online")) {
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
        background: isDark
          ? "radial-gradient(ellipse at 50% 0%, #28120e 0%, #160a08 50%, #0a0403 100%)"
          : "radial-gradient(ellipse at 50% 0%, #fffbf7 0%, #f7efe6 50%, #eddcd0 100%)",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        position: "relative",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <div style={{ position: "absolute", top: "24px", right: "24px" }}>
        <ThemeToggle />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: isDark
            ? "linear-gradient(150deg, rgba(38, 18, 14, 0.95) 0%, rgba(20, 10, 8, 0.98) 100%)"
            : "linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(253, 248, 242, 0.98) 100%)",
          border: isDark ? "1px solid rgba(209, 160, 104, 0.35)" : "1px solid rgba(209, 160, 104, 0.4)",
          borderRadius: "24px",
          padding: "40px 36px",
          boxShadow: isDark
            ? "0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(189, 40, 32, 0.15)"
            : "0 20px 50px rgba(70, 30, 20, 0.1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {onBackToLanding && (
          <button
            onClick={handleBack}
            style={{
              background: "transparent",
              border: "none",
              color: isDark ? "#dfa84a" : "#b37e33",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "24px",
              padding: 0,
            }}
          >
            {backText}
          </button>
        )}

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{
              height: "72px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 16px",
              display: "block",
              filter: isDark
                ? "drop-shadow(0 8px 20px rgba(189, 40, 32, 0.35))"
                : "drop-shadow(0 6px 15px rgba(189, 40, 32, 0.2))",
            }}
          />
          <p style={{ margin: "0 0 4px", color: isDark ? "#dfa84a" : "#b37e33", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
            {eyebrow}
          </p>
          <h1 style={{ margin: 0, fontSize: "22px", color: isDark ? "#ffffff" : "#1a0f0d", fontWeight: 800, letterSpacing: "-0.3px" }}>
            {title}
          </h1>
          <p style={{ margin: "10px 0 0", color: isDark ? "#d4c4b6" : "#5c4d44", fontSize: "13px", lineHeight: "1.5" }}>
            {subtitle}
          </p>
        </div>

        <form onSubmit={onLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px", fontWeight: 700, color: isDark ? "#fcf9f5" : "#1a0f0d" }}>
            {userLabel}
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder={userPlaceholder}
              autoFocus
              style={{
                padding: "13px 16px",
                borderRadius: "12px",
                border: isDark ? "1px solid rgba(209, 160, 104, 0.3)" : "1px solid rgba(209, 160, 104, 0.4)",
                outline: "none",
                fontSize: "14px",
                background: isDark ? "rgba(10, 4, 3, 0.6)" : "#ffffff",
                color: isDark ? "#ffffff" : "#1a0f0d",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px", fontWeight: 700, color: isDark ? "#fcf9f5" : "#1a0f0d" }}>
            {passLabel}
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder={passPlaceholder}
              style={{
                padding: "13px 16px",
                borderRadius: "12px",
                border: isDark ? "1px solid rgba(209, 160, 104, 0.3)" : "1px solid rgba(209, 160, 104, 0.4)",
                outline: "none",
                fontSize: "14px",
                background: isDark ? "rgba(10, 4, 3, 0.6)" : "#ffffff",
                color: isDark ? "#ffffff" : "#1a0f0d",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            />
          </label>

          {loginError && (
            <div
              style={{
                margin: 0,
                color: "#fca5a5",
                background: "rgba(189, 40, 32, 0.2)",
                border: "1px solid rgba(189, 40, 32, 0.4)",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
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
              padding: "14px",
              marginTop: "8px",
              fontSize: "14px",
              fontWeight: 800,
              borderRadius: "12px",
              border: "1px solid rgba(209, 160, 104, 0.4)",
              background: "linear-gradient(135deg, #bd2820 0%, #8d1b15 100%)",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(189, 40, 32, 0.4)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </main>
  );
}
