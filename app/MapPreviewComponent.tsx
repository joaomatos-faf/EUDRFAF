"use client";

import { useMemo, useEffect } from "react";
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
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
    }
  }, [map, geojson]);
  return null;
}

export default function MapPreviewComponent({ geometry }: { geometry: GeometryData }) {
  const geojson = useMemo(() => buildEudrGeoJson(geometry, "preview", 0), [geometry]);
  const centerCoord = useMemo(() => {
    const points = geometry.polygons.flat(2);
    if (!points.length) return { lat: -15, lng: -50 };
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return { lng: (Math.min(...xs) + Math.max(...xs)) / 2, lat: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }, [geometry]);

  return (
    <div style={{ width: 560, height: 320, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(29, 57, 43, 0.08)" }}>
      <MapContainer
        center={[centerCoord.lat, centerCoord.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
          maxNativeZoom={18}
          maxZoom={22}
        />
        <GeoJSON
          key={JSON.stringify(geojson)}
          data={geojson}
          style={{
            fillColor: "#be5c2e",
            fillOpacity: 0.22,
            color: "#bd5c2e",
            weight: 2.5,
          }}
        />
        <BoundsFitter geojson={geojson} />
      </MapContainer>
    </div>
  );
}
