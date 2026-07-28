"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  GeometryData,
  buildEudrGeoJson,
  buildShapefileZip,
  buildShapefileParts,
  zipStore,
  calculateAreaHectares,
  downloadBlob,
  parseGeometryFile,
  producerCsv,
  sanitizePlotId,
} from "./lib/eudr";

type FormState = {
  plotId: string;
  farm: string;
  producer: string;
  supplier: string;
  region: string;
  municipality: string;
  state: string;
  mappedAt: string;
  checkedAt: string;
  compliance: string;
  notes: string;
  mappedBy: string;
  car: string;
};

type Municipality = {
  id: number;
  name: string;
  stateCode: string;
  stateName: string;
  region: string;
};

type IbgeMunicipality = {
  "municipio-id"?: number;
  "municipio-nome"?: string;
  "UF-sigla"?: string;
  "UF-nome"?: string;
  "regiao-nome"?: string;
};

type MapbiomasCheck = {
  status: "idle" | "loading" | "clear" | "attention" | "error";
  areaHa: number;
  checkedAt: string;
  message: string;
  verificationUrl: string;
  changes: Array<{
    fromYear: number;
    toYear: number;
    className: string;
    fromHa: number;
    toHa: number;
  }>;
};

const emptyMapbiomasCheck: MapbiomasCheck = {
  status: "idle",
  areaHa: 0,
  checkedAt: "",
  message: "",
  verificationUrl: "",
  changes: [],
};

const today = new Date().toISOString().slice(0, 10);
const shapefileDetailFields = new Set<keyof FormState>([
  "plotId", "farm", "producer", "supplier", "region", "municipality", "state",
  "mappedAt", "mappedBy", "car",
]);

const initialForm: FormState = {
  plotId: "",
  farm: "",
  producer: "",
  supplier: "",
  region: "",
  municipality: "",
  state: "",
  mappedAt: today,
  checkedAt: today,
  compliance: "",
  notes: "",
  mappedBy: "",
  car: "",
};

function normalizedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

const MapPreviewComponent = dynamic(() => import("./MapPreviewComponent"), { 
  ssr: false, 
  loading: () => <div style={{ width: 560, height: 320, background: "#f3f6ee", borderRadius: 8 }} />
});

function MapPreview({ geometry }: { geometry: GeometryData }) {
  return <MapPreviewComponent geometry={geometry} />;
}

