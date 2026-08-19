"use client";

import { ChangeEvent, DragEvent } from "react";
import dynamic from "next/dynamic";
import type { GeometryData } from "../lib/eudr";

const MapPreviewComponent = dynamic(() => import("../MapPreviewComponent"), {
  ssr: false,
  loading: () => (
    <div style={{ width: 560, height: 320, background: "#f3f6ee", borderRadius: 8 }} />
  ),
});

type Props = {
  geometry: GeometryData | null;
  fileName: string;
  error: string;
  area: number;
  centerCoord: { lng: number; lat: number } | null;
  isDragging: boolean;
  onFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: (event: DragEvent<HTMLLabelElement>) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
};

export function GeometryImporter({
  geometry,
  fileName,
  error,
  area,
  centerCoord,
  isDragging,
  onFileSelected,
  onDragOver,
  onDragLeave,
  onDrop,
}: Props) {
  return (
    <article className="card">
      <div className="card-title">
        <span>02</span>
        <div>
          <h3>Geometria da área</h3>
          <p>A área em hectares é calculada automaticamente.</p>
        </div>
      </div>

      <label
        className={`dropzone ${geometry ? "loaded" : ""} ${isDragging ? "dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: isDragging
            ? "2px dashed #0284c7"
            : geometry
            ? "2px solid #166534"
            : "2px dashed var(--line-strong)",
          background: isDragging
            ? "#e0f2fe"
            : geometry
            ? "#f0fdf4"
            : "var(--canvas)",
          padding: "26px 20px",
          borderRadius: "14px",
          textAlign: "center",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s ease-in-out",
          boxShadow: isDragging ? "0 8px 25px rgba(2, 132, 199, 0.22)" : "none",
        }}
      >
        <input
          type="file"
          accept=".kml,.geojson,.json"
          onChange={onFileSelected}
          style={{ display: "none" }}
        />
        <span
          className="upload-icon"
          style={{
            fontSize: "28px",
            transform: isDragging ? "scale(1.2)" : "scale(1)",
            transition: "transform 0.2s",
          }}
        >
          {isDragging ? "📥" : geometry ? "✅" : "↥"}
        </span>
        <strong
          style={{
            fontSize: "14px",
            color: isDragging ? "#0369a1" : "var(--forest-950)",
          }}
        >
          {isDragging
            ? "Solte o arquivo KML ou GeoJSON aqui..."
            : fileName
            ? `Arquivo: ${fileName}`
            : "Arraste e solte o arquivo KML/GeoJSON aqui ou clique para selecionar"}
        </strong>
        <small
          style={{
            color: isDragging ? "#0284c7" : "var(--muted)",
            fontSize: "12px",
          }}
        >
          {isDragging
            ? "Suporta arquivos .kml, .geojson e .json"
            : geometry
            ? "Arquivo validado. Arraste outro arquivo ou clique para substituir."
            : "Formatos aceitos: .kml, .geojson ou .json"}
        </small>
      </label>

      {error && <p className="error-box">{error}</p>}

      {geometry && (
        <div className="geometry-result">
          <MapPreviewComponent geometry={geometry} />
          <div className="metrics">
            <div>
              <span>Área calculada</span>
              <strong>
                {area.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ha
              </strong>
            </div>
            <div>
              <span>Polígonos</span>
              <strong>{geometry.polygons.length}</strong>
            </div>
            <div>
              <span>Sistema</span>
              <strong>WGS 84</strong>
            </div>
            <p>✓ Geometria fechada e pronta para exportação.</p>
            {centerCoord && (
              <a
                className="text-link"
                style={{ marginTop: "8px", display: "inline-block" }}
                href={`https://www.google.com/maps/search/?api=1&query=${centerCoord.lat},${centerCoord.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Visualizar no Google Maps ↗
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
