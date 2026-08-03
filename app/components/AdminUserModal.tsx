"use client";

import React from "react";
import { UserForm } from "./admin/UserForm";
import { UserTable } from "./admin/UserTable";

interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

interface AdminUserModalProps {
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  loggedUserRole: "admin" | "user" | "client";
  loggedUserKey: string;
  usersMap: Record<string, UserProfile>;
  newAdminUser: string;
  setNewAdminUser: (val: string) => void;
  newAdminPass: string;
  setNewAdminPass: (val: string) => void;
  newAdminFullName: string;
  setNewAdminFullName: (val: string) => void;
  newAdminRole: "admin" | "user" | "client";
  setNewAdminRole: (role: "admin" | "user" | "client") => void;
  newAdminClientName?: string;
  setNewAdminClientName?: (val: string) => void;
  adminErrorMsg: string;
  adminSuccessMsg: string;
  onAddUser: (e: React.FormEvent) => void;
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
  newAdminClientName,
  setNewAdminClientName,
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
  editClientNameInput,
  setEditClientNameInput,
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
          <UserForm
            newAdminUser={newAdminUser}
            setNewAdminUser={setNewAdminUser}
            newAdminPass={newAdminPass}
            setNewAdminPass={setNewAdminPass}
            newAdminFullName={newAdminFullName}
            setNewAdminFullName={setNewAdminFullName}
            newAdminRole={newAdminRole}
            setNewAdminRole={setNewAdminRole}
            newAdminClientName={newAdminClientName}
            setNewAdminClientName={setNewAdminClientName}
            adminErrorMsg={adminErrorMsg}
            adminSuccessMsg={adminSuccessMsg}
            onAddUser={onAddUser}
          />
        )}

        <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--forest-950)", fontWeight: 700 }}>
          {loggedUserRole === "admin" ? `📋 Usuários Ativos (${Object.keys(usersMap).length})` : "👤 Seu Perfil"}
        </h4>

        {adminErrorMsg && loggedUserRole !== "admin" && <p style={{ color: "var(--danger)", fontSize: "12px", margin: "0 0 10px", fontWeight: 600 }}>{adminErrorMsg}</p>}
        {adminSuccessMsg && loggedUserRole !== "admin" && <p style={{ color: "var(--success)", fontSize: "12px", margin: "0 0 10px", fontWeight: 600 }}>{adminSuccessMsg}</p>}

        <UserTable
          loggedUserRole={loggedUserRole}
          loggedUserKey={loggedUserKey}
          usersMap={usersMap}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          editUsernameInput={editUsernameInput}
          setEditUsernameInput={setEditUsernameInput}
          editFullNameInput={editFullNameInput}
          setEditFullNameInput={setEditFullNameInput}
          editRoleInput={editRoleInput}
          setEditRoleInput={setEditRoleInput}
          editClientNameInput={editClientNameInput}
          setEditClientNameInput={setEditClientNameInput}
          editNewPassInput={editNewPassInput}
          setEditNewPassInput={setEditNewPassInput}
          editingCurrentPassInput={editingCurrentPassInput}
          setEditingCurrentPassInput={setEditingCurrentPassInput}
          onStartEdit={onStartEdit}
          onDeleteUser={onDeleteUser}
          onAdminUpdateUser={onAdminUpdateUser}
          onChangePassword={onChangePassword}
        />
      </div>
    </div>
  );
}
