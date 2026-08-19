import { ChangeEvent, DragEvent, useMemo } from "react";
import dynamic from "next/dynamic";
import { type GeometryData, validatePolygonTopology } from "../lib/eudr";

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
  const topology = useMemo(() => {
    return geometry ? validatePolygonTopology(geometry) : null;
  }, [geometry]);

  return (
    <article className="card">
      <div className="card-title">
        <span>02</span>
        <div>
          <h3>Geometria da área</h3>
          <p>A área em hectares e a consistência topológica são calculadas automaticamente.</p>
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
            ? topology?.valid
              ? "2px solid #166534"
              : "2px solid #dc2626"
            : "2px dashed var(--line-strong)",
          background: isDragging
            ? "#e0f2fe"
            : geometry
            ? topology?.valid
              ? "#f0fdf4"
              : "#fef2f2"
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
          {isDragging ? "📥" : geometry ? (topology?.valid ? "✅" : "⚠️") : "↥"}
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
            ? "Arquivo carregado. Clique ou arraste outro para substituir."
            : "Formatos aceitos: .kml, .geojson ou .json (WGS84 ou UTM SIRGAS 2000)"}
        </small>
      </label>

      {error && <p className="error-box">{error}</p>}

      {/* Alertas de Topologia */}
      {topology && !topology.valid && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginTop: "12px" }}>
          <strong style={{ color: "#991b1b", fontSize: "13px", display: "block", marginBottom: "4px" }}>⚠️ Problemas Topológicos Detectados:</strong>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#b91c1c" }}>
            {topology.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {topology && topology.warnings.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", marginTop: "12px" }}>
          <strong style={{ color: "#92400e", fontSize: "13px", display: "block", marginBottom: "4px" }}>ℹ️ Avisos de Conformidade da Geometria:</strong>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#b45309" }}>
            {topology.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

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
              <span>Polígonos / Furos</span>
              <strong>
                {geometry.polygons.length} pol. ({topology?.stats.totalVertices || 0} vértices)
              </strong>
            </div>
            <div>
              <span>Sistema de Coordenadas</span>
              <strong>WGS 84 (EPSG:4326)</strong>
            </div>
            <p style={{ color: topology?.valid ? "#166534" : "#991b1b" }}>
              {topology?.valid ? "✓ Geometria fechada e validada para submissão EUDR." : "⚠️ Ajuste os erros topológicos antes de submeter."}
            </p>
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
