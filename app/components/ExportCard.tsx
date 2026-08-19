"use client";

type Props = {
  normalizedId: string;
  geometryLoaded: boolean;
  ready: boolean;
  isPublishingR2: boolean;
  lastPublishedR2Key: string | null;
  onExportAll: () => void;
  onDownloadGeoJson: () => void;
  onDownloadShape: () => void;
  onDownloadXlsx: () => void;
  onPublishR2: () => void;
  onDownloadR2GeoJson: (key: string) => void;
  onOpenDueDiligence?: () => void;
};

export function ExportCard({
  normalizedId,
  geometryLoaded,
  ready,
  isPublishingR2,
  lastPublishedR2Key,
  onExportAll,
  onDownloadGeoJson,
  onDownloadShape,
  onDownloadXlsx,
  onPublishR2,
  onDownloadR2GeoJson,
  onOpenDueDiligence,
}: Props) {
  return (
    <article className="side-card export-card">
      <p className="section-kicker">Pacote final</p>
      <h3>{normalizedId || "Código pendente"}</h3>
      <ul>
        <li>
          <span>GeoJSON EUDR</span>
          <b>{geometryLoaded && normalizedId ? "Pronto" : "Pendente"}</b>
        </li>
        <li>
          <span>Shapefile (.zip)</span>
          <b>{geometryLoaded && normalizedId ? "Pronto" : "Pendente"}</b>
        </li>
        <li>
          <span>Linha da planilha</span>
          <b>{normalizedId ? "Pronta" : "Pendente"}</b>
        </li>
      </ul>

      <button className="primary-button" disabled={!ready} onClick={onExportAll}>
        Baixar pacote EUDR
      </button>
      {!ready && (
        <p className="hint">
          Preencha os campos com * e confirme os dois controles.
        </p>
      )}

      <div className="individual-actions">
        <button
          disabled={!geometryLoaded || !normalizedId}
          onClick={onDownloadGeoJson}
        >
          GeoJSON
        </button>
        <button
          disabled={!geometryLoaded || !normalizedId}
          onClick={onDownloadShape}
        >
          Shapefile
        </button>
        <button disabled={!normalizedId} onClick={onDownloadXlsx}>
          Excel (.xlsx)
        </button>
      </div>

      {onOpenDueDiligence && (
        <button
          disabled={!geometryLoaded || !normalizedId}
          onClick={onOpenDueDiligence}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "9px 12px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-subtle)",
            color: "var(--text-primary)",
            cursor: geometryLoaded && normalizedId ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          📄 Dossiê Due Diligence (PDF)
        </button>
      )}

      <div
        style={{
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: "1px solid var(--line-light)",
        }}
      >
        <button
          disabled={!ready || isPublishingR2}
          onClick={onPublishR2}
          style={{
            width: "100%",
            padding: "9px 12px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "1px solid #166534",
            background: "#15803d",
            color: "#fff",
            cursor: ready && !isPublishingR2 ? "pointer" : "not-allowed",
            opacity: ready && !isPublishingR2 ? 1 : 0.6,
            marginBottom: "8px",
          }}
        >
          {isPublishingR2
            ? "⏳ Enviando GeoJSON para a Nuvem..."
            : "🚀 Enviar GeoJSON para a Nuvem (R2)"}
        </button>

        {lastPublishedR2Key && (
          <button
            onClick={() => onDownloadR2GeoJson(lastPublishedR2Key)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "8px",
              border: "1px solid #0369a1",
              background: "#075985",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            📥 Baixar GeoJSON recém-enviado do R2
          </button>
        )}
      </div>
    </article>
  );
}
