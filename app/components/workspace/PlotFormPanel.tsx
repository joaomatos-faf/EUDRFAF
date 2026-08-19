"use client";

import React, { ChangeEvent } from "react";
import { FormState, Municipality } from "@/app/hooks/useEudrForm";
import { GeometryData } from "@/app/lib/eudr";

interface PlotFormPanelProps {
  form: FormState;
  onUpdate: (field: keyof FormState, value: string) => void;
  onUpdateMunicipality: (value: string) => void;
  onSelectMunicipalityState: (stateCode: string) => void;
  municipalitySuggestions: Municipality[];
  exactMunicipalities: Municipality[];
  locationsStatus: "loading" | "ready" | "error";
  locationSuggestionsOpen: boolean;
  onSetLocationSuggestionsOpen: (open: boolean) => void;
  onReloadLocations: () => void;
  geometry: GeometryData | null;
  fileName: string;
  error: string;
  isDragging: boolean;
  onSetIsDragging: (dragging: boolean) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onOpenDueDiligence: () => void;
}

export function PlotFormPanel({
  form,
  onUpdate,
  onUpdateMunicipality,
  onSelectMunicipalityState,
  municipalitySuggestions,
  exactMunicipalities,
  locationsStatus,
  locationSuggestionsOpen,
  onSetLocationSuggestionsOpen,
  onReloadLocations,
  geometry,
  fileName,
  error,
  isDragging,
  onSetIsDragging,
  onFileChange,
  onDrop,
  onOpenDueDiligence,
}: PlotFormPanelProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "18px",
        padding: "24px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* File Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onSetIsDragging(true);
        }}
        onDragLeave={() => onSetIsDragging(false)}
        onDrop={onDrop}
        style={{
          border: isDragging ? "2px dashed var(--brand-crimson)" : "1.5px dashed var(--border-strong)",
          borderRadius: "14px",
          padding: "20px",
          textAlign: "center",
          background: isDragging ? "var(--bg-subtle)" : "var(--bg-canvas)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <input
          type="file"
          id="plot-file-input"
          accept=".geojson,.json,.kml,.kmz,.zip"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
        <label htmlFor="plot-file-input" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "24px" }}>📂</span>
          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>
            {fileName ? fileName : "Carregar KML, KMZ, GeoJSON ou Shapefile (.zip)"}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {geometry ? "✓ Geometria carregada e validada WGS84" : "Arraste o arquivo ou clique para selecionar"}
          </span>
        </label>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(220, 38, 38, 0.1)",
            border: "1px solid #dc2626",
            color: "#dc2626",
            fontSize: "12.5px",
            fontWeight: 600,
          }}
        >
          ✕ {error}
        </div>
      )}

      {/* Form Fields Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {/* Plot ID */}
        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--text-secondary)" }}>
            CÓDIGO DO TALHÃO (FAF ID)
          </label>
          <input
            type="text"
            value={form.plotId}
            onChange={(e) => onUpdate("plotId", e.target.value.toUpperCase())}
            placeholder="ex: FAFDRAD-01"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-canvas)",
              color: "var(--text-primary)",
              fontWeight: 700,
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Supplier / Producer */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--text-secondary)" }}>
            FORNECEDOR *
          </label>
          <input
            type="text"
            value={form.supplier}
            onChange={(e) => onUpdate("supplier", e.target.value)}
            placeholder="ex: Denner Rodrigo"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-canvas)",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--text-secondary)" }}>
            PRODUTOR / FAZENDA
          </label>
          <input
            type="text"
            value={form.producer || form.farm}
            onChange={(e) => {
              onUpdate("producer", e.target.value);
              onUpdate("farm", e.target.value);
            }}
            placeholder="ex: Sítio Água Limpa"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-canvas)",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
          />
        </div>

        {/* Municipality / State Autocomplete */}
        <div style={{ position: "relative" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--text-secondary)" }}>
            MUNICÍPIO (IBGE) *
          </label>
          <input
            type="text"
            value={form.municipality}
            onFocus={() => onSetLocationSuggestionsOpen(true)}
            onChange={(e) => {
              onUpdateMunicipality(e.target.value);
              onSetLocationSuggestionsOpen(true);
            }}
            placeholder="ex: Caconde"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-canvas)",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
          />

          {locationSuggestionsOpen && municipalitySuggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 9999,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: "8px",
                maxHeight: "180px",
                overflowY: "auto",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {municipalitySuggestions.map((muni) => (
                <div
                  key={`${muni.id}_${muni.stateCode}`}
                  onClick={() => {
                    onUpdateMunicipality(muni.name);
                    onSelectMunicipalityState(muni.stateCode);
                    onSetLocationSuggestionsOpen(false);
                  }}
                  style={{
                    padding: "8px 12px",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-hairline)",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{muni.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{muni.stateCode}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--text-secondary)" }}>
            ESTADO / REGIÃO
          </label>
          <input
            type="text"
            value={form.state ? `${form.state} (${form.region || "BR"})` : ""}
            readOnly
            placeholder="Automático pelo IBGE"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}
          />
        </div>

        {/* CAR */}
        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--text-secondary)" }}>
            CADASTRO AMBIENTAL RURAL (CAR)
          </label>
          <input
            type="text"
            value={form.car}
            onChange={(e) => onUpdate("car", e.target.value.toUpperCase())}
            placeholder="ex: SP-3509700-0000000000000000000000000000"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-canvas)",
              color: "var(--text-primary)",
              fontFamily: "monospace",
              fontSize: "12.5px",
            }}
          />
        </div>
      </div>

      {/* Due Diligence Button */}
      {geometry && (
        <button
          type="button"
          onClick={onOpenDueDiligence}
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-strong)",
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.15s ease",
          }}
        >
          📄 Visualizar Dossiê de Due Diligence (PDF)
        </button>
      )}
    </div>
  );
}
