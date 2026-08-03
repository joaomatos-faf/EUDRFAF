"use client";

import React from "react";
import { UserEditRow } from "./UserEditRow";

interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

interface UserTableProps {
  loggedUserRole: "admin" | "user" | "client";
  loggedUserKey: string;
  usersMap: Record<string, UserProfile>;
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

export function UserTable({
  loggedUserRole,
  loggedUserKey,
  usersMap,
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
}: UserTableProps) {
  const visibleEntries = Object.entries(usersMap).filter(
    ([userKey]) => loggedUserRole === "admin" || userKey === loggedUserKey
  );

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
      {visibleEntries.map(([userKey, profile], idx) => (
        <UserEditRow
          key={userKey}
          userKey={userKey}
          profile={profile}
          loggedUserRole={loggedUserRole}
          idx={idx}
          totalCount={visibleEntries.length}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          editUsernameInput={editUsernameInput}
          setEditUsernameInput={setEditUsernameInput}
          editFullNameInput={editFullNameInput}
          setEditFullNameInput={setEditFullNameInput}
          editRoleInput={editRoleInput}
          setEditRoleInput={setEditRoleInput}
          editNewPassInput={editNewPassInput}
          setEditNewPassInput={setEditNewPassInput}
          editingCurrentPassInput={editingCurrentPassInput}
          setEditingCurrentPassInput={setEditingCurrentPassInput}
          onStartEdit={onStartEdit}
          onDeleteUser={onDeleteUser}
          onAdminUpdateUser={onAdminUpdateUser}
          onChangePassword={onChangePassword}
        />
      ))}
    </div>
  );
}
