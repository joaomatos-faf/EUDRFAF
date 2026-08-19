"use client";

import { useState } from "react";
import { GeometryData } from "../lib/eudr";
import { MapbiomasCheckResponse } from "../lib/types";
import { recordAuditLog } from "../lib/auditLogger";
import { FormState } from "./useEudrForm";

export function useMapbiomasAudit(
  form: FormState,
  geometry: GeometryData | null,
  loggedUserKey: string,
  onAutoSetCompliance?: (compliance: string, notes: string) => void
) {
  const [mapbiomasCheck, setMapbiomasCheck] = useState<MapbiomasCheckResponse | null>(null);
  const [checkingMapbiomas, setCheckingMapbiomas] = useState(false);
  const [mapbiomasError, setMapbiomasError] = useState("");
  const [mapbiomasConfirmed, setMapbiomasConfirmed] = useState(false);
  const [carConfirmed, setCarConfirmed] = useState(false);

  const resetMapbiomasAudit = () => {
    setMapbiomasCheck(null);
    setMapbiomasConfirmed(false);
    setMapbiomasError("");
  };

  const runMapbiomasCheck = async () => {
    if (!geometry) return;
    setCheckingMapbiomas(true);
    setMapbiomasError("");
    setMapbiomasCheck(null);
    setMapbiomasConfirmed(false);

    try {
      const res = await fetch("/api/mapbiomas/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geometry, municipality: form.municipality, state: form.state }),
      });
      const data: MapbiomasCheckResponse = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro na checagem MapBiomas");
      setMapbiomasCheck(data);

      const activeUser = loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "MAPBIOMAS_CHECKED",
        "AUDITORIA",
        `Executou auditoria MapBiomas para o talhão "${form.plotId}". Status: ${data.status} (Desmatamento pós-2020: ${data.hasDeforestationPost2020 ? "SIM" : "NÃO"}).`,
        form.plotId
      );

      if (onAutoSetCompliance) {
        if (data.status === "conforme") {
          onAutoSetCompliance(
            "Conforme",
            `Auditado MapBiomas Alertas: Sem alertas pós-2020 (${data.alertCount} alertas).`
          );
        } else if (data.status === "alerta") {
          onAutoSetCompliance(
            "Alerta",
            `ATENÇÃO MapBiomas: ${data.alertCount} alerta(s) de desmatamento detectado(s) pós-2020.`
          );
        }
      }
    } catch (e: any) {
      setMapbiomasError(e.message || "Erro ao consultar MapBiomas");
    } finally {
      setCheckingMapbiomas(false);
    }
  };

  return {
    mapbiomasCheck,
    setMapbiomasCheck,
    checkingMapbiomas,
    mapbiomasError,
    setMapbiomasError,
    mapbiomasConfirmed,
    setMapbiomasConfirmed,
    carConfirmed,
    setCarConfirmed,
    resetMapbiomasAudit,
    runMapbiomasCheck,
  };
}
