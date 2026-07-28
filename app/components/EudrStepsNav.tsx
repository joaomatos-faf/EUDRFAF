"use client";

import React from "react";

interface EudrStepsNavProps {
  geometryLoaded: boolean;
  mapbiomasChecked: boolean;
}

export function EudrStepsNav({ geometryLoaded, mapbiomasChecked }: EudrStepsNavProps) {
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
      <div className={`step ${mapbiomasChecked ? "active" : ""}`}>
        <i>3</i>
        <b>Conformidade</b>
        <small>{mapbiomasChecked ? "Consultada" : "Pendente"}</small>
      </div>
      <div className={`step ${mapbiomasChecked ? "active" : ""}`}>
        <i>4</i>
        <b>Exportação</b>
        <small>{mapbiomasChecked ? "Pronto" : "Pendente"}</small>
      </div>
    </nav>
  );
}
