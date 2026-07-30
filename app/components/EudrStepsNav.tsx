"use client";

import React from "react";

interface EudrStepsNavProps {
  geometryLoaded: boolean;
  gfwChecked: boolean;
}

export function EudrStepsNav({ geometryLoaded, gfwChecked }: EudrStepsNavProps) {
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
      <div className={`step ${gfwChecked ? "active" : ""}`}>
        <i>3</i>
        <b>Conformidade</b>
        <small>{gfwChecked ? "Consultada" : "Pendente"}</small>
      </div>
      <div className={`step ${gfwChecked ? "active" : ""}`}>
        <i>4</i>
        <b>Exportação</b>
        <small>{gfwChecked ? "Pronto" : "Pendente"}</small>
      </div>
    </nav>
  );
}
