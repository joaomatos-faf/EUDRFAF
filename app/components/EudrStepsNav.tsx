"use client";

import React from "react";
import { useTranslation } from "@/app/hooks/useTranslation";

interface EudrStepsNavProps {
  geometryLoaded: boolean;
  mapbiomasChecked?: boolean;
  gfwChecked?: boolean;
}

export function EudrStepsNav({ geometryLoaded, mapbiomasChecked, gfwChecked }: EudrStepsNavProps) {
  const { locale, t } = useTranslation();
  const isChecked = Boolean(mapbiomasChecked ?? gfwChecked);

  return (
    <nav className="steps" aria-label="Etapas do processo">
      <div className="step active">
        <i>1</i>
        <b>{locale === "en" ? "Identification" : "Identificação"}</b>
        <small>{locale === "en" ? "Farm & supplier details" : "Dados do fornecedor"}</small>
      </div>
      <div className={`step ${geometryLoaded ? "active" : ""}`}>
        <i>2</i>
        <b>{locale === "en" ? "Geometry" : "Geometria"}</b>
        <small>
          {geometryLoaded
            ? locale === "en"
              ? "Loaded"
              : "Carregada"
            : locale === "en"
            ? "Pending"
            : "Pendente"}
        </small>
      </div>
      <div className={`step ${isChecked ? "active" : ""}`}>
        <i>3</i>
        <b>{locale === "en" ? "Compliance" : "Conformidade"}</b>
        <small>
          {isChecked
            ? locale === "en"
              ? "Audited"
              : "Consultada"
            : locale === "en"
            ? "Pending"
            : "Pendente"}
        </small>
      </div>
      <div className={`step ${isChecked ? "active" : ""}`}>
        <i>4</i>
        <b>{locale === "en" ? "Export" : "Exportação"}</b>
        <small>
          {isChecked
            ? locale === "en"
              ? "Ready"
              : "Pronto"
            : locale === "en"
            ? "Pending"
            : "Pendente"}
        </small>
      </div>
    </nav>
  );
}
