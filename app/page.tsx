"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { EudrHeader } from "./components/EudrHeader";
import { EudrStepsNav } from "./components/EudrStepsNav";
import { LoginScreen } from "./components/LoginScreen";
import { AdminUserModal } from "./components/AdminUserModal";
import { AuditLogModal } from "./components/AuditLogModal";
import { NewProcessModal } from "./components/NewProcessModal";
import { useUserManagement } from "./hooks/useUserManagement";
import { recordAuditLog } from "./lib/auditLogger";
import {
  GeometryData,
  buildEudrGeoJson,
  buildShapefileZip,
  buildShapefileParts,
  zipStore,
  zipStoreBytes,
  calculateAreaHectares,
  downloadBlob,
  parseGeometryFile,
  producerCsv,
  buildProducerXlsxBytes,
  sanitizePlotId,
  generateAutoPlotId,
  getTwoLetterInitials,
  incrementPlotIdNumber,
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

type GfwCheck = {
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

const emptyGfwCheck: GfwCheck = {
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
  const [form, setForm] = useState<FormState>(initialForm);

  const userMgmt = useUserManagement((fullName) => {
    setForm((prev) => ({ ...prev, mappedBy: fullName }));
  });

  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [carConfirmed, setCarConfirmed] = useState(false);
  const [gfwConfirmed, setGfwConfirmed] = useState(false);
  const [gfwCheck, setGfwCheck] = useState<GfwCheck>(emptyGfwCheck);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [locationsStatus, setLocationsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [locationsReload, setLocationsReload] = useState(0);
  const [showLogsModal, setShowLogsModal] = useState(false);

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
  const gfwReady = Boolean(
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
      gfwConfirmed,
  );

  const computeNextPlotId = (currentForm: FormState, updatedField: keyof FormState, newValue: string) => {
    const nextForm = { ...currentForm, [updatedField]: newValue };
    const supplierVal = nextForm.supplier || nextForm.producer;
    const municipalityVal = nextForm.municipality;

    const currentPlotId = currentForm.plotId;
    const isAutoOrEmpty = !currentPlotId || /^FAF/i.test(currentPlotId);

    if (isAutoOrEmpty && (supplierVal || municipalityVal)) {
      let plotNumber = "01";
      const numberMatch = currentPlotId.match(/-([0-9A-Z]+)$/i);
      if (numberMatch && numberMatch[1]) {
        plotNumber = numberMatch[1];
      }
      return generateAutoPlotId(supplierVal, municipalityVal, plotNumber);
    }
    return currentForm.plotId;
  };

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => {
      let nextPlotId = current.plotId;
      if (field === "supplier" || field === "producer" || field === "municipality") {
        nextPlotId = computeNextPlotId(current, field, value);
      }
      return {
        ...current,
        [field]: value,
        plotId: field === "plotId" ? value.toUpperCase() : nextPlotId,
      };
    });
    if (shapefileDetailFields.has(field) && mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const updateMunicipality = (value: string) => {
    const query = normalizedText(value);
    const exact = municipalities.filter((municipality) => normalizedText(municipality.name) === query);
    const selected = exact.length === 1 ? exact[0] : null;
    const finalMuniName = selected?.name ?? value;

    setForm((current) => {
      const nextPlotId = computeNextPlotId(current, "municipality", finalMuniName);
      return {
        ...current,
        municipality: finalMuniName,
        state: selected?.stateName ?? "",
        region: selected?.region ?? "",
        plotId: nextPlotId,
      };
    });
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const selectMunicipalityState = (stateCode: string) => {
    const selected = exactMunicipalities.find((municipality) => municipality.stateCode === stateCode);
    if (!selected) return;
    setForm((current) => {
      const nextPlotId = computeNextPlotId(current, "municipality", selected.name);
      return {
        ...current,
        municipality: selected.name,
        state: selected.stateName,
        region: selected.region,
        plotId: nextPlotId,
      };
    });
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const selectMunicipality = (selected: Municipality) => {
    setForm((current) => {
      const nextPlotId = computeNextPlotId(current, "municipality", selected.name);
      return {
        ...current,
        municipality: selected.name,
        state: selected.stateName,
        region: selected.region,
        plotId: nextPlotId,
      };
    });
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
      setGeometry(parsed);
      setFileName(file.name);
      setGfwCheck(emptyGfwCheck);
      setGfwConfirmed(false);

      const activeUser = userMgmt.loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "FILE_UPLOADED",
        "GEOMETRIA",
        `Importou o arquivo "${file.name}" com ${parsed.polygons.length} polígono(s).`,
        normalizedId || undefined
      );
    } catch (problem) {
      setGeometry(null);
      setFileName("");
      setError(problem instanceof Error ? problem.message : "Não foi possível ler o arquivo.");
    }
  };

  const checkGfw = async () => {
    if (!geometry) return;
    setGfwConfirmed(false);
    setGfwCheck({ ...emptyGfwCheck, status: "loading" });
    try {
      const response = await fetch("/api/gfw/check", {
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
        changes?: GfwCheck["changes"];
        checkedAt?: string;
        verificationUrl?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Não foi possível consultar o Global Forest Watch.");
      const mappedArea = result.areaHa ?? 0;
      setGfwCheck({
        status: result.hasChanges ? "attention" : "clear",
        areaHa: mappedArea,
        checkedAt: result.checkedAt ?? new Date().toISOString(),
        message: "",
        verificationUrl: result.verificationUrl ?? "",
        changes: result.changes ?? [],
      });
      update("checkedAt", today);

      const activeUser = userMgmt.loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "GFW_CHECKED",
        "GFW",
        `Consultou Global Forest Watch 2024-${new Date().getFullYear()} para ${normalizedId || "talhão"}: ${result.hasChanges ? `${result.changes?.length || 1} alerta(s) de perda florestal` : "sem perda de cobertura florestal"}.`,
        normalizedId || undefined
      );
    } catch (problem) {
      setGfwCheck({
        ...emptyGfwCheck,
        status: "error",
        message: problem instanceof Error ? problem.message : "Não foi possível consultar o Global Forest Watch.",
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

  const downloadXlsx = () => {
    if (!normalizedId) return;
    const currentYear = new Date().getFullYear();
    const automaticNote = gfwCheck.checkedAt
      ? `Global Forest Watch Perda de Cobertura Florestal (2024–${currentYear}): ${gfwCheck.changes.length ? `${gfwCheck.changes.length} alerta(s) de perda florestal` : "sem perda de cobertura florestal detectada"}.${gfwCheck.verificationUrl ? ` Verificação: ${gfwCheck.verificationUrl}.` : ""}`
      : "Global Forest Watch: consulta automática não realizada.";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");
    const xlsxBytes = buildProducerXlsxBytes({ ...form, notes, plotId: normalizedId, area });
    downloadBlob(`${normalizedId}-cadastro.xlsx`, new Blob([xlsxBytes as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  };

  const exportAll = () => {
    if (!geometry || !normalizedId) return;

    // 1. GeoJSON
    const geojsonContent = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
    const geojsonBytes = new TextEncoder().encode(geojsonContent);

    // 2. XLSX
    const currentYear = new Date().getFullYear();
    const automaticNote = gfwCheck.checkedAt
      ? `Global Forest Watch Perda de Cobertura Florestal (2024–${currentYear}): ${gfwCheck.changes.length ? `${gfwCheck.changes.length} alerta(s) de perda florestal` : "sem perda de cobertura florestal detectada"}.${gfwCheck.verificationUrl ? ` Verificação: ${gfwCheck.verificationUrl}.` : ""}`
      : "Global Forest Watch: consulta automática não realizada.";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");
    const xlsxBytes = buildProducerXlsxBytes({ ...form, notes, plotId: normalizedId, area });

    // 3. Shapefile em ZIP interno
    const shapeParts = buildShapefileParts(geometry, normalizedId, area, form);
    const shapefileZipBytes = zipStoreBytes(shapeParts);

    // Junta tudo no pacote principal mantendo o shapefile.zip comprimido
    const allFiles = [
      { name: `${normalizedId}.geojson`, data: geojsonBytes },
      { name: `${normalizedId}-cadastro.xlsx`, data: xlsxBytes },
      { name: `${normalizedId}-shapefile.zip`, data: shapefileZipBytes },
    ];

    const zipBlob = zipStore(allFiles);
    downloadBlob(`${normalizedId}-pacote-eudr.zip`, zipBlob);

    const activeUser = userMgmt.loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "PACKAGE_EXPORTED",
      "EXPORTACAO",
      `Exportou o pacote EUDR completo (.zip) para o talhão ${normalizedId} (${area.toFixed(2)} ha).`,
      normalizedId
    );
  };

  const [copySuccess, setCopySuccess] = useState(false);

  const copySharePointRow = () => {
    if (!normalizedId) return;

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        const [y, m, d] = dateStr.split("-");
        if (y && m && d) return `${d}/${m}/${y}`;
      } catch {}
      return dateStr;
    };

    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Coleção 10.1: ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões)` : "sem alteração entre 2020 e 2024"}.`
      : "";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");

    const rowValues = [
      normalizedId,
      form.farm || "NA",
      form.producer || "NA",
      form.supplier || "NA",
      form.region || "",
      form.municipality || "",
      form.state || "",
      area.toFixed(2).replace(".", ","),
      formatDate(form.mappedAt),
      formatDate(form.checkedAt),
      form.compliance || "",
      notes,
      form.mappedBy || "",
      form.car || "",
    ];

    const tsv = rowValues.join("\t");
    navigator.clipboard.writeText(tsv).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3500);
    });
  };

  const nextPlotIdPreview = useMemo(() => {
    return incrementPlotIdNumber(normalizedId || form.plotId || "FAFDRAD-01");
  }, [normalizedId, form.plotId]);

  const [showNewProcessModal, setShowNewProcessModal] = useState(false);

  const handleStartFromScratch = () => {
    const activeUser = userMgmt.loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "PROCESS_RESET",
      "GEOMETRIA",
      `Iniciou um novo processo do zero (limpeza total).`
    );

    setForm({
      ...initialForm,
      mappedBy: form.mappedBy || userMgmt.loggedUserKey || (typeof window !== "undefined" ? sessionStorage.getItem("faf_eudr_user_name") || "" : ""),
      mappedAt: today,
      checkedAt: today,
    });
    setGeometry(null);
    setFileName("");
    setError("");
    setCarConfirmed(false);
    setGfwConfirmed(false);
    setGfwCheck(emptyGfwCheck);
  };

  const handleNextPlotSameSupplier = () => {
    const newPlotId = incrementPlotIdNumber(normalizedId || form.plotId);
    const activeUser = userMgmt.loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "PROCESS_RESET",
      "GEOMETRIA",
      `Iniciou próximo talhão para o mesmo fornecedor: código avançado para ${newPlotId}.`,
      newPlotId
    );

    setForm((current) => ({
      ...current,
      plotId: newPlotId,
      mappedAt: today,
      checkedAt: today,
      compliance: "",
      notes: "",
    }));
    setGeometry(null);
    setFileName("");
    setError("");
    setCarConfirmed(false);
    setGfwConfirmed(false);
    setGfwCheck(emptyGfwCheck);
  };

  const handleNewProcessClick = () => {
    const hasData = Boolean(
      form.plotId ||
      form.farm ||
      form.producer ||
      form.supplier ||
      form.car ||
      form.municipality ||
      geometry
    );
    if (hasData) {
      setShowNewProcessModal(true);
    } else {
      handleStartFromScratch();
    }
  };

  if (userMgmt.isAuthenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600 }}>Carregando sistema...</p>
      </div>
    );
  }

  if (userMgmt.isAuthenticated === false) {
    return (
      <LoginScreen
        loginUsername={userMgmt.loginUsername}
        setLoginUsername={userMgmt.setLoginUsername}
        loginPassword={userMgmt.loginPassword}
        setLoginPassword={userMgmt.setLoginPassword}
        loginError={userMgmt.loginError}
        onLogin={userMgmt.handleLogin}
      />
    );
  }

  return (
    <main className="app-shell">
      <EudrHeader
        isAuthenticated={true}
        loggedUserRole={userMgmt.loggedUserRole}
        loggedUserKey={userMgmt.loggedUserKey}
        onOpenAdminModal={() => userMgmt.setShowAdminModal(true)}
        onLogout={userMgmt.handleLogout}
        onNewProcess={handleNewProcessClick}
        onOpenLogsModal={() => setShowLogsModal(true)}
      />

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

      <EudrStepsNav geometryLoaded={Boolean(geometry)} mapbiomasChecked={Boolean(mapbiomasCheck.checkedAt)} />

      <section className="workspace-grid">
        <div className="main-column">
          <article className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "21px", paddingBottom: "18px", borderBottom: "1px solid #e8ede9" }}>
              <div className="card-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 0 }}>
                <span>01</span>
                <div>
                  <h3>Identificação do talhão</h3>
                  <p>Use o mesmo padrão adotado no procedimento.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNewProcessClick}
                style={{
                  border: "1px solid var(--line-strong)",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "var(--forest-900)",
                  padding: "6px 12px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.16s ease",
                }}
                title="Limpar todos os campos e iniciar novo talhão"
              >
                <span>↺</span> Iniciar Novo Processo
              </button>
            </div>
            <div className="form-grid three">
              <label>
                Código do talhão *
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    value={form.plotId}
                    onChange={(e) => update("plotId", e.target.value.toUpperCase())}
                    placeholder="Ex.: FAFDRAD-01"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      let plotNumber = "01";
                      const numberMatch = form.plotId.match(/-([0-9A-Z]+)$/i);
                      if (numberMatch && numberMatch[1]) plotNumber = numberMatch[1];
                      const generated = generateAutoPlotId(form.supplier || form.producer, form.municipality, plotNumber);
                      if (generated) update("plotId", generated);
                    }}
                    title="Gerar código automaticamente (FAF + Fornecedor + Município + N°)"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      background: "var(--canvas)",
                      color: "var(--forest-950)",
                      fontWeight: 700,
                      fontSize: "11px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ⚡ Auto-gerar
                  </button>
                </div>
                <small>
                  FAF + fornecedor ({getTwoLetterInitials(form.supplier || form.producer) || "XX"}) + município ({getTwoLetterInitials(form.municipality) || "XX"}) + número (-01)
                </small>
              </label>
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
            <div className="card-title">
              <span>03</span>
              <div>
                <h3>Localização e conformidade</h3>
                <p>Verificação de desmatamento e cobertura de vegetação no Global Forest Watch (GFW).</p>
              </div>
            </div>
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
                <strong>Global Forest Watch (GFW) · Perda de Cobertura Florestal (2024–{new Date().getFullYear()})</strong>
                <p>O polígono é enviado à Geostore API do GFW para analisar a perda de dossel arbóreo e alertas de desmatamento desde o início de 2024 até o ano atual.</p>
                {!gfwReady && <small className="mapbiomas-prerequisite">Preencha código do talhão, fornecedor, município, estado e responsável pelo mapeamento.</small>}
              </div>
              <button
                className="secondary-button"
                disabled={!gfwReady || gfwCheck.status === "loading"}
                onClick={checkGfw}
              >
                {gfwCheck.status === "loading"
                  ? "Consultando…"
                  : gfwCheck.checkedAt
                    ? "Consultar novamente"
                    : "Consultar GFW"}
              </button>
            </div>
            {gfwCheck.status !== "idle" && gfwCheck.status !== "loading" && (
              <div className={`mapbiomas-result ${gfwCheck.status}`}>
                {gfwCheck.status === "clear" && (
                  <>
                    <strong>✓ Sem alertas de perda de vegetação florestal (2024–{new Date().getFullYear()})</strong>
                    <p>A área mantém-se em conformidade sem perda de cobertura florestal detectada no período.</p>
                  </>
                )}
                {gfwCheck.status === "attention" && (
                  <>
                    <strong>! Perda de cobertura florestal / alteração detectada</strong>
                    <p>Revise o histórico da área abaixo:</p>
                    <ul className="coverage-changes">
                      {gfwCheck.changes.slice(0, 8).map((change, index) => (
                        <li key={`${change.fromYear}-${change.toYear}-${change.className}-${index}`}>
                          <b>{change.fromYear}→{change.toYear}</b> · {change.className}: {change.toHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha
                        </li>
                      ))}
                      {gfwCheck.changes.length > 8 && (
                        <li>Mais {gfwCheck.changes.length - 8} registro(s). Consulte a análise completa no link.</li>
                      )}
                    </ul>
                  </>
                )}
                {gfwCheck.status === "error" && (
                  <>
                    <strong>Não foi possível concluir a consulta</strong>
                    <p>{gfwCheck.message}</p>
                  </>
                )}
                {gfwCheck.verificationUrl && (
                  <a className="verification-link" href={gfwCheck.verificationUrl} target="_blank" rel="noreferrer">
                    Abrir talhão no Mapa Interativo do Global Forest Watch ↗
                  </a>
                )}
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
            <label className="check-row"><input type="checkbox" disabled={!gfwCheck.checkedAt} checked={gfwConfirmed} onChange={(e) => setGfwConfirmed(e.target.checked)} /><span><strong>Resultado GFW revisado</strong><small>{gfwCheck.checkedAt ? "Confirme após interpretar a consulta automática." : "Faça a consulta automática antes de confirmar."}</small></span></label>
            {gfwCheck.verificationUrl && <a className="text-link" href={gfwCheck.verificationUrl} target="_blank" rel="noreferrer">Abrir talhão no Global Forest Watch ↗</a>}
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
              <button disabled={!normalizedId} onClick={downloadXlsx}>Excel (.xlsx)</button>
            </div>
          </article>

          <article className="side-card note-card"><strong>Privacidade</strong><p>Acesso restrito por credenciais. A consulta envia por HTTPS ao MapBiomas uma cópia temporária da geometria para checagem da série temporal. Os arquivos permanecem salvos localmente.</p></article>
        </aside>
      </section>

      <AdminUserModal
        showAdminModal={userMgmt.showAdminModal}
        setShowAdminModal={userMgmt.setShowAdminModal}
        loggedUserRole={userMgmt.loggedUserRole}
        loggedUserKey={userMgmt.loggedUserKey}
        usersMap={userMgmt.usersMap}
        newAdminUser={userMgmt.newAdminUser}
        setNewAdminUser={userMgmt.setNewAdminUser}
        newAdminPass={userMgmt.newAdminPass}
        setNewAdminPass={userMgmt.setNewAdminPass}
        newAdminFullName={userMgmt.newAdminFullName}
        setNewAdminFullName={userMgmt.setNewAdminFullName}
        newAdminRole={userMgmt.newAdminRole}
        setNewAdminRole={userMgmt.setNewAdminRole}
        adminErrorMsg={userMgmt.adminErrorMsg}
        adminSuccessMsg={userMgmt.adminSuccessMsg}
        onAddUser={userMgmt.handleAddUser}
        editingUser={userMgmt.editingUser}
        setEditingUser={userMgmt.setEditingUser}
        editUsernameInput={userMgmt.editUsernameInput}
        setEditUsernameInput={userMgmt.setEditUsernameInput}
        editFullNameInput={userMgmt.editFullNameInput}
        setEditFullNameInput={userMgmt.setEditFullNameInput}
        editRoleInput={userMgmt.editRoleInput}
        setEditRoleInput={userMgmt.setEditRoleInput}
        editNewPassInput={userMgmt.editNewPassInput}
        setEditNewPassInput={userMgmt.setEditNewPassInput}
        editingCurrentPassInput={userMgmt.editingCurrentPassInput}
        setEditingCurrentPassInput={userMgmt.setEditingCurrentPassInput}
        onStartEdit={userMgmt.handleStartEdit}
        onDeleteUser={userMgmt.handleDeleteUser}
        onAdminUpdateUser={userMgmt.handleAdminUpdateUser}
        onChangePassword={userMgmt.handleChangePassword}
      />

      <AuditLogModal
        isOpen={showLogsModal && userMgmt.loggedUserRole === "admin"}
        onClose={() => setShowLogsModal(false)}
      />

      <NewProcessModal
        isOpen={showNewProcessModal}
        onClose={() => setShowNewProcessModal(false)}
        onStartFromScratch={handleStartFromScratch}
        onNextPlotSameSupplier={handleNextPlotSameSupplier}
        currentPlotId={normalizedId || form.plotId}
        currentSupplier={form.supplier || form.producer}
        nextPlotIdPreview={nextPlotIdPreview}
      />
    </main>
  );
}