// Função para criptografar a senha usando o algoritmo SHA-256 do navegador
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode("FAF_EUDR_SALT_2026_" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const checkPasswordMatch = async (inputPass: string, storedValue: string): Promise<boolean> => {
  const inputHash = await hashPassword(inputPass);
  if (storedValue.length === 64 && /^[0-9a-f]+$/i.test(storedValue)) {
    return inputHash === storedValue;
  }
  return inputPass === storedValue;
};

interface UserProfile {
  pass: string;
  fullName: string;
  role: "admin" | "user";
}

// Dicionário de Usuários Padrão com Permissões (ADM vs Usuário)
const DEFAULT_USERS_DATA: Record<string, UserProfile> = {
  faf: { pass: "eudr2026", fullName: "FAF Coffees", role: "admin" },
  admin: { pass: "faf2026", fullName: "Administrador FAF", role: "admin" },
  joao: { pass: "faf1234", fullName: "João Silva", role: "user" },
  joaomatos: { pass: "123", fullName: "João Matos", role: "admin" },
};

export default function Home() {
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>(DEFAULT_USERS_DATA);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "user">("user");
  const [adminSuccessMsg, setAdminSuccessMsg] = useState("");
  const [adminErrorMsg, setAdminErrorMsg] = useState("");

  const [loggedUserKey, setLoggedUserKey] = useState<string>("");
  const [loggedUserRole, setLoggedUserRole] = useState<"admin" | "user">("user");

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [form, setForm] = useState<FormState>(initialForm);
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [carConfirmed, setCarConfirmed] = useState(false);
  const [mapbiomasConfirmed, setMapbiomasConfirmed] = useState(false);
  const [mapbiomasCheck, setMapbiomasCheck] = useState<MapbiomasCheck>(emptyMapbiomasCheck);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [locationsStatus, setLocationsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [locationsReload, setLocationsReload] = useState(0);

  useEffect(() => {
    const initUsers = async () => {
      try {
        const saved = localStorage.getItem("faf_eudr_users");
        let initial: Record<string, any> = DEFAULT_USERS_DATA;
        if (saved) {
          initial = JSON.parse(saved);
        }
        const hashedMap: Record<string, UserProfile> = {};
        for (const [u, val] of Object.entries(initial)) {
          let pass = typeof val === "string" ? val : val.pass;
          let fullName = typeof val === "string" ? u.toUpperCase() : (val.fullName || u.toUpperCase());
          let role: "admin" | "user" = typeof val === "object" && val.role ? val.role : (u === "faf" || u === "admin" || u === "joaomatos" ? "admin" : "user");
          if (pass.length !== 64 || !/^[0-9a-f]+$/i.test(pass)) {
            pass = await hashPassword(pass);
          }
          hashedMap[u] = { pass, fullName, role };
        }
        setUsersMap(hashedMap);
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
      const savedRole = sessionStorage.getItem("faf_eudr_user_role") as "admin" | "user";
      if (savedName) setForm((prev) => ({ ...prev, mappedBy: savedName }));
      if (savedKey) setLoggedUserKey(savedKey);
      if (savedRole) setLoggedUserRole(savedRole);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const userKey = loginUsername.trim().toLowerCase();

    let currentUsersMap = usersMap;
    try {
      const saved = localStorage.getItem("faf_eudr_users");
      if (saved) currentUsersMap = JSON.parse(saved);
    } catch {}

    const profile = currentUsersMap[userKey];
    if (!profile) {
      setLoginError("Usuário ou senha incorretos.");
      return;
    }

    const passToTest = typeof profile === "string" ? profile : profile.pass;
    const isMatch = await checkPasswordMatch(loginPassword, passToTest);

    if (isMatch) {
      const fullName = typeof profile === "string" ? userKey.toUpperCase() : (profile.fullName || userKey);
      const role = typeof profile === "string" ? "user" : (profile.role || "user");
      sessionStorage.setItem("faf_eudr_auth", "true");
      sessionStorage.setItem("faf_eudr_user_name", fullName);
      sessionStorage.setItem("faf_eudr_user_key", userKey);
      sessionStorage.setItem("faf_eudr_user_role", role);
      setIsAuthenticated(true);
      setLoggedUserKey(userKey);
      setLoggedUserRole(role);
      setForm((prev) => ({ ...prev, mappedBy: fullName }));
      setLoginError("");
    } else {
      setLoginError("Usuário ou senha incorretos.");
    }
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
    const updated = { ...usersMap, [cleanUser]: { pass: hashed, fullName: cleanName, role: newAdminRole } };
    setUsersMap(updated);
    try {
      localStorage.setItem("faf_eudr_users", JSON.stringify(updated));
    } catch {}
    setNewAdminUser("");
    setNewAdminFullName("");
    setNewAdminPass("");
    setNewAdminRole("user");
    setAdminErrorMsg("");
    setAdminSuccessMsg(`Usuário "${cleanUser}" (${cleanName}) criado como ${newAdminRole === "admin" ? "ADM" : "Usuário Padrão"}!`);
    setTimeout(() => setAdminSuccessMsg(""), 3000);
  };

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUsernameInput, setEditUsernameInput] = useState("");
  const [editFullNameInput, setEditFullNameInput] = useState("");
  const [editRoleInput, setEditRoleInput] = useState<"admin" | "user">("user");
  const [editNewPassInput, setEditNewPassInput] = useState("");
  const [editingCurrentPassInput, setEditingCurrentPassInput] = useState("");

  const handleStartEdit = (userKey: string, profile: UserProfile) => {
    setEditingUser(userKey);
    setEditUsernameInput(userKey);
    const name = typeof profile === "string" ? userKey.toUpperCase() : (profile.fullName || userKey.toUpperCase());
    const role = typeof profile === "string" ? "user" : (profile.role || "user");
    setEditFullNameInput(name);
    setEditRoleInput(role);
    setEditNewPassInput("");
    setEditingCurrentPassInput("");
    setAdminErrorMsg("");
  };

  const handleDeleteUser = (userKey: string) => {
    if (Object.keys(usersMap).length <= 1) {
      alert("Você não pode excluir todos os usuários!");
      return;
    }
    const updated = { ...usersMap };
    delete updated[userKey];
    setUsersMap(updated);
    try {
      localStorage.setItem("faf_eudr_users", JSON.stringify(updated));
    } catch {}
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
    };

    setUsersMap(updated);
    try {
      localStorage.setItem("faf_eudr_users", JSON.stringify(updated));
    } catch {}

    if (oldUserKey === loggedUserKey) {
      sessionStorage.setItem("faf_eudr_user_key", newCleanUser);
      sessionStorage.setItem("faf_eudr_user_name", cleanName);
      sessionStorage.setItem("faf_eudr_user_role", editRoleInput);
      setLoggedUserKey(newCleanUser);
      setLoggedUserRole(editRoleInput);
      setForm((prev) => ({ ...prev, mappedBy: cleanName }));
    }

    setEditingUser(null);
    setEditUsernameInput("");
    setEditFullNameInput("");
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
    const updated = { ...usersMap, [userKey]: { pass: hashedNew, fullName, role } };
    setUsersMap(updated);
    try {
      localStorage.setItem("faf_eudr_users", JSON.stringify(updated));
    } catch {}

    setEditingUser(null);
    setEditingCurrentPassInput("");
    setEditNewPassInput("");
    setAdminErrorMsg("");
    setAdminSuccessMsg(`Sua senha foi alterada com sucesso!`);
    setTimeout(() => setAdminSuccessMsg(""), 3000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("faf_eudr_auth");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    let active = true;
    setLocationsStatus("loading");
    const loadMunicipalities = async () => {
      try {
        const response = await fetch("/api/locations/municipalities");
        const result = await response.json() as { municipalities?: Municipality[]; error?: string };
        if (!response.ok || !result.municipalities?.length) throw new Error(result.error);
        return result.municipalities;
      } catch {
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome",
        );
        if (!response.ok) throw new Error("IBGE indisponível");
        const data = await response.json() as IbgeMunicipality[];
        return data
          .filter((item) => item["municipio-id"] && item["municipio-nome"] && item["UF-sigla"])
          .map((item) => ({
            id: Number(item["municipio-id"]),
            name: String(item["municipio-nome"]),
            stateCode: String(item["UF-sigla"]),
            stateName: String(item["UF-nome"] ?? item["UF-sigla"]),
            region: String(item["regiao-nome"] ?? ""),
          }));
      }
    };
    loadMunicipalities()
      .then((items) => {
        if (!active) return;
        setMunicipalities(items);
        setLocationsStatus("ready");
      })
      .catch(() => {
        if (active) setLocationsStatus("error");
      });
    return () => { active = false; };
  }, [locationsReload]);

  const area = useMemo(
    () => (geometry ? calculateAreaHectares(geometry) : 0),
    [geometry],
  );
  const centerCoord = useMemo(() => {
    if (!geometry) return null;
    const points = geometry.polygons.flat(2);
    if (!points.length) return null;
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return { lng: (Math.min(...xs) + Math.max(...xs)) / 2, lat: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }, [geometry]);
  const normalizedId = sanitizePlotId(form.plotId);
  const exactMunicipalities = useMemo(() => {
    const query = normalizedText(form.municipality);
    if (!query) return [];
    return municipalities.filter((municipality) => normalizedText(municipality.name) === query);
  }, [form.municipality, municipalities]);
  const municipalitySuggestions = useMemo(() => {
    const query = normalizedText(form.municipality);
    if (query.length < 2) return [];
    const startsWith = municipalities.filter((item) => normalizedText(item.name).startsWith(query));
    const contains = municipalities.filter((item) => {
      const name = normalizedText(item.name);
      return !name.startsWith(query) && name.includes(query);
    });
    return [...startsWith, ...contains].slice(0, 60);
  }, [form.municipality, municipalities]);

  useEffect(() => {
    if (locationsStatus !== "ready" || exactMunicipalities.length !== 1) return;
    const selected = exactMunicipalities[0];
    setForm((current) => {
      if (current.state || current.region) return current;
      return {
        ...current,
        municipality: selected.name,
        state: selected.stateName,
        region: selected.region,
      };
    });
  }, [exactMunicipalities, locationsStatus]);
  const mapbiomasReady = Boolean(
    geometry &&
      normalizedId &&
      form.supplier.trim() &&
      form.municipality.trim() &&
      form.state.trim() &&
      form.mappedBy.trim(),
  );
  const ready = Boolean(
    geometry &&
      normalizedId &&
      form.supplier.trim() &&
      form.municipality.trim() &&
      form.state.trim() &&
      form.compliance &&
      form.mappedBy.trim() &&
      carConfirmed &&
      mapbiomasConfirmed,
  );

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (shapefileDetailFields.has(field) && mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const updateMunicipality = (value: string) => {
    const query = normalizedText(value);
    const exact = municipalities.filter((municipality) => normalizedText(municipality.name) === query);
    const selected = exact.length === 1 ? exact[0] : null;
    setForm((current) => ({
      ...current,
      municipality: selected?.name ?? value,
      state: selected?.stateName ?? "",
      region: selected?.region ?? "",
    }));
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const selectMunicipalityState = (stateCode: string) => {
    const selected = exactMunicipalities.find((municipality) => municipality.stateCode === stateCode);
    if (!selected) return;
    setForm((current) => ({
      ...current,
      municipality: selected.name,
      state: selected.stateName,
      region: selected.region,
    }));
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const selectMunicipality = (selected: Municipality) => {
    setForm((current) => ({
      ...current,
      municipality: selected.name,
      state: selected.stateName,
      region: selected.region,
    }));
    setLocationSuggestionsOpen(false);
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const parsed = await parseGeometryFile(file);
      setGeometry(parsed);
      setFileName(file.name);
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    } catch (problem) {
      setGeometry(null);
      setFileName("");
      setError(problem instanceof Error ? problem.message : "Não foi possível ler o arquivo.");
    }
  };

  const checkMapbiomas = async () => {
    if (!geometry) return;
    setMapbiomasConfirmed(false);
    setMapbiomasCheck({ ...emptyMapbiomasCheck, status: "loading" });
    try {
      const response = await fetch("/api/mapbiomas/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          geometry,
          details: { ...form, plotId: normalizedId, checkedAt: today },
        }),
      });
      const result = await response.json() as {
        areaHa?: number;
        hasChanges?: boolean;
        changes?: MapbiomasCheck["changes"];
        checkedAt?: string;
        verificationUrl?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Não foi possível consultar o MapBiomas.");
      const mappedArea = result.areaHa ?? 0;
      setMapbiomasCheck({
        status: result.hasChanges ? "attention" : "clear",
        areaHa: mappedArea,
        checkedAt: result.checkedAt ?? new Date().toISOString(),
        message: "",
        verificationUrl: result.verificationUrl ?? "",
        changes: result.changes ?? [],
      });
      update("checkedAt", today);
    } catch (problem) {
      setMapbiomasCheck({
        ...emptyMapbiomasCheck,
        status: "error",
        message: problem instanceof Error ? problem.message : "Não foi possível consultar o MapBiomas.",
      });
    }
  };

  const downloadGeoJson = () => {
    if (!geometry || !normalizedId) return;
    const content = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
    downloadBlob(`${normalizedId}.geojson`, new Blob([content], { type: "application/geo+json" }));
  };

  const downloadShape = () => {
    if (!geometry || !normalizedId) return;
    downloadBlob(`${normalizedId}-shapefile.zip`, buildShapefileZip(geometry, normalizedId, area, form));
  };

  const downloadCsv = () => {
    if (!normalizedId) return;
    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Série temporal de Cobertura por classe, Coleção 10.1 (${new Date(mapbiomasCheck.checkedAt).toLocaleString("pt-BR")}): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) entre classes/anos de 2020 a 2024` : "nenhuma alteração entre 2020 e 2024"}.${mapbiomasCheck.verificationUrl ? ` Verificação: ${mapbiomasCheck.verificationUrl}.` : ""}`
      : "MapBiomas Série temporal de Cobertura: consulta automática não realizada.";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");
    const content = producerCsv({ ...form, notes, plotId: normalizedId, area });
    downloadBlob(`${normalizedId}-cadastro.csv`, new Blob([content], { type: "text/csv;charset=utf-8" }));
  };

  const exportAll = () => {
    if (!geometry || !normalizedId) return;

    // 1. GeoJSON
    const geojsonContent = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
    const geojsonBytes = new TextEncoder().encode(geojsonContent);

    // 2. CSV
    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Série temporal de Cobertura por classe, Coleção 10.1 (${new Date(mapbiomasCheck.checkedAt).toLocaleString("pt-BR")}): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) entre classes/anos de 2020 a 2024` : "nenhuma alteração entre 2020 e 2024"}.${mapbiomasCheck.verificationUrl ? ` Verificação: ${mapbiomasCheck.verificationUrl}.` : ""}`
      : "MapBiomas Série temporal de Cobertura: consulta automática não realizada.";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");
    const csvContent = producerCsv({ ...form, notes, plotId: normalizedId, area });
    const csvBytes = new TextEncoder().encode(csvContent);

    // 3. Shapefile
    const shapeParts = buildShapefileParts(geometry, normalizedId, area, form);

    // Junta tudo num ZIP só
    const allFiles = [
      { name: `${normalizedId}.geojson`, data: geojsonBytes },
      { name: `${normalizedId}-cadastro.csv`, data: csvBytes },
      ...shapeParts,
    ];

    const zipBlob = zipStore(allFiles);
    downloadBlob(`${normalizedId}-pacote-eudr.zip`, zipBlob);
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600 }}>Carregando sistema...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
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

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
              <p className="error-box" style={{ margin: 0, fontSize: "13px" }}>{loginError}</p>
            )}

            <button
              type="submit"
              className="primary-button"
              style={{ width: "100%", marginTop: "6px", padding: "13px", borderRadius: "8px", background: "var(--forest-900)", color: "#fff", border: 0, fontWeight: 700, cursor: "pointer" }}
            >
              Entrar no Sistema →
            </button>
          </form>

          <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
            <small style={{ color: "var(--subtle)", fontSize: "11px", fontWeight: 600 }}>FAF Coffees · Sustentabilidade & EUDR</small>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">FAF</div>
          <div>
            <p className="eyebrow">FAF Coffees · Sustentabilidade</p>
            <h1>Preparador EUDR</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="privacy-pill"><span /> Dados locais e consulta segura</div>
          <button
            onClick={() => setShowAdminModal(true)}
            style={{ color: "#d9e5df", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", borderRadius: "999px", cursor: "pointer", background: "rgba(255,255,255,0.06)", fontSize: "11px", fontWeight: 650 }}
          >
            {loggedUserRole === "admin" ? "⚙️ Gerenciar Usuários" : "🔑 Alterar Minha Senha"}
          </button>
          <button
            onClick={handleLogout}
            style={{ color: "#d9e5df", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", borderRadius: "999px", cursor: "pointer", background: "rgba(255,255,255,0.06)", fontSize: "11px", fontWeight: 650 }}
          >
            Sair
          </button>
        </div>
      </header>

      <section className="dashboard-head">
        <div className="hero-copy">
          <p className="section-kicker">Novo processo</p>
          <h2>Prepare um talhão para EUDR</h2>
          <p>Identifique a área, importe a geometria e valide a série temporal do MapBiomas antes de gerar o pacote final.</p>
        </div>
        <div className="status-summary" aria-label="Resumo do processo">
          <div className={geometry ? "complete" : ""}><span>Arquivo</span><strong>{geometry ? "Carregado" : "Pendente"}</strong></div>
          <div className={mapbiomasCheck.checkedAt ? "complete" : ""}><span>MapBiomas</span><strong>{mapbiomasCheck.checkedAt ? "Consultado" : "Pendente"}</strong></div>
          <div className={ready ? "complete" : ""}><span>Pacote EUDR</span><strong>{ready ? "Pronto" : "Em preparo"}</strong></div>
        </div>
      </section>

      <nav className="steps" aria-label="Etapas do processo">
        <span className="active"><i>1</i><b>Identificação</b><small>Dados do talhão</small></span>
        <span className={geometry ? "active" : ""}><i>2</i><b>Geometria</b><small>KML ou GeoJSON</small></span>
        <span className={form.compliance ? "active" : ""}><i>3</i><b>Conformidade</b><small>MapBiomas e CAR</small></span>
        <span className={ready ? "active" : ""}><i>4</i><b>Exportação</b><small>Arquivos finais</small></span>
      </nav>

      <section className="workspace-grid">
        <div className="main-column">
          <article className="card">
            <div className="card-title"><span>01</span><div><h3>Identificação do talhão</h3><p>Use o mesmo padrão adotado no procedimento.</p></div></div>
            <div className="form-grid three">
              <label>Código do talhão *<input value={form.plotId} onChange={(e) => update("plotId", e.target.value.toUpperCase())} placeholder="Ex.: FAFDRAD-01" /><small>FAF + fornecedor + município + número</small></label>
              <label>Fornecedor *<input value={form.supplier} onChange={(e) => update("supplier", e.target.value)} placeholder="Ex.: Drumond" /></label>
              <label>Número do CAR<input value={form.car} onChange={(e) => update("car", e.target.value)} placeholder="Registro no CAR" /></label>
              <label>Nome da fazenda<input value={form.farm} onChange={(e) => update("farm", e.target.value)} placeholder="NA se não informado" /></label>
              <label>Nome do produtor<input value={form.producer} onChange={(e) => update("producer", e.target.value)} placeholder="NA se não informado" /></label>
              <label>
                Responsável pelo mapeamento * 🔒
                <input
                  value={form.mappedBy}
                  readOnly
                  disabled
                  style={{ background: "var(--canvas)", color: "var(--forest-950)", fontWeight: 650, cursor: "not-allowed" }}
                />
                <small style={{ color: "var(--subtle)" }}>Definido pelo seu perfil de login.</small>
              </label>
            </div>
          </article>

          <article className="card">
            <div className="card-title"><span>02</span><div><h3>Geometria da área</h3><p>A área em hectares é calculada automaticamente.</p></div></div>
            <label className={`dropzone ${geometry ? "loaded" : ""}`}>
              <input type="file" accept=".kml,.geojson,.json" onChange={handleFile} />
              <span className="upload-icon">↥</span>
              <strong>{fileName || "Selecionar arquivo KML ou GeoJSON"}</strong>
              <small>{geometry ? "Arquivo validado. Clique para substituir." : "O arquivo permanece somente neste navegador."}</small>
            </label>
            {error && <p className="error-box">{error}</p>}
            {geometry && (
              <div className="geometry-result">
                <MapPreview geometry={geometry} />
                <div className="metrics">
                  <div><span>Área calculada</span><strong>{area.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha</strong></div>
                  <div><span>Polígonos</span><strong>{geometry.polygons.length}</strong></div>
                  <div><span>Sistema</span><strong>WGS 84</strong></div>
                  <p>✓ Geometria fechada e pronta para exportação.</p>
                  {centerCoord && <a className="text-link" style={{marginTop: "8px", display: "inline-block"}} href={`https://www.google.com/maps/search/?api=1&query=${centerCoord.lat},${centerCoord.lng}`} target="_blank" rel="noreferrer">Visualizar no Google Maps ↗</a>}
                </div>
              </div>
            )}
          </article>

          <article className="card">
            <div className="card-title"><span>03</span><div><h3>Localização e conformidade</h3><p>Compare automaticamente a série temporal de cobertura por classe no MapBiomas.</p></div></div>
            <div className="form-grid three">
              <label>Região<input value={form.region} onChange={(e) => update("region", e.target.value)} placeholder={locationsStatus === "loading" ? "Carregando…" : "Preenchida automaticamente"} /><small>Preenchida automaticamente pelo município; você pode alterar se necessário.</small></label>
              <div className="location-field"><label htmlFor="municipality">Município *</label><input id="municipality" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={locationSuggestionsOpen && municipalitySuggestions.length > 0} value={form.municipality} onFocus={() => setLocationSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setLocationSuggestionsOpen(false), 120)} onChange={(e) => { updateMunicipality(e.target.value); setLocationSuggestionsOpen(true); }} placeholder="Digite e selecione o município" />{locationSuggestionsOpen && municipalitySuggestions.length > 0 && <div className="municipality-suggestions" role="listbox">{municipalitySuggestions.map((municipality) => <button type="button" role="option" key={municipality.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectMunicipality(municipality)}><strong>{municipality.name}</strong><span>{municipality.stateCode} · {municipality.stateName}</span></button>)}</div>}<small>{locationsStatus === "loading" ? "Carregando lista oficial do IBGE…" : locationsStatus === "error" ? <>Não foi possível carregar os municípios. <button type="button" className="location-retry" onClick={() => setLocationsReload((value) => value + 1)}>Tentar novamente</button></> : "Digite ao menos duas letras e clique em uma opção."}</small></div>
              {exactMunicipalities.length > 1 && locationsStatus === "ready" ? <label>Estado *<select value={exactMunicipalities.find((item) => item.stateName === form.state)?.stateCode ?? ""} onChange={(e) => selectMunicipalityState(e.target.value)}><option value="">Selecione o estado</option>{exactMunicipalities.map((municipality) => <option key={municipality.id} value={municipality.stateCode}>{municipality.stateName} ({municipality.stateCode})</option>)}</select><small>Este nome de município existe em mais de um estado.</small></label> : <label>Estado *<input value={form.state} readOnly={locationsStatus !== "error"} onChange={(e) => update("state", e.target.value)} placeholder={locationsStatus === "loading" ? "Carregando…" : "Preenchido automaticamente"} /></label>}
              <label>Data do mapeamento<input type="date" value={form.mappedAt} onChange={(e) => update("mappedAt", e.target.value)} /></label>
              <label>Data da verificação<input type="date" value={form.checkedAt} onChange={(e) => update("checkedAt", e.target.value)} /></label>
              <label>Resultado *<select value={form.compliance} onChange={(e) => update("compliance", e.target.value)}><option value="">Selecione</option><option>Em conformidade</option><option>Não conforme</option><option>Revisão necessária</option></select></label>
            </div>
            <div className="mapbiomas-panel">
              <div>
                <strong>MapBiomas Cobertura · série temporal 2020–2024</strong>
                <p>O KML é convertido em Shapefile e as áreas de todas as classes são comparadas ano a ano, com duas casas decimais, como na tabela do MapBiomas.</p>
                {!mapbiomasReady && <small className="mapbiomas-prerequisite">Preencha código do talhão, fornecedor, município, estado e responsável pelo mapeamento.</small>}
              </div>
              <button className="secondary-button" disabled={!mapbiomasReady || mapbiomasCheck.status === "loading"} onClick={checkMapbiomas}>
                {mapbiomasCheck.status === "loading" ? "Consultando…" : mapbiomasCheck.checkedAt ? "Consultar novamente" : "Consultar MapBiomas"}
              </button>
            </div>
            {mapbiomasCheck.status !== "idle" && mapbiomasCheck.status !== "loading" && (
              <div className={`mapbiomas-result ${mapbiomasCheck.status}`}>
                {mapbiomasCheck.status === "clear" && <><strong>✓ Cobertura sem alteração de 2020 a 2024</strong><p>Todas as classes mantiveram os mesmos valores na precisão exibida pela tabela do MapBiomas.</p></>}
                {mapbiomasCheck.status === "attention" && <><strong>! Alteração de cobertura encontrada</strong><p>Revise as mudanças abaixo na tabela da série temporal do MapBiomas.</p><ul className="coverage-changes">{mapbiomasCheck.changes.slice(0, 8).map((change, index) => <li key={`${change.fromYear}-${change.toYear}-${change.className}-${index}`}><b>{change.fromYear}→{change.toYear}</b> · {change.className}: {change.fromHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → {change.toHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha</li>)}{mapbiomasCheck.changes.length > 8 && <li>Mais {mapbiomasCheck.changes.length - 8} alteração(ões). Consulte a tabela completa no link.</li>}</ul></>}
                {mapbiomasCheck.status === "error" && <><strong>Não foi possível concluir a consulta</strong><p>{mapbiomasCheck.message}</p></>}
                {mapbiomasCheck.verificationUrl && <a className="verification-link" href={mapbiomasCheck.verificationUrl} target="_blank" rel="noreferrer">Abrir geometria e cobertura no MapBiomas ↗</a>}
              </div>
            )}
            <label>Observações<textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Registre evidências, ressalvas ou pendências." /></label>
          </article>
        </div>

        <aside>
          <article className="side-card checklist-card">
            <p className="section-kicker">Controles obrigatórios</p>
            <h3>Validação humana</h3>
            <label className="check-row"><input type="checkbox" checked={carConfirmed} onChange={(e) => setCarConfirmed(e.target.checked)} /><span><strong>CAR conferido</strong><small>Registro localizado e KML correto.</small></span></label>
            <a className="text-link" href="https://www.registrorural.com.br/" target="_blank" rel="noreferrer">Abrir Registro Rural ↗</a>
            <label className="check-row"><input type="checkbox" disabled={!mapbiomasCheck.checkedAt} checked={mapbiomasConfirmed} onChange={(e) => setMapbiomasConfirmed(e.target.checked)} /><span><strong>Resultado MapBiomas revisado</strong><small>{mapbiomasCheck.checkedAt ? "Confirme após interpretar a consulta automática." : "Faça a consulta automática antes de confirmar."}</small></span></label>
            {mapbiomasCheck.verificationUrl && <a className="text-link" href={mapbiomasCheck.verificationUrl} target="_blank" rel="noreferrer">Abrir geometria e cobertura no MapBiomas ↗</a>}
          </article>

          <article className="side-card export-card">
            <p className="section-kicker">Pacote final</p>
            <h3>{normalizedId || "Código pendente"}</h3>
            <ul>
              <li><span>GeoJSON EUDR</span><b>{geometry && normalizedId ? "Pronto" : "Pendente"}</b></li>
              <li><span>Shapefile (.zip)</span><b>{geometry && normalizedId ? "Pronto" : "Pendente"}</b></li>
              <li><span>Linha da planilha</span><b>{normalizedId ? "Pronta" : "Pendente"}</b></li>
            </ul>
            <button className="primary-button" disabled={!ready} onClick={exportAll}>Baixar pacote EUDR</button>
            {!ready && <p className="hint">Preencha os campos com * e confirme os dois controles.</p>}
            <div className="individual-actions">
              <button disabled={!geometry || !normalizedId} onClick={downloadGeoJson}>GeoJSON</button>
              <button disabled={!geometry || !normalizedId} onClick={downloadShape}>Shapefile</button>
              <button disabled={!normalizedId} onClick={downloadCsv}>Planilha</button>
            </div>
          </article>

          <article className="side-card note-card"><strong>Privacidade</strong><p>Acesso restrito por credenciais. A consulta envia por HTTPS ao MapBiomas uma cópia temporária da geometria para checagem da série temporal. Os arquivos permanecem salvos localmente.</p></article>
        </aside>
      </section>

      {showAdminModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(16, 44, 36, 0.65)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "520px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "16px", padding: "28px 24px", boxShadow: "var(--shadow-lg)", maxHeight: "90vh", overflowY: "auto" }}>
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
              <form onSubmit={handleAddUser} style={{ background: "var(--canvas)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--forest-950)", fontWeight: 700 }}>➕ Cadastrar Novo Usuário</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <strong style={{ color: "var(--forest-950)" }}>{userKey}</strong>
                        <span style={{ color: "var(--forest-800)", marginLeft: "8px", fontSize: "12px", fontWeight: 650 }}>
                          ({typeof profile === "string" ? userKey.toUpperCase() : (profile.fullName || userKey)})
                        </span>
                        {typeof profile === "object" && profile.role === "admin" && (
                          <span style={{ marginLeft: "8px", fontSize: "10px", background: "var(--forest-100)", color: "var(--forest-900)", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>ADM</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <button
                          onClick={() => {
                            if (editingUser === userKey) {
                              setEditingUser(null);
                            } else {
                              handleStartEdit(userKey, profile);
                            }
                          }}
                          style={{ color: "var(--forest-900)", border: 0, background: "transparent", cursor: "pointer", fontSize: "11.5px", fontWeight: 700 }}
                        >
                          {loggedUserRole === "admin" ? "✏️ Editar" : "🔑 Alterar Senha"}
                        </button>
                        {loggedUserRole === "admin" && (
                          <button
                            onClick={() => handleDeleteUser(userKey)}
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
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
                                onClick={() => handleAdminUpdateUser(userKey)}
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
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
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
                                onClick={() => handleChangePassword(userKey)}
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
      )}
    </main>
  );
}
