"use client";

import React from "react";

interface LoginScreenProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string;
  onLogin: (e: React.FormEvent) => void;
}

export function LoginScreen({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  onLogin,
}: LoginScreenProps) {
  return (
    <main className="app-shell" style={{ display: "grid", minHeight: "100vh", placeItems: "center", background: "var(--canvas)", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "16px", padding: "36px 32px", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
          <div className="brand-mark" style={{ width: "46px", height: "46px", fontSize: "15px" }}>FAF</div>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>FAF Coffees</p>
            <h1 style={{ margin: 0, fontSize: "20px", color: "var(--forest-950)", fontWeight: 700 }}>Acesso Restrito</h1>
          </div>
        </div>
        <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "13.5px", lineHeight: "1.5" }}>
          Digite suas credenciais autorizadas para acessar o Preparador EUDR.
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
            <p style={{ color: "var(--danger)", fontSize: "12.5px", fontWeight: 600, margin: 0 }}>{loginError}</p>
          )}

          <button
            type="submit"
            style={{
              marginTop: "8px",
              padding: "12px",
              borderRadius: "8px",
              background: "var(--forest-900)",
              color: "#fff",
              border: 0,
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Entrar no Sistema
          </button>
        </form>
      </div>
    </main>
  );
}
