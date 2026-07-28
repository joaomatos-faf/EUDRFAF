"use client";

import React from "react";

interface EudrStepsNavProps {
  geometryLoaded: boolean;
  mapbiomasChecked: boolean;
}

export function EudrStepsNav({ geometryLoaded, mapbiomasChecked }: EudrStepsNavProps) {
  return (
    <nav className="steps">
      <div className="step done">
        <strong>1. Identificação</strong>
        <span>Dados do fornecedor</span>
      </div>
      <div className={`step ${geometryLoaded ? "done" : ""}`}>
        <strong>2. Geometria</strong>
        <span>{geometryLoaded ? "Carregada" : "Pendente"}</span>
      </div>
      <div className={`step ${mapbiomasChecked ? "done" : ""}`}>
        <strong>3. Conformidade</strong>
        <span>{mapbiomasChecked ? "Consultada" : "Pendente"}</span>
      </div>
      <div className={`step ${mapbiomasChecked ? "done" : ""}`}>
        <strong>4. Exportação</strong>
        <span>{mapbiomasChecked ? "Pronto" : "Pendente"}</span>
      </div>
    </nav>
  );
}
