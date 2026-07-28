"use client";

import React from "react";

interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user";
}

interface AdminUserModalProps {
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  loggedUserRole: "admin" | "user";
  loggedUserKey: string;
  usersMap: Record<string, UserProfile>;
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
  editingUser: string | null;
  setEditingUser: (userKey: string | null) => void;
  editUsernameInput: string;
  setEditUsernameInput: (val: string) => void;
  editFullNameInput: string;
  setEditFullNameInput: (val: string) => void;
  editRoleInput: "admin" | "user";
  setEditRoleInput: (role: "admin" | "user") => void;
  editNewPassInput: string;
  setEditNewPassInput: (val: string) => void;
  editingCurrentPassInput: string;
  setEditingCurrentPassInput: (val: string) => void;
  onStartEdit: (userKey: string, profile: UserProfile) => void;
  onDeleteUser: (userKey: string) => void;
  onAdminUpdateUser: (oldUserKey: string) => void;
  onChangePassword: (userKey: string) => void;
}

export function AdminUserModal({
  showAdminModal,
  setShowAdminModal,
  loggedUserRole,
  loggedUserKey,
  usersMap,
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
  editingUser,
  setEditingUser,
  editUsernameInput,
  setEditUsernameInput,
  editFullNameInput,
  setEditFullNameInput,
  editRoleInput,
  setEditRoleInput,
  editNewPassInput,
  setEditNewPassInput,
  editingCurrentPassInput,
  setEditingCurrentPassInput,
  onStartEdit,
  onDeleteUser,
  onAdminUpdateUser,
  onChangePassword,
}: AdminUserModalProps) {
  if (!showAdminModal) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(16, 44, 36, 0.65)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: "16px" }}>
      <div className="admin-modal-card" style={{ width: "100%", maxWidth: "520px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "16px", padding: "28px 24px", boxShadow: "var(--shadow-lg)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "var(--forest-950)", fontWeight: 700 }}>
              {loggedUserRole === "admin" ? "Gestão de Usuários · Painel ADM" : "Alterar Minha Senha"}
            </h3>
            <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>
              {loggedUserRole === "admin" ? "Adicione, remova ou altere permissões do sistema." : "Altere a sua senha de acesso ao sistema."}
            </p>
          </div>
          <button
            onClick={() => setShowAdminModal(false)}
            style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontWeight: 700, color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {loggedUserRole === "admin" && (
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
        )}

        <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--forest-950)", fontWeight: 700 }}>
          {loggedUserRole === "admin" ? `📋 Usuários Ativos (${Object.keys(usersMap).length})` : "👤 Seu Perfil"}
        </h4>

        {adminErrorMsg && loggedUserRole === "user" && <p style={{ color: "var(--danger)", fontSize: "12px", margin: "0 0 10px", fontWeight: 600 }}>{adminErrorMsg}</p>}
        {adminSuccessMsg && loggedUserRole === "user" && <p style={{ color: "var(--success)", fontSize: "12px", margin: "0 0 10px", fontWeight: 600 }}>{adminSuccessMsg}</p>}

        <div style={{ border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
          {Object.entries(usersMap)
            .filter(([userKey]) => loggedUserRole === "admin" || userKey === loggedUserKey)
            .map(([userKey, profile], idx) => (
              <div
                key={userKey}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  background: idx % 2 === 0 ? "var(--surface)" : "var(--canvas)",
                  borderBottom: idx === Object.keys(usersMap).length - 1 ? 0 : "1px solid var(--line)",
                  fontSize: "13px"
                }}
              >
                <div className="user-item-row">
                  <div>
                    <strong style={{ color: "var(--forest-950)", wordBreak: "break-all" }}>{userKey}</strong>
                    <span style={{ color: "var(--forest-800)", marginLeft: "6px", fontSize: "12px", fontWeight: 650, wordBreak: "break-word" }}>
                      ({typeof profile === "string" ? userKey.toUpperCase() : (profile.fullName || userKey)})
                    </span>
                    {typeof profile === "object" && profile.role === "admin" && (
                      <span style={{ marginLeft: "6px", fontSize: "10px", background: "var(--forest-100)", color: "var(--forest-900)", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>ADM</span>
                    )}
                  </div>
                  <div className="user-item-actions">
                    <button
                      onClick={() => {
                        if (editingUser === userKey) {
                          setEditingUser(null);
                        } else {
                          onStartEdit(userKey, profile);
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
                              onChange={(e) => setEditRoleInput(e.target.value as "admin" | "user")}
                              style={{ width: "100%", marginTop: "4px", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px", background: "var(--surface)" }}
                            >
                              <option value="user">Usuário Padrão</option>
                              <option value="admin">Administrador (ADM)</option>
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
            ))}
        </div>
      </div>
    </div>
  );
}
