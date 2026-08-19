"use client";

import React from "react";
import { GeometryData, MapbiomasCheckResponse } from "@/app/lib/eudr";

interface AuditActionsBarProps {
  geometry: GeometryData | null;
  area: number;
  checkingMapbiomas: boolean;
  mapbiomasCheck: MapbiomasCheckResponse | null;
  mapbiomasError: string;
  mapbiomasConfirmed: boolean;
  onSetMapbiomasConfirmed: (c: boolean) => void;
  carConfirmed: boolean;
  onSetCarConfirmed: (c: boolean) => void;
  onRunMapbiomasCheck: () => void;
  exporting: boolean;
  onDownloadFullPackage: () => void;
  onDownloadGeoJsonOnly: () => void;
  onCopySharepointRow: () => void;
  copySuccess: boolean;
  onPublishToR2: () => void;
  r2Publishing: boolean;
  r2Success: boolean;
  onNextPlotSameSupplier: () => void;
  nextPlotIdPreview: string;
}

export function AuditActionsBar({
  geometry,
  area,
  checkingMapbiomas,
  mapbiomasCheck,
  mapbiomasError,
  mapbiomasConfirmed,
  onSetMapbiomasConfirmed,
  carConfirmed,
  onSetCarConfirmed,
  onRunMapbiomasCheck,
  exporting,
  onDownloadFullPackage,
  onDownloadGeoJsonOnly,
  onCopySharepointRow,
  copySuccess,
  onPublishToR2,
  r2Publishing,
  r2Success,
  onNextPlotSameSupplier,
  nextPlotIdPreview,
}: AuditActionsBarProps) {
  if (!geometry) {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "18px",
          padding: "20px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "13.5px",
        }}
      >
        Desenhe um polígono no mapa ou carregue um arquivo para habilitar auditoria e exportação.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "18px",
        padding: "24px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Area & Geometry Summary */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Área Calculada (WGS84)
          </span>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)" }}>
            {area.toFixed(2)} <span style={{ fontSize: "14px", fontWeight: 600 }}>hectares</span>
          </div>
        </div>

        {/* MapBiomas Check Trigger */}
        <button
          type="button"
          onClick={onRunMapbiomasCheck}
          disabled={checkingMapbiomas}
          style={{
            background: checkingMapbiomas ? "var(--bg-subtle)" : "var(--brand-forest, #065f46)",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: checkingMapbiomas ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(6,95,70,0.25)",
            transition: "all 0.15s ease",
          }}
        >
          {checkingMapbiomas ? "⏳ Auditando MapBiomas..." : "🛰️ Auditar Desmatamento Zero (MapBiomas)"}
        </button>
      </div>

      {/* MapBiomas Result Alert */}
      {mapbiomasError && (
        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(220,38,38,0.1)", border: "1px solid #dc2626", color: "#dc2626", fontSize: "12.5px", fontWeight: 600 }}>
          ✕ {mapbiomasError}
        </div>
      )}

      {mapbiomasCheck && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "10px",
            background: mapbiomasCheck.hasDeforestationPost2020 ? "rgba(220,38,38,0.1)" : "rgba(16,185,129,0.1)",
            border: `1px solid ${mapbiomasCheck.hasDeforestationPost2020 ? "#dc2626" : "#10b981"}`,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, fontSize: "13.5px", color: mapbiomasCheck.hasDeforestationPost2020 ? "#dc2626" : "#065f46" }}>
              {mapbiomasCheck.hasDeforestationPost2020
                ? "⚠️ ALERTA DE DESMATAMENTO DETECTADO (PÓS-2020)"
                : "✓ ÁREA CONFORME: SEM DESMATAMENTO PÓS-31/12/2020"}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
              {mapbiomasCheck.source || "MapBiomas"}
            </span>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer", color: "var(--text-primary)" }}>
            <input
              type="checkbox"
              checked={mapbiomasConfirmed}
              onChange={(e) => onSetMapbiomasConfirmed(e.target.checked)}
            />
            Confirmo a verificação visual na plataforma MapBiomas / GFW
          </label>
        </div>
      )}

      {/* Export & Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
        <button
          type="button"
          onClick={onDownloadFullPackage}
          disabled={exporting}
          style={{
            gridColumn: "span 2",
            background: "var(--brand-crimson)",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: 800,
            cursor: exporting ? "not-allowed" : "pointer",
            boxShadow: "var(--shadow-button)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "transform 0.15s ease",
          }}
        >
          📦 {exporting ? "Gerando..." : "Baixar Pacote Completo EUDR (.zip)"}
        </button>

        <button
          type="button"
          onClick={onCopySharepointRow}
          style={{
            background: copySuccess ? "#065f46" : "var(--bg-subtle)",
            color: copySuccess ? "#ffffff" : "var(--text-primary)",
            border: "1px solid var(--border-strong)",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "12.5px",
            fontWeight: 650,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {copySuccess ? "✓ Copiado para SharePoint!" : "📋 Copiar Linha (SharePoint)"}
        </button>

        <button
          type="button"
          onClick={onPublishToR2}
          disabled={r2Publishing}
          style={{
            background: r2Success ? "#065f46" : "var(--bg-subtle)",
            color: r2Success ? "#ffffff" : "var(--text-primary)",
            border: "1px solid var(--border-strong)",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "12.5px",
            fontWeight: 650,
            cursor: r2Publishing ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {r2Success ? "✓ Publicado na Nuvem!" : r2Publishing ? "⏳ Enviando R2..." : "☁️ Publicar no R2"}
        </button>

        <button
          type="button"
          onClick={onDownloadGeoJsonOnly}
          style={{
            background: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Baixar apenas GeoJSON
        </button>

        <button
          type="button"
          onClick={onNextPlotSameSupplier}
          style={{
            background: "transparent",
            color: "var(--brand-crimson)",
            border: "1px solid var(--brand-crimson)",
            borderRadius: "10px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Próximo Talhão ({nextPlotIdPreview})
        </button>
      </div>
    </div>
  );
}
