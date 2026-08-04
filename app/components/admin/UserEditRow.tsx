"use client";

import React from "react";
import { ClientSelectAutocomplete } from "../ClientSelectAutocomplete";

interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

interface UserEditRowProps {
  userKey: string;
  profile: UserProfile | string;
  loggedUserRole: "admin" | "user" | "client";
  idx: number;
  totalCount: number;
  editingUser: string | null;
  setEditingUser: (userKey: string | null) => void;
  editUsernameInput: string;
  setEditUsernameInput: (val: string) => void;
  editFullNameInput: string;
  setEditFullNameInput: (val: string) => void;
  editRoleInput: "admin" | "user" | "client";
  setEditRoleInput: (role: "admin" | "user" | "client") => void;
  editClientNameInput?: string;
  setEditClientNameInput?: (val: string) => void;
  editNewPassInput: string;
  setEditNewPassInput: (val: string) => void;
  editingCurrentPassInput: string;
  setEditingCurrentPassInput: (val: string) => void;
  onStartEdit: (userKey: string, profile: UserProfile) => void;
  onDeleteUser: (userKey: string) => void;
  onAdminUpdateUser: (oldUserKey: string) => void;
  onChangePassword: (userKey: string) => void;
}

export function UserEditRow({
  userKey,
  profile,
  loggedUserRole,
  idx,
  totalCount,
  editingUser,
  setEditingUser,
  editUsernameInput,
  setEditUsernameInput,
  editFullNameInput,
  setEditFullNameInput,
  editRoleInput,
  setEditRoleInput,
  editClientNameInput = "",
  setEditClientNameInput,
  editNewPassInput,
  setEditNewPassInput,
  editingCurrentPassInput,
  setEditingCurrentPassInput,
  onStartEdit,
  onDeleteUser,
  onAdminUpdateUser,
  onChangePassword,
}: UserEditRowProps) {
  const profileObj: UserProfile = typeof profile === "string"
    ? { pass: profile, fullName: userKey.toUpperCase(), role: "user" }
    : profile;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px 14px",
        background: idx % 2 === 0 ? "var(--surface)" : "var(--canvas)",
        borderBottom: idx === totalCount - 1 ? 0 : "1px solid var(--line)",
        fontSize: "13px",
      }}
    >
      <div className="user-item-row">
        <div>
          <strong style={{ color: "var(--forest-950)", wordBreak: "break-all" }}>{userKey}</strong>
          <span style={{ color: "var(--forest-800)", marginLeft: "6px", fontSize: "12px", fontWeight: 650, wordBreak: "break-word" }}>
            ({profileObj.fullName || userKey})
          </span>
          {profileObj.role === "admin" ? (
            <span style={{ marginLeft: "6px", fontSize: "10px", background: "var(--forest-100)", color: "var(--forest-900)", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>ADM</span>
          ) : profileObj.role === "client" ? (
            <span style={{ marginLeft: "6px", fontSize: "10px", background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>CLIENTE ({profileObj.clientName || "Geral"})</span>
          ) : null}
        </div>
        <div className="user-item-actions">
          <button
            onClick={() => {
              if (editingUser === userKey) {
                setEditingUser(null);
              } else {
                onStartEdit(userKey, profileObj);
              }
            }}
            style={{ color: "var(--forest-900)", border: 0, background: "transparent", cursor: "pointer", fontSize: "11.5px", fontWeight: 700 }}
          >
            {loggedUserRole === "admin" ? "✏️ Editar" : "🔑 Alterar Senha"}
          </button>
          {loggedUserRole === "admin" && (
            <button
              onClick={() => onDeleteUser(userKey)}
              style={{ color: "var(--danger)", border: 0, background: "transparent", cursor: "pointer", fontSize: "11.5px", fontWeight: 700 }}
            >
              🗑️ Excluir
            </button>
          )}
        </div>
      </div>

      {editingUser === userKey && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px", padding: "12px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", border: "1px solid var(--line)" }}>
          {loggedUserRole === "admin" ? (
            <>
              <div className="modal-grid-two">
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
                  Usuário (login) *
                  <input
                    type="text"
                    value={editUsernameInput}
                    onChange={(e) => setEditUsernameInput(e.target.value)}
                    placeholder="Ex: gabi.isidoro"
                    style={{ width: "100%", marginTop: "4px", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px", background: "var(--surface)" }}
                  />
                </label>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
                  Nome Completo *
                  <input
                    type="text"
                    value={editFullNameInput}
                    onChange={(e) => setEditFullNameInput(e.target.value)}
                    placeholder="Nome e Sobrenome"
                    style={{ width: "100%", marginTop: "4px", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px", background: "var(--surface)" }}
                  />
                </label>
              </div>
              <div className="modal-grid-two">
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
                  Perfil de Acesso
                  <select
                    value={editRoleInput}
                    onChange={(e) => setEditRoleInput(e.target.value as "admin" | "user" | "client")}
                    style={{ width: "100%", marginTop: "4px", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px", background: "var(--surface)" }}
                  >
                    <option value="user">Usuário Operador (App + Contratos)</option>
                    <option value="admin">Administrador ADM (Acesso Total)</option>
                    <option value="client">🏢 Cliente / Importador (Apenas Portal)</option>
                  </select>
                </label>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-950)" }}>
                  Nova Senha (opcional)
                  <input
                    type="text"
                    value={editNewPassInput}
                    onChange={(e) => setEditNewPassInput(e.target.value)}
                    placeholder="Deixe em branco para manter"
                    style={{ width: "100%", marginTop: "4px", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px", background: "var(--surface)" }}
                  />
                </label>
              </div>

              {editRoleInput === "client" && setEditClientNameInput && (
                <div>
                  <ClientSelectAutocomplete
                    value={editClientNameInput}
                    onChange={(name) => setEditClientNameInput(name)}
                    label="Nome da Empresa do Cliente (para vincular contratos)"
                    placeholder="Selecione uma empresa europeia ou cadastre nova..."
                  />
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  onClick={() => onAdminUpdateUser(userKey)}
                  style={{ padding: "6px 14px", background: "var(--forest-900)", color: "#fff", border: 0, borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Salvar Alterações
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  style={{ padding: "6px 10px", background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="modal-grid-two">
                <input
                  type="password"
                  placeholder="Senha Atual"
                  value={editingCurrentPassInput}
                  onChange={(e) => setEditingCurrentPassInput(e.target.value)}
                  autoFocus
                  style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px", background: "var(--surface)" }}
                />
                <input
                  type="password"
                  placeholder="Nova Senha"
                  value={editNewPassInput}
                  onChange={(e) => setEditNewPassInput(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px", background: "var(--surface)" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => onChangePassword(userKey)}
                  style={{ padding: "6px 12px", background: "var(--forest-900)", color: "#fff", border: 0, borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Confirmar Alteração
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  style={{ padding: "6px 10px", background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
