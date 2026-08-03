"use client";

import { useEffect, useState } from "react";
import { checkPasswordMatch, hashPassword } from "../lib/eudr";
import { recordAuditLog } from "../lib/auditLogger";

export interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

const DEFAULT_USERS_DATA: Record<string, UserProfile> = {
  faf: { pass: "eudr2026", fullName: "FAF Coffees", role: "admin" },
  admin: { pass: "faf2026", fullName: "Administrador FAF", role: "admin" },
  joao: { pass: "faf1234", fullName: "João Silva", role: "user" },
  joaomatos: { pass: "123", fullName: "João Matos", role: "admin" },
  cliente: { pass: "cliente123", fullName: "Cliente Demo", role: "client", clientName: "BELCO" },
};

export function useUserManagement(onUserLoggedIn?: (fullName: string) => void) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loggedUserKey, setLoggedUserKey] = useState("");
  const [loggedUserRole, setLoggedUserRole] = useState<"admin" | "user" | "client">("user");
  const [loggedClientName, setLoggedClientName] = useState<string>("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>(DEFAULT_USERS_DATA);
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "user" | "client">("user");
  const [newAdminClientName, setNewAdminClientName] = useState("");
  const [adminErrorMsg, setAdminErrorMsg] = useState("");
  const [adminSuccessMsg, setAdminSuccessMsg] = useState("");

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUsernameInput, setEditUsernameInput] = useState("");
  const [editFullNameInput, setEditFullNameInput] = useState("");
  const [editRoleInput, setEditRoleInput] = useState<"admin" | "user" | "client">("user");
  const [editClientNameInput, setEditClientNameInput] = useState("");
  const [editNewPassInput, setEditNewPassInput] = useState("");
  const [editingCurrentPassInput, setEditingCurrentPassInput] = useState("");

  const saveUsers = async (updated: Record<string, UserProfile>) => {
    setUsersMap(updated);
    try {
      localStorage.setItem("faf_eudr_users", JSON.stringify(updated));
    } catch {}
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ users: updated }),
      });
    } catch {}
  };

  useEffect(() => {
    const initUsers = async () => {
      let initial: Record<string, any> = DEFAULT_USERS_DATA;
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (data?.users && typeof data.users === "object" && Object.keys(data.users).length > 0) {
            initial = data.users;
          }
        }
      } catch {}

      if (initial === DEFAULT_USERS_DATA) {
        try {
          const saved = localStorage.getItem("faf_eudr_users");
          if (saved) initial = JSON.parse(saved);
        } catch {}
      }

      const hashedMap: Record<string, UserProfile> = {};
      for (const [u, val] of Object.entries(initial)) {
        let pass = typeof val === "string" ? val : val.pass;
        let fullName = typeof val === "string" ? u.toUpperCase() : (val.fullName || u.toUpperCase());
        let role: "admin" | "user" | "client" = typeof val === "object" && val.role ? val.role : (u === "faf" || u === "admin" || u === "joaomatos" ? "admin" : "user");
        let clientName = typeof val === "object" ? val.clientName : undefined;
        if (pass.length !== 64 || !/^[0-9a-f]+$/i.test(pass)) {
          pass = await hashPassword(pass);
        }
        hashedMap[u] = { pass, fullName, role, clientName };
      }
      setUsersMap(hashedMap);
      try {
        localStorage.setItem("faf_eudr_users", JSON.stringify(hashedMap));
      } catch {}
    };
    initUsers();
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem("faf_eudr_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      const savedName = sessionStorage.getItem("faf_eudr_user_name");
      const savedKey = sessionStorage.getItem("faf_eudr_user_key");
      const savedRole = sessionStorage.getItem("faf_eudr_user_role") as "admin" | "user" | "client";
      const savedClient = sessionStorage.getItem("faf_eudr_client_name");
      if (savedName && onUserLoggedIn) onUserLoggedIn(savedName);
      if (savedKey) setLoggedUserKey(savedKey);
      if (savedRole) setLoggedUserRole(savedRole);
      if (savedClient) setLoggedClientName(savedClient);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent): Promise<boolean> => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    const userKey = loginUsername.trim().toLowerCase();

    let currentUsersMap = usersMap;
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (data?.users && typeof data.users === "object") currentUsersMap = data.users;
      }
    } catch {}

    const profile = currentUsersMap[userKey];
    if (!profile) {
      setLoginError("Usuário ou senha incorretos.");
      return false;
    }

    const passToTest = typeof profile === "string" ? profile : profile.pass;
    const isMatch = await checkPasswordMatch(loginPassword, passToTest);

    if (isMatch) {
      const fullName = typeof profile === "string" ? userKey.toUpperCase() : (profile.fullName || userKey);
      const role = typeof profile === "string" ? "user" : (profile.role || "user");
      const clientName = typeof profile === "string" ? "" : (profile.clientName || profile.fullName || userKey);
      sessionStorage.setItem("faf_eudr_auth", "true");
      sessionStorage.setItem("faf_eudr_user_name", fullName);
      sessionStorage.setItem("faf_eudr_user_key", userKey);
      sessionStorage.setItem("faf_eudr_user_role", role);
      sessionStorage.setItem("faf_eudr_client_name", clientName);
      setIsAuthenticated(true);
      setLoggedUserKey(userKey);
      setLoggedUserRole(role);
      setLoggedClientName(clientName);
      if (onUserLoggedIn) onUserLoggedIn(fullName);
      setLoginError("");

      recordAuditLog(userKey, fullName, "LOGIN", "ACESSO", `Usuário @${userKey} (${fullName}) realizou login.`);
      return true;
    } else {
      setLoginError("Usuário ou senha incorretos.");
      return false;
    }
  };

  const handleLogout = () => {
    const currentName = sessionStorage.getItem("faf_eudr_user_name") || loggedUserKey;
    recordAuditLog(loggedUserKey, currentName, "LOGOUT", "ACESSO", `Usuário @${loggedUserKey} encerrou a sessão.`);
    sessionStorage.removeItem("faf_eudr_auth");
    sessionStorage.removeItem("faf_eudr_user_name");
    sessionStorage.removeItem("faf_eudr_user_key");
    sessionStorage.removeItem("faf_eudr_user_role");
    sessionStorage.removeItem("faf_eudr_client_name");
    setIsAuthenticated(false);
    setLoggedUserKey("");
    setLoggedUserRole("user");
    setLoggedClientName("");
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newAdminUser.trim().toLowerCase();
    const cleanName = newAdminFullName.trim();
    if (!cleanUser || !newAdminPass.trim() || !cleanName) {
      setAdminErrorMsg("Preencha Usuário, Nome/Sobrenome e Senha.");
      return;
    }
    const hashed = await hashPassword(newAdminPass.trim());
    const updated = {
      ...usersMap,
      [cleanUser]: {
        pass: hashed,
        fullName: cleanName,
        role: newAdminRole,
        clientName: newAdminRole === "client" ? newAdminClientName.trim() || cleanName : undefined,
      },
    };
    await saveUsers(updated);

    const currentUser = loggedUserKey || "admin";
    const currentName = sessionStorage.getItem("faf_eudr_user_name") || currentUser;
    recordAuditLog(currentUser, currentName, "USER_CREATED", "USUARIOS", `Criou novo usuário @${cleanUser} (${cleanName}) com perfil ${newAdminRole}.`);

    setNewAdminUser("");
    setNewAdminFullName("");
    setNewAdminPass("");
    setNewAdminRole("user");
    setNewAdminClientName("");
    setAdminErrorMsg("");
    setAdminSuccessMsg(`Usuário "${cleanUser}" (${cleanName}) criado como ${newAdminRole === "client" ? "Cliente" : newAdminRole === "admin" ? "ADM" : "Usuário Padrão"}!`);
    setTimeout(() => setAdminSuccessMsg(""), 3000);
  };

  const handleStartEdit = (userKey: string, profile: UserProfile) => {
    setEditingUser(userKey);
    setEditUsernameInput(userKey);
    const name = typeof profile === "string" ? userKey.toUpperCase() : (profile.fullName || userKey.toUpperCase());
    const role = typeof profile === "string" ? "user" : (profile.role || "user");
    const clientName = typeof profile === "string" ? "" : (profile.clientName || "");
    setEditFullNameInput(name);
    setEditRoleInput(role);
    setEditClientNameInput(clientName);
    setEditNewPassInput("");
    setEditingCurrentPassInput("");
    setAdminErrorMsg("");
  };

  const handleDeleteUser = async (userKey: string) => {
    if (Object.keys(usersMap).length <= 1) {
      alert("Você não pode excluir todos os usuários!");
      return;
    }
    const updated = { ...usersMap };
    delete updated[userKey];
    await saveUsers(updated);

    const currentUser = loggedUserKey || "admin";
    const currentName = sessionStorage.getItem("faf_eudr_user_name") || currentUser;
    recordAuditLog(currentUser, currentName, "USER_UPDATED", "USUARIOS", `Excluiu o usuário @${userKey}.`);
  };

  const handleAdminUpdateUser = async (oldUserKey: string) => {
    const newCleanUser = editUsernameInput.trim().toLowerCase();
    const cleanName = editFullNameInput.trim();
    if (!newCleanUser) {
      setAdminErrorMsg("Informe o Usuário (login).");
      return;
    }
    if (!cleanName) {
      setAdminErrorMsg("Informe o Nome Completo.");
      return;
    }

    if (newCleanUser !== oldUserKey && usersMap[newCleanUser]) {
      setAdminErrorMsg(`O usuário (login) "${newCleanUser}" já existe.`);
      return;
    }

    const profile = usersMap[oldUserKey];
    if (!profile) return;

    let newHash = typeof profile === "string" ? profile : profile.pass;
    if (editNewPassInput.trim()) {
      newHash = await hashPassword(editNewPassInput.trim());
    }

    const updated = { ...usersMap };
    if (newCleanUser !== oldUserKey) {
      delete updated[oldUserKey];
    }

    updated[newCleanUser] = {
      pass: newHash,
      fullName: cleanName,
      role: editRoleInput,
      clientName: editRoleInput === "client" ? editClientNameInput.trim() || cleanName : undefined,
    };

    await saveUsers(updated);

    const currentUser = loggedUserKey || "admin";
    const currentName = sessionStorage.getItem("faf_eudr_user_name") || currentUser;
    recordAuditLog(currentUser, currentName, "USER_UPDATED", "USUARIOS", `Atualizou informações do usuário @${newCleanUser} (${cleanName}).`);

    if (oldUserKey === loggedUserKey) {
      sessionStorage.setItem("faf_eudr_user_key", newCleanUser);
      sessionStorage.setItem("faf_eudr_user_name", cleanName);
      sessionStorage.setItem("faf_eudr_user_role", editRoleInput);
      if (editRoleInput === "client") {
        sessionStorage.setItem("faf_eudr_client_name", editClientNameInput.trim() || cleanName);
        setLoggedClientName(editClientNameInput.trim() || cleanName);
      }
      setLoggedUserKey(newCleanUser);
      setLoggedUserRole(editRoleInput);
      if (onUserLoggedIn) onUserLoggedIn(cleanName);
    }

    setEditingUser(null);
    setEditUsernameInput("");
    setEditFullNameInput("");
    setEditClientNameInput("");
    setEditNewPassInput("");
    setAdminErrorMsg("");
    setAdminSuccessMsg(`Usuário "${newCleanUser}" atualizado com sucesso!`);
    setTimeout(() => setAdminSuccessMsg(""), 3000);
  };

  const handleChangePassword = async (userKey: string) => {
    if (!editingCurrentPassInput.trim()) {
      setAdminErrorMsg("Informe a senha atual.");
      return;
    }
    if (!editNewPassInput.trim()) {
      setAdminErrorMsg("Informe a nova senha.");
      return;
    }

    const profile = usersMap[userKey];
    if (!profile) {
      setAdminErrorMsg("Usuário não encontrado.");
      return;
    }

    const storedPass = typeof profile === "string" ? profile : profile.pass;
    const isCurrentValid = await checkPasswordMatch(editingCurrentPassInput.trim(), storedPass);
    if (!isCurrentValid) {
      setAdminErrorMsg("A senha atual informada está incorreta.");
      return;
    }

    const hashedNew = await hashPassword(editNewPassInput.trim());
    const fullName = typeof profile === "string" ? userKey.toUpperCase() : profile.fullName;
    const role = typeof profile === "string" ? "user" : profile.role;
    const clientName = typeof profile === "string" ? undefined : profile.clientName;
    const updated = { ...usersMap, [userKey]: { pass: hashedNew, fullName, role, clientName } };
    await saveUsers(updated);

    recordAuditLog(userKey, fullName, "PASSWORD_CHANGED", "USUARIOS", `Usuário @${userKey} alterou sua senha.`);

    setEditingUser(null);
    setEditingCurrentPassInput("");
    setEditNewPassInput("");
    setAdminErrorMsg("");
    setAdminSuccessMsg(`Sua senha foi alterada com sucesso!`);
    setTimeout(() => setAdminSuccessMsg(""), 3000);
  };

  return {
    isAuthenticated,
    loggedUserKey,
    loggedUserRole,
    loggedClientName,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    showAdminModal,
    setShowAdminModal,
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
    handleLogin,
    handleLogout,
    handleAddUser,
    handleStartEdit,
    handleDeleteUser,
    handleAdminUpdateUser,
    handleChangePassword,
  };
}
