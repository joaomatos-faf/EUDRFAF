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
}

export function LoginScreen({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  onLogin,
  onBackToLanding,
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
            ← Voltar à Página Inicial
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div className="brand-mark" style={{ width: "46px", height: "46px", fontSize: "15px" }}>FAF</div>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>FAF Coffees</p>
            <h1 style={{ margin: 0, fontSize: "20px", color: "var(--forest-950)", fontWeight: 700 }}>Acesso Restrito FAF</h1>
          </div>
        </div>
        <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "13.5px", lineHeight: "1.5" }}>
          Digite suas credenciais autorizadas para acessar o Preparador de Dossiês EUDR.
        </p>

        <form onSubmit={onLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--forest-950)" }}>
            Usuário
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Informe o usuário"
              autoFocus
              style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", fontSize: "14px", background: "var(--canvas)" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--forest-950)" }}>
            Senha
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Informe a senha"
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
            Entrar no Preparador EUDR ➔
          </button>
        </form>
      </div>
    </main>
  );
}
