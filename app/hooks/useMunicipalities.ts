import { useState, useEffect, useMemo, useCallback } from "react";
import type { FormState, Municipality, IbgeMunicipality } from "../lib/types";
import { normalizedText, EMPTY_MAPBIOMAS_CHECK } from "../lib/types";

/**
 * Hook para carregar municípios do IBGE e gerenciar autocomplete.
 */
export function useMunicipalities(
  form: FormState,
  setForm: React.Dispatch<React.SetStateAction<FormState>>,
  computeNextPlotId: (currentForm: FormState, updatedField: keyof FormState, newValue: string) => string,
  resetMapbiomas: () => void,
) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [locationsStatus, setLocationsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [locationsReload, setLocationsReload] = useState(0);

  // Carrega municípios da API local ou IBGE
  useEffect(() => {
    let active = true;
    setLocationsStatus("loading");

    const loadMunicipalities = async (): Promise<Municipality[]> => {
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

  // Busca exata por nome de município
  const exactMunicipalities = useMemo(() => {
    const query = normalizedText(form.municipality);
    if (!query) return [];
    return municipalities.filter((m) => normalizedText(m.name) === query);
  }, [form.municipality, municipalities]);

  // Sugestões para autocomplete
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

  // Auto-preenche estado/região quando há match exato único
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
  }, [exactMunicipalities, locationsStatus, setForm]);

  const retryLocations = useCallback(() => {
    setLocationsReload((value) => value + 1);
  }, []);

  const updateMunicipality = useCallback((value: string) => {
    const query = normalizedText(value);
    const exact = municipalities.filter((m) => normalizedText(m.name) === query);
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
    resetMapbiomas();
  }, [municipalities, computeNextPlotId, resetMapbiomas, setForm]);

  const selectMunicipalityState = useCallback((stateCode: string) => {
    const selected = exactMunicipalities.find((m) => m.stateCode === stateCode);
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
    resetMapbiomas();
  }, [exactMunicipalities, computeNextPlotId, resetMapbiomas, setForm]);

  const selectMunicipality = useCallback((selected: Municipality) => {
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
    resetMapbiomas();
  }, [computeNextPlotId, resetMapbiomas, setForm]);

  return {
    municipalities,
    locationsStatus,
    locationSuggestionsOpen,
    setLocationSuggestionsOpen,
    exactMunicipalities,
    municipalitySuggestions,
    retryLocations,
    updateMunicipality,
    selectMunicipalityState,
    selectMunicipality,
  };
}
