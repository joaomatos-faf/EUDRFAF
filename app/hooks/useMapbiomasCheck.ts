import { useState, useCallback } from "react";
import type { FormState, MapbiomasCheck } from "../lib/types";
import { EMPTY_MAPBIOMAS_CHECK, today } from "../lib/types";
import type { GeometryData } from "../lib/eudr";
import type { AuditLogEntry } from "../lib/auditLogger";

type AuditLogFn = (user: string, name: string, action: AuditLogEntry["action"], category: AuditLogEntry["category"], detail: string, plotId?: string) => void;

/**
 * Hook para gerenciar a consulta ao MapBiomas e seus resultados.
 */
export function useMapbiomasCheck(
  form: FormState,
  geometry: GeometryData | null,
  normalizedId: string,
  recordAuditLog: AuditLogFn,
  loggedUserKey: string | null,
  setForm: React.Dispatch<React.SetStateAction<FormState>>,
) {
  const [mapbiomasCheck, setMapbiomasCheck] = useState<MapbiomasCheck>(EMPTY_MAPBIOMAS_CHECK);
  const [mapbiomasConfirmed, setMapbiomasConfirmed] = useState(false);

  const mapbiomasReady = Boolean(
    geometry &&
    normalizedId &&
    form.supplier.trim() &&
    form.municipality.trim() &&
    form.state.trim() &&
    form.mappedBy.trim(),
  );

  const resetMapbiomas = useCallback(() => {
    setMapbiomasCheck(EMPTY_MAPBIOMAS_CHECK);
    setMapbiomasConfirmed(false);
  }, []);

  const checkMapbiomas = useCallback(async () => {
    if (!geometry) return;
    setMapbiomasConfirmed(false);
    setMapbiomasCheck({ ...EMPTY_MAPBIOMAS_CHECK, status: "loading" });

    try {
      const response = await fetch("/api/mapbiomas/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          geometry,
          details: { ...form, plotId: normalizedId, checkedAt: today() },
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

      setMapbiomasCheck({
        status: result.hasChanges ? "attention" : "clear",
        areaHa: result.areaHa ?? 0,
        checkedAt: result.checkedAt ?? new Date().toISOString(),
        message: "",
        verificationUrl: result.verificationUrl ?? "",
        changes: result.changes ?? [],
      });

      setForm((prev) => ({ ...prev, checkedAt: today() }));

      const activeUser = loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "MAPBIOMAS_CHECKED",
        "MAPBIOMAS",
        `Consultou MapBiomas 2020-2024 para ${normalizedId || "talhão"}: ${result.hasChanges ? `${result.changes?.length || 1} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.`,
        normalizedId || undefined,
      );
    } catch (problem) {
      setMapbiomasCheck({
        ...EMPTY_MAPBIOMAS_CHECK,
        status: "error",
        message: problem instanceof Error ? problem.message : "Não foi possível consultar o MapBiomas.",
      });
    }
  }, [geometry, form, normalizedId, recordAuditLog, loggedUserKey, setForm]);

  return {
    mapbiomasCheck,
    setMapbiomasCheck,
    mapbiomasConfirmed,
    setMapbiomasConfirmed,
    mapbiomasReady,
    resetMapbiomas,
    checkMapbiomas,
  };
}
