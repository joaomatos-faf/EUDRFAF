"use client";

import React from "react";

interface UserFormProps {
  newAdminUser: string;
  setNewAdminUser: (val: string) => void;
  newAdminPass: string;
  setNewAdminPass: (val: string) => void;
  newAdminFullName: string;
  setNewAdminFullName: (val: string) => void;
  newAdminRole: "admin" | "user";
  setNewAdminRole: (role: "admin" | "user") => void;
  adminErrorMsg: string;
  adminSuccessMsg: string;
  onAddUser: (e: React.FormEvent) => void;
}

export function UserForm({
  newAdminUser,
  setNewAdminUser,
  newAdminPass,
  setNewAdminPass,
  newAdminFullName,
  setNewAdminFullName,
  newAdminRole,
  setNewAdminRole,
  adminErrorMsg,
  adminSuccessMsg,
  onAddUser,
}: UserFormProps) {
  return (
    <form onSubmit={onAddUser} style={{ background: "var(--canvas)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
      <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--forest-950)", fontWeight: 700 }}>➕ Cadastrar Novo Usuário</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
        <div className="modal-grid-two">
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
            Usuário (login) *
            <input
              type="text"
              value={newAdminUser}
              onChange={(e) => setNewAdminUser(e.target.value)}
              placeholder="Ex: marcos"
              style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "13px", background: "var(--surface)" }}
            />
          </label>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
            Senha *
            <input
              type="text"
              value={newAdminPass}
              onChange={(e) => setNewAdminPass(e.target.value)}
              placeholder="Ex: faf123"
              style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "13px", background: "var(--surface)" }}
            />
          </label>
        </div>
        <div className="modal-grid-two">
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
            Nome Completo *
            <input
              type="text"
              value={newAdminFullName}
              onChange={(e) => setNewAdminFullName(e.target.value)}
              placeholder="Ex: Marcos Oliveira"
              style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "13px", background: "var(--surface)" }}
            />
          </label>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
            Perfil de Acesso *
            <select
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value as "admin" | "user")}
              style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "13px", background: "var(--surface)" }}
            >
              <option value="user">Usuário Padrão</option>
              <option value="admin">Administrador (ADM)</option>
            </select>
          </label>
        </div>
      </div>

      {adminErrorMsg && <p style={{ color: "var(--danger)", fontSize: "12px", margin: "0 0 10px", fontWeight: 600 }}>{adminErrorMsg}</p>}
      {adminSuccessMsg && <p style={{ color: "var(--success)", fontSize: "12px", margin: "0 0 10px", fontWeight: 600 }}>{adminSuccessMsg}</p>}

      <button
        type="submit"
        style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "var(--forest-900)", color: "#fff", border: 0, fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
      >
        Salvar Novo Usuário
      </button>
    </form>
  );
}
