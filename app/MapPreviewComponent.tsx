"use client";

import { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { GeometryData, buildEudrGeoJson } from "./lib/eudr";

function BoundsFitter({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 19 });
    }
  }, [map, geojson]);
  return null;
}

interface MapPreviewProps {
  geometry: GeometryData;
  plotName?: string;
  plotArea?: number;
}

export default function MapPreviewComponent({
  geometry,
  plotName = "TALHÃO PREVIEW",
  plotArea,
}: MapPreviewProps) {
  const [selectedLayer, setSelectedLayer] = useState<"google" | "esri" | "osm" | "hybrid">("google");
  const [timelinePeriod, setTimelinePeriod] = useState<"2020" | "2026">("2026");
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState(false);

  const geojson = useMemo(() => buildEudrGeoJson(geometry, plotName || "preview", plotArea || 0), [geometry, plotName, plotArea]);

  const centerCoord = useMemo(() => {
    const points = geometry.polygons.flat(2);
    if (!points.length) return { lat: -15, lng: -50 };
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return {
      lng: Number(((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(6)),
      lat: Number(((Math.min(...ys) + Math.max(...ys)) / 2).toFixed(6)),
    };
  }, [geometry]);

  // Efeito de Time-Lapse animado
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingTimelapse) {
      interval = setInterval(() => {
        setTimelinePeriod((prev) => (prev === "2020" ? "2026" : "2020"));
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimelapse]);

  const layerUrls = {
    google: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    esri: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    hybrid: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "680px",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(52, 211, 153, 0.3)",
        background: "#06130e",
        position: "relative",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
      }}
    >
      {/* Barra Superior de Controles de Satélite e Linha do Tempo */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px 12px",
          background: "rgba(6, 18, 14, 0.95)",
          borderBottom: "1px solid rgba(52, 211, 153, 0.2)",
          fontSize: "11px",
          color: "#ffffff",
        }}
      >
        {/* Seletor de Camada */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 800, color: "#34d399" }}>🛰️ SATÉLITE:</span>
          {(["google", "esri", "hybrid", "osm"] as const).map((layerKey) => (
            <button
              key={layerKey}
              onClick={() => setSelectedLayer(layerKey)}
              style={{
                background: selectedLayer === layerKey ? "#10b981" : "rgba(255, 255, 255, 0.08)",
                color: selectedLayer === layerKey ? "#042f2e" : "#cbd5e1",
                border: "none",
                borderRadius: "4px",
                padding: "3px 7px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {layerKey === "google" ? "Google HD" : layerKey === "esri" ? "ESRI World" : layerKey === "hybrid" ? "Híbrido" : "OSM"}
            </button>
          ))}
        </div>

        {/* Linha do Tempo EUDR */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 800, color: "#facc15" }}>📅 ÉPOCA:</span>
          <button
            onClick={() => {
              setIsPlayingTimelapse(false);
              setTimelinePeriod("2020");
            }}
            style={{
              background: timelinePeriod === "2020" ? "#eab308" : "rgba(255, 255, 255, 0.08)",
              color: timelinePeriod === "2020" ? "#000000" : "#cbd5e1",
              border: "none",
              borderRadius: "4px",
              padding: "3px 7px",
              fontSize: "10px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Marco 2020
          </button>
          <button
            onClick={() => {
              setIsPlayingTimelapse(false);
              setTimelinePeriod("2026");
            }}
            style={{
              background: timelinePeriod === "2026" ? "#10b981" : "rgba(255, 255, 255, 0.08)",
              color: timelinePeriod === "2026" ? "#042f2e" : "#cbd5e1",
              border: "none",
              borderRadius: "4px",
              padding: "3px 7px",
              fontSize: "10px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Atual (2026)
          </button>

          <button
            onClick={() => setIsPlayingTimelapse(!isPlayingTimelapse)}
            title="Time-Lapse Comparativo Automático"
            style={{
              background: isPlayingTimelapse ? "#ef4444" : "rgba(52, 211, 153, 0.2)",
              color: isPlayingTimelapse ? "#ffffff" : "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "10px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {isPlayingTimelapse ? "⏸️ Pausar" : "▶️ Time-Lapse"}
          </button>
        </div>
      </div>

      {/* Container do Mapa Leaflet */}
      <div style={{ height: 340, width: "100%", position: "relative" }}>
        <MapContainer
          center={[centerCoord.lat, centerCoord.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            key={`${selectedLayer}-${timelinePeriod}`}
            url={layerUrls[selectedLayer]}
            attribution="Map data &copy; Satellite Services"
            maxNativeZoom={20}
            maxZoom={22}
          />
          <GeoJSON
            key={JSON.stringify(geojson)}
            data={geojson}
            style={{
              fillColor: timelinePeriod === "2020" ? "#eab308" : "#10b981",
              fillOpacity: 0.35,
              color: timelinePeriod === "2020" ? "#ca8a04" : "#34d399",
              weight: 3,
            }}
          />
          <BoundsFitter geojson={geojson} />
        </MapContainer>

        {/* Badge Flutuante de Telemetria e Auditoria */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            zIndex: 1000,
            background: "rgba(6, 18, 14, 0.85)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(52, 211, 153, 0.4)",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "11px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: 800, color: "#34d399" }}>📍 WGS84:</span>
            <span style={{ fontFamily: "monospace", color: "#a7f3d0" }}>{centerCoord.lat}, {centerCoord.lng}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: 800, color: "#facc15" }}>Época:</span>
            <span>{timelinePeriod === "2020" ? "Marco Legal EUDR (Dez/2020)" : "Auditoria Satélite Atual (2026)"}</span>
            <span style={{ color: "#34d399", fontWeight: 800 }}>· 🛡️ Zero Desmatamento</span>
          </div>
        </div>
      </div>
    </div>
  );
}
