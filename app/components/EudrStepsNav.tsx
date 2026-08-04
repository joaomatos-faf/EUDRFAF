"use client";

import React from "react";

interface EudrStepsNavProps {
  geometryLoaded: boolean;
  mapbiomasChecked?: boolean;
  gfwChecked?: boolean;
}

export function EudrStepsNav({ geometryLoaded, mapbiomasChecked, gfwChecked }: EudrStepsNavProps) {
  const isChecked = Boolean(mapbiomasChecked ?? gfwChecked);

  return (
    <nav className="steps" aria-label="Etapas do processo">
      <div className="step active">
        <i>1</i>
        <b>Identificação</b>
        <small>Dados do fornecedor</small>
      </div>
      <div className={`step ${geometryLoaded ? "active" : ""}`}>
        <i>2</i>
        <b>Geometria</b>
        <small>{geometryLoaded ? "Carregada" : "Pendente"}</small>
      </div>
      <div className={`step ${isChecked ? "active" : ""}`}>
        <i>3</i>
        <b>Conformidade</b>
        <small>{isChecked ? "Consultada" : "Pendente"}</small>
      </div>
      <div className={`step ${isChecked ? "active" : ""}`}>
        <i>4</i>
        <b>Exportação</b>
        <small>{isChecked ? "Pronto" : "Pendente"}</small>
      </div>
    </nav>
  );
}
