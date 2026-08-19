/**
 * Hook para formulário EUDR e lógica de estado
 * Centraliza gerenciamento do formulário, validações e atualizações
 */

import { useState, useMemo, useCallback } from "react";
import type { FormState, MapbiomasCheck, Municipality } from "../lib/constants";
import { initialForm, emptyMapbiomasCheck, shapefileDetailFields, normalizedText } from "../lib/constants";
import { sanitizePlotId, generateAutoPlotId, calculateAreaHectares } from "../lib/eudr";
import type { GeometryData } from "../lib/eudr";

interface UseEudrFormReturn {
  form: FormState;
  area: number;
  normalizedId: string;
  exactMunicipalities: Municipality[];
  municipalitySuggestions: Municipality[];
  mapbiomasReady: boolean;
  ready: boolean;
  update: (field: keyof FormState, value: string) => void;
  updateMunicipality: (value: string) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}

interface UseEudrFormParams {
  geometry: GeometryData | null;
  carConfirmed: boolean;
  mapbiomasConfirmed: boolean;
  mapbiomasCheck: MapbiomasCheck;
  municipalities: Municipality[];
  locationsStatus: "loading" | "ready" | "error";
}

export function useEudrForm({ geometry, carConfirmed, mapbiomasConfirmed, mapbiomasCheck, municipalities, locationsStatus }: UseEudrFormParams): UseEudrFormReturn {
  const [form, setForm] = useState<FormState>(initialForm);

  const area = useMemo(
    () => (geometry ? calculateAreaHectares(geometry) : 0),
    [geometry],
  );

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

  const computeNextPlotId = useCallback((currentForm: FormState, updatedField: keyof FormState, newValue: string) => {
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
  }, []);

  const update = useCallback((field: keyof FormState, value: string) => {
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
      // Nota: o caller deve invalidar mapbiomasCheck quando necessário
    }
  }, [computeNextPlotId, mapbiomasCheck.checkedAt]);

  const updateMunicipality = useCallback((value: string) => {
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
  }, [municipalities, computeNextPlotId]);

  return {
    form,
    area,
    normalizedId,
    exactMunicipalities,
    municipalitySuggestions,
    mapbiomasReady,
    ready,
    update,
    updateMunicipality,
    setForm,
  };
}
