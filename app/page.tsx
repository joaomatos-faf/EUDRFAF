"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { EudrHeader } from "./components/EudrHeader";
import { EudrStepsNav } from "./components/EudrStepsNav";
import { LoginScreen } from "./components/LoginScreen";
import { LandingPage } from "./components/LandingPage";
import { ContractManagerView } from "./components/ContractManagerView";
import { AdminUserModal } from "./components/AdminUserModal";
import { AuditLogModal } from "./components/AuditLogModal";
import { NewProcessModal } from "./components/NewProcessModal";
import { ClientPortalModal } from "./components/ClientPortalModal";
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

type MapbiomasCheck = {
  status: "idle" | "loading" | "clear" | "attention" | "error";
  areaHa: number;
  checkedAt: string;
  message: string;
  verificationUrl: string;
  changes: Array<{
    fromYear: number;
    toYear: number;
    pixelValue: number;
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
  const [form, setForm] = useState<FormState>(initialForm);

  const userMgmt = useUserManagement((fullName) => {
    setForm((prev) => ({ ...prev, mappedBy: fullName }));
  });

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
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleLogout = () => {
    userMgmt.handleLogout();
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

  const processSelectedFile = async (file: File) => {
    setError("");
    try {
      const parsed = await parseGeometryFile(file);
      setGeometry(parsed);
      setFileName(file.name);
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);

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

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
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

      const activeUser = userMgmt.loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "MAPBIOMAS_CHECKED",
        "MAPBIOMAS",
        `Consultou MapBiomas 2020-2024 para ${normalizedId || "talhão"}: ${result.hasChanges ? `${result.changes?.length || 1} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.`,
        normalizedId || undefined
      );
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

  const downloadXlsx = () => {
    if (!normalizedId) return;
    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Cobertura (2020–2024): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.${mapbiomasCheck.verificationUrl ? ` Verificação: ${mapbiomasCheck.verificationUrl}.` : ""}`
      : "MapBiomas: consulta automática não realizada.";
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
    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Cobertura (2020–2024): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.${mapbiomasCheck.verificationUrl ? ` Verificação: ${mapbiomasCheck.verificationUrl}.` : ""}`
      : "MapBiomas: consulta automática não realizada.";
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

  const [activeView, setActiveView] = useState<"landing" | "app" | "portal" | "contratos">("landing");
  const [contractIdToPublish, setContractIdToPublish] = useState("2026-C001");
  const [isPublishingR2, setIsPublishingR2] = useState(false);
  const [lastPublishedR2Key, setLastPublishedR2Key] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (
        host.startsWith("contratos.") ||
        search.includes("view=contratos") ||
        hash.includes("contratos")
      ) {
        setActiveView("contratos");
      } else if (
        host.startsWith("portal.") ||
        host.startsWith("cliente.") ||
        search.includes("view=portal") ||
        hash.includes("portal")
      ) {
        setActiveView("portal");
      } else if (
        host.startsWith("app.") ||
        host.startsWith("faf.") ||
        search.includes("view=app") ||
        hash.includes("app")
      ) {
        setActiveView("app");
      }
    }
  }, []);

  const publishToCloudflareR2 = async () => {
    if (!geometry || !normalizedId) return;
    setIsPublishingR2(true);
    try {
      const geojsonContent = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
      const activeUser = userMgmt.loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;

      const res = await fetch("/api/r2/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: normalizedId,
          contractId: contractIdToPublish || "2026-C001",
          producer: form.producer || "N/A",
          supplier: form.supplier || form.producer || "N/A",
          farm: form.farm || "N/A",
          region: form.region || "GERAL",
          municipality: form.municipality || "N/A",
          state: form.state || "N/A",
          area,
          compliance: form.compliance || "CONFORME",
          publishedBy: activeName,
          geojsonContent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLastPublishedR2Key(data.key);
        recordAuditLog(
          activeUser,
          activeName,
          "PACKAGE_EXPORTED",
          "EXPORTACAO",
          `Publicou o GeoJSON do talhão ${normalizedId} no Cloudflare R2 em ${data.key}.`,
          normalizedId
        );
        alert(`✅ Arquivo GeoJSON enviado com sucesso para o Cloudflare R2!\n\nCaminho: ${data.key}`);
      } else {
        throw new Error(data.error || "Erro ao publicar GeoJSON no Cloudflare R2.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao publicar no R2.";
      alert(`⚠️ Falha no envio do GeoJSON: ${msg}`);
    } finally {
      setIsPublishingR2(false);
    }
  };

  const handleDownloadR2GeoJsonDirect = async (key: string) => {
    try {
      const res = await fetch(`/api/r2/download?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = `${normalizedId}.geojson`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(data.error || "Não foi possível obter a URL do R2.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao baixar.";
      alert(`⚠️ ${msg}`);
    }
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
      ? `MapBiomas (2020–2024): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.`
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
    setMapbiomasConfirmed(false);
    setMapbiomasCheck(emptyMapbiomasCheck);
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
    setMapbiomasConfirmed(false);
    setMapbiomasCheck(emptyMapbiomasCheck);
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

  useEffect(() => {
    if (userMgmt.loggedUserRole === "client" && activeView !== "portal") {
      setActiveView("portal");
    }
  }, [userMgmt.loggedUserRole, activeView]);

  if (userMgmt.isAuthenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600 }}>Carregando sistema...</p>
      </div>
    );
  }

  if (activeView === "contratos") {
    if (userMgmt.isAuthenticated === false) {
      return (
        <LoginScreen
          loginUsername={userMgmt.loginUsername}
          setLoginUsername={userMgmt.setLoginUsername}
          loginPassword={userMgmt.loginPassword}
          setLoginPassword={userMgmt.setLoginPassword}
          loginError={userMgmt.loginError}
          onLogin={userMgmt.handleLogin}
          onBackToLanding={() => setActiveView("landing")}
        />
      );
    }
    return (
      <ContractManagerView
        onOpenLanding={() => setActiveView("landing")}
        loggedUserKey={userMgmt.loggedUserKey}
      />
    );
  }

  if (activeView === "portal") {
    if (userMgmt.isAuthenticated === false) {
      return (
        <LoginScreen
          loginUsername={userMgmt.loginUsername}
          setLoginUsername={userMgmt.setLoginUsername}
          loginPassword={userMgmt.loginPassword}
          setLoginPassword={userMgmt.setLoginPassword}
          loginError={userMgmt.loginError}
          title="Client & Importer Portal"
          eyebrow="FAF Coffees • EUDR R2 Storage"
          subtitle="Enter your authorized credentials to access your lots and download verified EUDR GeoJSON files."
          buttonText="Enter Client Portal ➔"
          userLabel="Username"
          passLabel="Password"
          userPlaceholder="Enter your username"
          passPlaceholder="Enter your password"
          backText="← Back to Home"
          onLogin={async (e) => {
            if (e && typeof e.preventDefault === "function") e.preventDefault();
            const success = await userMgmt.handleLogin(e);
            if (success) {
              setActiveView("portal");
            }
          }}
          onBackToLanding={() => setActiveView("landing")}
        />
      );
    }

    const currentFullName = userMgmt.loggedUserName || (userMgmt.loggedUserKey ? userMgmt.usersMap[userMgmt.loggedUserKey]?.fullName : "") || userMgmt.loggedUserKey;

    return (
      <ClientPortalModal
        isOpen={true}
        onClose={() => setActiveView("landing")}
        userName={currentFullName}
        loggedUserRole={userMgmt.loggedUserRole}
        loggedClientName={userMgmt.loggedClientName}
        onLogout={userMgmt.handleLogout}
      />
    );
  }

  if (activeView === "landing") {
    return (
      <LandingPage
        onOpenFafApp={() => setActiveView("app")}
        onOpenClientPortal={() => setActiveView("portal")}
      />
    );
  }

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
        onLogin={async (e) => {
          if (e && typeof e.preventDefault === "function") e.preventDefault();
          const success = await userMgmt.handleLogin(e);
          if (success) {
            const role = sessionStorage.getItem("faf_eudr_user_role");
            if (role === "client") {
              setActiveView("portal");
            } else {
              setActiveView("app");
            }
          }
        }}
        onBackToLanding={() => setActiveView("landing")}
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
        onOpenClientPortal={() => setActiveView("portal")}
        onOpenLanding={() => setActiveView("landing")}
      />

      <section className="dashboard-head">
        <div className="hero-copy">
          <p className="section-kicker">Novo processo</p>
          <h2>Prepare um talhão para EUDR</h2>
          <p>Identifique a área, importe a geometria e valide a cobertura e conformidade no MapBiomas antes de gerar o pacote final.</p>
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
            <label
              className={`dropzone ${geometry ? "loaded" : ""} ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? "2px dashed #0284c7" : geometry ? "2px solid #166534" : "2px dashed var(--line-strong)",
                background: isDragging ? "#e0f2fe" : geometry ? "#f0fdf4" : "var(--canvas)",
                padding: "26px 20px",
                borderRadius: "14px",
                textAlign: "center",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease-in-out",
                boxShadow: isDragging ? "0 8px 25px rgba(2, 132, 199, 0.22)" : "none",
              }}
            >
              <input type="file" accept=".kml,.geojson,.json" onChange={handleFile} style={{ display: "none" }} />
              <span className="upload-icon" style={{ fontSize: "28px", transform: isDragging ? "scale(1.2)" : "scale(1)", transition: "transform 0.2s" }}>
                {isDragging ? "📥" : geometry ? "✅" : "↥"}
              </span>
              <strong style={{ fontSize: "14px", color: isDragging ? "#0369a1" : "var(--forest-950)" }}>
                {isDragging
                  ? "Solte o arquivo KML ou GeoJSON aqui..."
                  : fileName
                  ? `Arquivo: ${fileName}`
                  : "Arraste e solte o arquivo KML/GeoJSON aqui ou clique para selecionar"}
              </strong>
              <small style={{ color: isDragging ? "#0284c7" : "var(--muted)", fontSize: "12px" }}>
                {isDragging
                  ? "Suporta arquivos .kml, .geojson e .json"
                  : geometry
                  ? "Arquivo validado. Arraste outro arquivo ou clique para substituir."
                  : "Formatos aceitos: .kml, .geojson ou .json"}
              </small>
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
                <p>Verificação de desmatamento e uso do solo no MapBiomas Brasil (2020–2024).</p>
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
                <strong>MapBiomas Brasil · Série Temporal de Cobertura e Uso (2020–2024)</strong>
                <p>O polígono é analisado para verificar se houve supressão de vegetação nativa ou alteração de uso da terra após o marco temporal de 31/12/2020 (EUDR).</p>
                {!mapbiomasReady && <small className="mapbiomas-prerequisite">Preencha código do talhão, fornecedor, município, estado e responsável pelo mapeamento.</small>}
              </div>
              <button
                className="secondary-button"
                disabled={!mapbiomasReady || mapbiomasCheck.status === "loading"}
                onClick={checkMapbiomas}
              >
                {mapbiomasCheck.status === "loading"
                  ? "Consultando…"
                  : mapbiomasCheck.checkedAt
                    ? "Consultar novamente"
                    : "Consultar MapBiomas"}
              </button>
            </div>
            {mapbiomasCheck.status !== "idle" && mapbiomasCheck.status !== "loading" && (
              <div className={`mapbiomas-result ${mapbiomasCheck.status}`}>
                {mapbiomasCheck.status === "clear" && (
                  <>
                    <strong>✓ Sem perda de vegetação nativa detectada (2020–2024)</strong>
                    <p>A área mantém-se em conformidade com o marco temporal EUDR, sem desmatamento ou supressão de floresta nativa.</p>
                  </>
                )}
                {mapbiomasCheck.status === "attention" && (
                  <>
                    <strong>! Alteração de cobertura vegetal detectada</strong>
                    <p>Revise a transição de classes de uso do solo no período:</p>
                    <ul className="coverage-changes">
                      {mapbiomasCheck.changes.slice(0, 8).map((change, index) => (
                        <li key={`${change.fromYear}-${change.toYear}-${change.className}-${index}`}>
                          <b>{change.fromYear}→{change.toYear}</b> · {change.className}: {change.toHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha
                        </li>
                      ))}
                      {mapbiomasCheck.changes.length > 8 && (
                        <li>Mais {mapbiomasCheck.changes.length - 8} registro(s). Consulte a análise completa no link.</li>
                      )}
                    </ul>
                  </>
                )}
                {mapbiomasCheck.status === "error" && (
                  <>
                    <strong>Não foi possível concluir a consulta</strong>
                    <p>{mapbiomasCheck.message}</p>
                  </>
                )}
                {mapbiomasCheck.verificationUrl && (
                  <a className="verification-link" href={mapbiomasCheck.verificationUrl} target="_blank" rel="noreferrer">
                    Abrir talhão na Plataforma Interativa do MapBiomas ↗
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
            <label className="check-row"><input type="checkbox" disabled={!mapbiomasCheck.checkedAt} checked={mapbiomasConfirmed} onChange={(e) => setMapbiomasConfirmed(e.target.checked)} /><span><strong>Resultado MapBiomas revisado</strong><small>{mapbiomasCheck.checkedAt ? "Confirme após interpretar a consulta automática." : "Faça a consulta automática antes de confirmar."}</small></span></label>
            {mapbiomasCheck.verificationUrl && <a className="text-link" href={mapbiomasCheck.verificationUrl} target="_blank" rel="noreferrer">Abrir talhão no MapBiomas ↗</a>}
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

            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--line-light)" }}>
              <button
                disabled={!ready || isPublishingR2}
                onClick={publishToCloudflareR2}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "1px solid #166534",
                  background: "#15803d",
                  color: "#fff",
                  cursor: ready && !isPublishingR2 ? "pointer" : "not-allowed",
                  opacity: ready && !isPublishingR2 ? 1 : 0.6,
                  marginBottom: "8px",
                }}
              >
                {isPublishingR2 ? "⏳ Enviando GeoJSON para a Nuvem..." : "🚀 Enviar GeoJSON para a Nuvem (R2)"}
              </button>

              {lastPublishedR2Key && (
                <button
                  onClick={() => handleDownloadR2GeoJsonDirect(lastPublishedR2Key)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    borderRadius: "8px",
                    border: "1px solid #0369a1",
                    background: "#075985",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  📥 Baixar GeoJSON recém-enviado do R2
                </button>
              )}
            </div>
          </article>

          <article className="side-card note-card"><strong>Privacidade</strong><p>Acesso restrito por credenciais. A consulta envia por HTTPS ao Global Forest Watch (GFW) uma cópia temporária da geometria para checagem da série temporal. Os arquivos permanecem salvos localmente.</p></article>
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
        newAdminClientName={userMgmt.newAdminClientName}
        setNewAdminClientName={userMgmt.setNewAdminClientName}
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
        editClientNameInput={userMgmt.editClientNameInput}
        setEditClientNameInput={userMgmt.setEditClientNameInput}
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
