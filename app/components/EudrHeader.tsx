"use client";

import React from "react";

interface EudrHeaderProps {
  isAuthenticated: boolean;
  loggedUserRole: "admin" | "user";
  loggedUserKey: string;
  onOpenAdminModal: () => void;
  onLogout: () => void;
  onNewProcess?: () => void;
}

export function EudrHeader({
  isAuthenticated,
  loggedUserRole,
  loggedUserKey,
  onOpenAdminModal,
  onLogout,
  onNewProcess,
}: EudrHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="kicker">FAF COFFEES · SUSTENTABILIDADE & CONFORMIDADE</p>
        <h1 className="title">Preparador de Dossiê EUDR</h1>
      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        {isAuthenticated && (
          <>
            {onNewProcess && (
              <button
                onClick={onNewProcess}
                style={{
                  background: "var(--orange-500)",
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                }}
                title="Limpar formulário e iniciar o mapeamento de um novo talhão"
              >
                ✨ Novo Processo
              </button>
            )}
            <button
              onClick={onOpenAdminModal}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {loggedUserRole === "admin" ? "⚙️ Gerenciar Usuários" : "🔑 Alterar Minha Senha"}
            </button>
            <button
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffd1d1",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Sair ({loggedUserKey})
            </button>
          </>
        )}
        <span className="badge">v0.2.1</span>
      </div>
    </header>
  );
}
