"use client";

import React from "react";

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
  title = "Acesso Restrito FAF",
  eyebrow = "FAF Coffees",
  subtitle = "Digite suas credenciais autorizadas para acessar o Preparador de Dossiês EUDR.",
  buttonText = "Entrar no Preparador EUDR ➔",
  userLabel = "Usuário",
  passLabel = "Senha",
  userPlaceholder = "Informe o usuário",
  passPlaceholder = "Informe a senha",
  backText = "← Voltar à Página Inicial",
}: LoginScreenProps) {
  return (
    <main className="app-shell" style={{ display: "grid", minHeight: "100vh", placeItems: "center", background: "var(--canvas)", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "20px", padding: "36px 32px", boxShadow: "var(--shadow-lg)" }}>
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--forest-900)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "20px",
              padding: 0,
            }}
          >
            {backText}
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{ height: "46px", width: "auto", objectFit: "contain", display: "block" }}
          />
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>{eyebrow}</p>
            <h1 style={{ margin: 0, fontSize: "20px", color: "var(--forest-950)", fontWeight: 700 }}>{title}</h1>
          </div>
        </div>
        <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "13.5px", lineHeight: "1.5" }}>
          {subtitle}
        </p>

        <form onSubmit={onLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--forest-950)" }}>
            {userLabel}
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder={userPlaceholder}
              autoFocus
              style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", fontSize: "14px", background: "var(--canvas)" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--forest-950)" }}>
            {passLabel}
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder={passPlaceholder}
              style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", fontSize: "14px", background: "var(--canvas)" }}
            />
          </label>

          {loginError && (
            <p style={{ margin: 0, color: "var(--danger)", fontSize: "13px", fontWeight: 600 }}>{loginError}</p>
          )}

          <button
            type="submit"
            className="primary-button"
            style={{ width: "100%", padding: "13px", marginTop: "8px", fontSize: "14px", fontWeight: 700, borderRadius: "10px" }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </main>
  );
}
