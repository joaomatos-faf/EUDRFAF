"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  GeometryData,
  calculateAreaHectares,
  generateAutoPlotId,
  incrementPlotIdNumber,
  parseGeometryFile,
  sanitizePlotId,
} from "../lib/eudr";
import { recordAuditLog } from "../lib/auditLogger";

export type FormState = {
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

export type Municipality = {
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

const today = new Date().toISOString().slice(0, 10);

export const initialForm: FormState = {
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

export const shapefileDetailFields = new Set<keyof FormState>([
  "plotId",
  "farm",
  "producer",
  "supplier",
  "region",
  "municipality",
  "state",
  "mappedAt",
  "checkedAt",
  "compliance",
  "notes",
  "mappedBy",
  "car",
]);

export function normalizedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function useEudrForm(loggedUserKey: string, onResetMapbiomas?: () => void) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [locationsStatus, setLocationsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [locationsReload, setLocationsReload] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);

  useEffect(() => {
    let active = true;
    setLocationsStatus("loading");
    const loadMunicipalities = async () => {
      try {
        const response = await fetch("/api/locations/municipalities");
        const result = (await response.json()) as { municipalities?: Municipality[]; error?: string };
        if (!response.ok || !result.municipalities?.length) throw new Error(result.error);
        return result.municipalities;
      } catch {
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome"
        );
        if (!response.ok) throw new Error("IBGE indisponível");
        const data = (await response.json()) as IbgeMunicipality[];
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
    return () => {
      active = false;
    };
  }, [locationsReload]);

  const area = useMemo(() => (geometry ? calculateAreaHectares(geometry) : 0), [geometry]);

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
    if (shapefileDetailFields.has(field)) {
      onResetMapbiomas?.();
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
    onResetMapbiomas?.();
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
    onResetMapbiomas?.();
  };

  const applyGeometry = (parsed: GeometryData, sourceFileName: string) => {
    setGeometry(parsed);
    setFileName(sourceFileName);
    setError("");
    onResetMapbiomas?.();

    const activeUser = loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "GEOMETRY_LOADED",
      "GEOMETRIA",
      `Carregou geometria do arquivo "${sourceFileName}" (${calculateAreaHectares(parsed).toFixed(2)} ha).`
    );
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const parsed = await parseGeometryFile(file);
      applyGeometry(parsed, file.name);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : "Falha ao processar arquivo";
      setError(message);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setError("");
    try {
      const parsed = await parseGeometryFile(file);
      applyGeometry(parsed, file.name);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : "Falha ao processar arquivo";
      setError(message);
    }
  };

  const handleStartFromScratch = () => {
    const activeUser = loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(activeUser, activeName, "PROCESS_RESET", "GEOMETRIA", `Iniciou um novo processo do zero (limpeza total).`);

    setForm({
      ...initialForm,
      mappedBy: form.mappedBy || loggedUserKey || (typeof window !== "undefined" ? sessionStorage.getItem("faf_eudr_user_name") || "" : ""),
      mappedAt: today,
      checkedAt: today,
    });
    setGeometry(null);
    setFileName("");
    setError("");
    onResetMapbiomas?.();
  };

  const handleNextPlotSameSupplier = () => {
    const newPlotId = incrementPlotIdNumber(normalizedId || form.plotId);
    const activeUser = loggedUserKey || "usuario";
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
    onResetMapbiomas?.();
  };

  const handleNewProcessClick = () => {
    const hasData = Boolean(
      form.plotId || form.farm || form.producer || form.supplier || form.car || form.municipality || geometry
    );
    if (hasData) {
      setShowNewProcessModal(true);
    } else {
      handleStartFromScratch();
    }
  };

  const nextPlotIdPreview = useMemo(() => {
    return incrementPlotIdNumber(normalizedId || form.plotId || "FAFDRAD-01");
  }, [normalizedId, form.plotId]);

  return {
    form,
    setForm,
    geometry,
    setGeometry,
    fileName,
    error,
    setError,
    area,
    centerCoord,
    normalizedId,
    municipalities,
    locationsStatus,
    locationSuggestionsOpen,
    setLocationSuggestionsOpen,
    setLocationsReload,
    exactMunicipalities,
    municipalitySuggestions,
    isDragging,
    setIsDragging,
    showNewProcessModal,
    setShowNewProcessModal,
    nextPlotIdPreview,
    update,
    updateMunicipality,
    selectMunicipalityState,
    applyGeometry,
    handleFileChange,
    handleDrop,
    handleStartFromScratch,
    handleNextPlotSameSupplier,
    handleNewProcessClick,
  };
}
