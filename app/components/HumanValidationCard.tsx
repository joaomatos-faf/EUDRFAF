"use client";

import type { MapbiomasCheck } from "../lib/types";

type Props = {
  carConfirmed: boolean;
  onCarConfirmedChange: (checked: boolean) => void;
  mapbiomasConfirmed: boolean;
  onMapbiomasConfirmedChange: (checked: boolean) => void;
  mapbiomasCheck: MapbiomasCheck;
};

export function HumanValidationCard({
  carConfirmed,
  onCarConfirmedChange,
  mapbiomasConfirmed,
  onMapbiomasConfirmedChange,
  mapbiomasCheck,
}: Props) {
  return (
    <article className="side-card checklist-card">
      <p className="section-kicker">Controles obrigatórios</p>
      <h3>Validação humana</h3>

      <label className="check-row">
        <input
          type="checkbox"
          checked={carConfirmed}
          onChange={(e) => onCarConfirmedChange(e.target.checked)}
        />
        <span>
          <strong>CAR conferido</strong>
          <small>Registro localizado e KML correto.</small>
        </span>
      </label>
      <a
        className="text-link"
        href="https://www.registrorural.com.br/"
        target="_blank"
        rel="noreferrer"
      >
        Abrir Registro Rural ↗
      </a>

      <label className="check-row">
        <input
          type="checkbox"
          disabled={!mapbiomasCheck.checkedAt}
          checked={mapbiomasConfirmed}
          onChange={(e) => onMapbiomasConfirmedChange(e.target.checked)}
        />
        <span>
          <strong>Resultado MapBiomas revisado</strong>
          <small>
            {mapbiomasCheck.checkedAt
              ? "Confirme após interpretar a consulta automática."
              : "Faça a consulta automática antes de confirmar."}
          </small>
        </span>
      </label>
      {(mapbiomasCheck.verificationUrl || mapbiomasCheck.mapbiomasUrl) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
          <a
            className="text-link"
            href={mapbiomasCheck.mapbiomasUrl || (mapbiomasCheck.verificationUrl.includes("mapbiomas") ? mapbiomasCheck.verificationUrl : "https://plataforma.brasil.mapbiomas.org/?theme=coverage_lclu")}
            target="_blank"
            rel="noreferrer"
          >
            🇧🇷 Abrir no MapBiomas Brasil ↗
          </a>
          <a
            className="text-link"
            href={mapbiomasCheck.gfwUrl || (mapbiomasCheck.verificationUrl.includes("globalforestwatch") ? mapbiomasCheck.verificationUrl : "https://www.globalforestwatch.org/map/")}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent, #0284c7)" }}
          >
            🌍 Abrir no Global Forest Watch ↗
          </a>
        </div>
      )}
    </article>
  );
}
