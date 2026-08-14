"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useUserManagement } from "../hooks/useUserManagement";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";

// Client-only GeoJSON Map Viewer
const layerUrls = {
  google: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  esri: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  hybrid: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

function GeoJsonMap({ geojsonData }: { geojsonData: any }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);
  const [activeLayer, setActiveLayer] = useState<"google" | "esri" | "hybrid" | "osm">("google");
  const [activePeriod, setActivePeriod] = useState<"2020" | "2026">("2026");
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingTimelapse) {
      interval = setInterval(() => {
        setActivePeriod((prev) => (prev === "2020" ? "2026" : "2020"));
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimelapse]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || !geojsonData) return;

    let isMounted = true;

    // Load leaflet CSS dynamically if not present
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([-14.235, -51.9253], 4);

      const tile = L.tileLayer(layerUrls[activeLayer], { maxZoom: 20 }).addTo(map);
      tileLayerRef.current = tile;

      try {
        const isCutoff = activePeriod === "2020";
        const layer = L.geoJSON(geojsonData, {
          style: {
            color: isCutoff ? "#eab308" : "#34d399",
            weight: 3,
            fillColor: isCutoff ? "#ca8a04" : "#10b981",
            fillOpacity: 0.35,
          },
          onEachFeature: (feature: any, l: any) => {
            if (feature.properties) {
              const props = Object.entries(feature.properties)
                .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
                .join("<br/>");
              l.bindPopup(`<div style="font-size:12px; font-family:sans-serif; color:#000;">${props}</div>`);
            }
          },
        }).addTo(map);

        geojsonLayerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (e) {
        console.warn("Erro ao renderizar GeoJSON no mapa:", e);
      }

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geojsonData, activeLayer, activePeriod]);

  return (
    <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(52, 211, 153, 0.3)", background: "#06130e" }}>
      {/* Controles no Topo do Modal do Mapa */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 800, color: "#34d399" }}>🛰️ SATÉLITE:</span>
          {(["google", "esri", "hybrid", "osm"] as const).map((layerKey) => (
            <button
              key={layerKey}
              onClick={() => setActiveLayer(layerKey)}
              style={{
                background: activeLayer === layerKey ? "#10b981" : "rgba(255, 255, 255, 0.08)",
                color: activeLayer === layerKey ? "#042f2e" : "#cbd5e1",
                border: "none",
                borderRadius: "4px",
                padding: "3px 7px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {layerKey === "google" ? "Google HD" : layerKey === "esri" ? "ESRI" : layerKey === "hybrid" ? "Híbrido" : "OSM"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 800, color: "#facc15" }}>📅 ÉPOCA:</span>
          <button
            onClick={() => {
              setIsPlayingTimelapse(false);
              setActivePeriod("2020");
            }}
            style={{
              background: activePeriod === "2020" ? "#eab308" : "rgba(255, 255, 255, 0.08)",
              color: activePeriod === "2020" ? "#000000" : "#cbd5e1",
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
              setActivePeriod("2026");
            }}
            style={{
              background: activePeriod === "2026" ? "#10b981" : "rgba(255, 255, 255, 0.08)",
              color: activePeriod === "2026" ? "#042f2e" : "#cbd5e1",
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

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "360px",
          position: "relative",
          background: "#06130e",
        }}
      />
    </div>
  );
}

interface CloudFileItem {
  key: string;
  filename: string;
  folder: string;
  size: number;
  sizeFormatted: string;
  lastModified: string;
  extension: string;
  category: string;
  downloadUrl: string;
  rawUrl: string;
}

interface SubfolderItem {
  name: string;
  fullPath: string;
  fileCount: number;
  totalSize: number;
  totalSizeFormatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

export default function CloudStoragePage() {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const userMgmt = useUserManagement();

  const [files, setFiles] = useState<CloudFileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation mode: "tree" (Folder Explorer) vs "search" (Flat All Files)
  const [browseMode, setBrowseMode] = useState<"tree" | "search">("tree");
  const [currentPath, setCurrentPath] = useState<string>(""); // "" = root

  // Search & Global filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedExt, setSelectedExt] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Modals state
  const [previewFile, setPreviewFile] = useState<CloudFileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewGeoJson, setPreviewGeoJson] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CloudFileItem | CloudFileItem[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("");
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/r2/all-files");
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error("Erro ao carregar arquivos da nuvem:", err);
      setFeedback({ type: "error", text: "Erro ao conectar com o catálogo de arquivos R2." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch only when authenticated as FAF user
  useEffect(() => {
    if (userMgmt.isAuthenticated && userMgmt.loggedUserRole !== "client") {
      fetchFiles();
    }
  }, [userMgmt.isAuthenticated, userMgmt.loggedUserRole]);

  // Hierarchical Folder Structure calculation based on currentPath
  const { currentSubfolders, currentPathFiles } = useMemo(() => {
    const subfolderMap = new Map<string, { count: number; size: number }>();
    const directFiles: CloudFileItem[] = [];

    files.forEach((file) => {
      const folder = file.folder === "raiz" ? "" : file.folder;

      // Check if file is directly in currentPath
      if (folder === currentPath) {
        directFiles.push(file);
      } else if (currentPath === "" || folder.startsWith(currentPath + "/")) {
        // File is in a deeper subfolder relative to currentPath
        const relative = currentPath === "" ? folder : folder.slice(currentPath.length + 1);
        const immediateSegment = relative.split("/")[0];
        if (immediateSegment) {
          const prev = subfolderMap.get(immediateSegment) || { count: 0, size: 0 };
          subfolderMap.set(immediateSegment, {
            count: prev.count + 1,
            size: prev.size + file.size,
          });
        }
      }
    });

    const subfolders: SubfolderItem[] = Array.from(subfolderMap.entries())
      .map(([name, data]) => ({
        name,
        fullPath: currentPath === "" ? name : `${currentPath}/${name}`,
        fileCount: data.count,
        totalSize: data.size,
        totalSizeFormatted: formatBytes(data.size),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    directFiles.sort((a, b) => {
      let valA: any = a.filename;
      let valB: any = b.filename;
      if (sortBy === "date") {
        valA = new Date(a.lastModified).getTime();
        valB = new Date(b.lastModified).getTime();
      } else if (sortBy === "size") {
        valA = a.size;
        valB = b.size;
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return {
      currentSubfolders: subfolders,
      currentPathFiles: directFiles,
    };
  }, [files, currentPath, sortBy, sortOrder]);

  // Global Filtered Files (for Search Mode)
  const globalFilteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (selectedCategory !== "TODAS" && file.category !== selectedCategory) return false;
        if (selectedExt !== "ALL" && file.extension !== selectedExt) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = file.filename.toLowerCase().includes(q);
          const matchKey = file.key.toLowerCase().includes(q);
          const matchFolder = file.folder.toLowerCase().includes(q);
          const matchCat = file.category.toLowerCase().includes(q);
          if (!matchName && !matchKey && !matchFolder && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a.filename;
        let valB: any = b.filename;
        if (sortBy === "date") {
          valA = new Date(a.lastModified).getTime();
          valB = new Date(b.lastModified).getTime();
        } else if (sortBy === "size") {
          valA = a.size;
          valB = b.size;
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [files, selectedCategory, selectedExt, searchQuery, sortBy, sortOrder]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = files.length;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const totalFormatted = formatBytes(totalBytes);
    return { totalCount, totalBytes, totalFormatted };
  }, [files]);

  // Breadcrumbs parts
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split("/");
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join("/"),
    }));
  }, [currentPath]);

  // Open Preview
  const handleOpenPreview = async (file: CloudFileItem) => {
    setPreviewFile(file);
    setPreviewContent(null);
    setPreviewGeoJson(null);
    setPreviewLoading(true);

    try {
      const res = await fetch(file.rawUrl);
      if (file.extension === "geojson" || file.extension === "json") {
        const json = await res.json();
        setPreviewContent(JSON.stringify(json, null, 2));
        if (file.extension === "geojson" || (json && json.type === "FeatureCollection")) {
          setPreviewGeoJson(json);
        }
      } else {
        const text = await res.text();
        setPreviewContent(text.slice(0, 50000));
      }
    } catch (err) {
      setPreviewContent(`Erro ao carregar pré-visualização: ${err}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const keysToDelete = Array.isArray(deleteTarget)
      ? deleteTarget.map((f) => f.key)
      : [deleteTarget.key];

    try {
      const res = await fetch("/api/r2/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: keysToDelete }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          text: `Sucesso: ${keysToDelete.length} arquivo(s) excluído(s) da nuvem R2.`,
        });
        setSelectedKeys(new Set());
        setDeleteTarget(null);
        if (previewFile && keysToDelete.includes(previewFile.key)) {
          setPreviewFile(null);
        }
        await fetchFiles();
      } else {
        setFeedback({ type: "error", text: data.error || "Erro ao excluir arquivo." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro de comunicação ao excluir arquivo." });
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFiles || selectedUploadFiles.length === 0) {
      setFeedback({ type: "error", text: "Selecione pelo menos um arquivo para enviar." });
      return;
    }

    setIsUploading(true);
    setUploadProgress("Iniciando envio...");

    const targetFolder = uploadFolder.trim() || currentPath || "uploads";
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedUploadFiles.length; i++) {
      const file = selectedUploadFiles[i];
      setUploadProgress(`Enviando (${i + 1}/${selectedUploadFiles.length}): ${file.name}...`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", targetFolder);

      try {
        const res = await fetch("/api/r2/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsUploading(false);
    setShowUploadModal(false);
    setSelectedUploadFiles(null);
    setUploadProgress("");

    if (successCount > 0) {
      setFeedback({
        type: "success",
        text: `Upload concluído: ${successCount} arquivo(s) enviado(s) para a pasta "${targetFolder}" com sucesso!`,
      });
      await fetchFiles();
    } else {
      setFeedback({ type: "error", text: "Falha ao enviar arquivo(s) para o Cloudflare R2." });
    }
  };

  const toggleSelectKey = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const toggleSelectAll = (filesToSelect: CloudFileItem[]) => {
    if (selectedKeys.size === filesToSelect.length && filesToSelect.length > 0) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filesToSelect.map((f) => f.key)));
    }
  };

  if (!mounted || userMgmt.isAuthenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#060f0b", display: "grid", placeItems: "center", color: "#6ee7b7", fontFamily: "sans-serif" }}>
        Carregando FAF Cloud Storage...
      </div>
    );
  }

  // 1. Tela de Login Corporativo FAF
  if (!userMgmt.isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: isDark
            ? "radial-gradient(ellipse at 50% 0%, #28120e 0%, #160a08 50%, #0a0403 100%)"
            : "radial-gradient(ellipse at 50% 0%, #fffbf7 0%, #f7efe6 50%, #eddcd0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: isDark ? "#fcf9f5" : "#1a0f0d",
          position: "relative",
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        <div style={{ position: "absolute", top: "24px", right: "24px" }}>
          <ThemeToggle />
        </div>

        <div
          style={{
            background: isDark
              ? "linear-gradient(150deg, rgba(38, 18, 14, 0.95) 0%, rgba(20, 10, 8, 0.98) 100%)"
              : "linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(253, 248, 242, 0.98) 100%)",
            border: isDark ? "1px solid rgba(209, 160, 104, 0.35)" : "1px solid rgba(209, 160, 104, 0.4)",
            borderRadius: "24px",
            padding: "40px 36px",
            maxWidth: "440px",
            width: "100%",
            boxShadow: isDark
              ? "0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(189, 40, 32, 0.15)"
              : "0 20px 50px rgba(70, 30, 20, 0.1)",
            textAlign: "center",
          }}
        >
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{
              height: "72px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 18px",
              display: "block",
              filter: isDark
                ? "drop-shadow(0 8px 20px rgba(189, 40, 32, 0.35))"
                : "drop-shadow(0 6px 15px rgba(189, 40, 32, 0.2))",
            }}
          />

          <div
            style={{
              display: "inline-block",
              background: "rgba(189, 40, 32, 0.2)",
              color: "#fca5a5",
              border: "1px solid rgba(189, 40, 32, 0.4)",
              borderRadius: "999px",
              padding: "4px 14px",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            🔒 ACESSO RESTRITO · EQUIPE FAF
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
            FAF Cloud Storage
          </h2>
          <p style={{ fontSize: "13px", color: "#d4c4b6", margin: "0 0 26px", lineHeight: 1.5 }}>
            Faça login com seu usuário corporativo FAF para gerenciar os arquivos e talhões no Cloudflare R2.
          </p>

          {userMgmt.loginError && (
            <div
              style={{
                background: "rgba(189, 40, 32, 0.2)",
                border: "1px solid rgba(189, 40, 32, 0.4)",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "12.5px",
                fontWeight: 700,
                marginBottom: "18px",
              }}
            >
              {userMgmt.loginError}
            </div>
          )}

          <form onSubmit={userMgmt.handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#dfa84a", marginBottom: "6px" }}>
                USUÁRIO FAF:
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="ex: joaomatos, faf, admin"
                value={userMgmt.loginUsername}
                onChange={(e) => userMgmt.setLoginUsername(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(10, 4, 3, 0.7)",
                  border: "1px solid rgba(209, 160, 104, 0.3)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  padding: "12px 14px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#dfa84a", marginBottom: "6px" }}>
                SENHA:
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={userMgmt.loginPassword}
                onChange={(e) => userMgmt.setLoginPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(10, 4, 3, 0.7)",
                  border: "1px solid rgba(209, 160, 104, 0.3)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  padding: "12px 14px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "8px",
                background: "linear-gradient(135deg, #bd2820 0%, #8d1b15 100%)",
                color: "#ffffff",
                border: "1px solid rgba(209, 160, 104, 0.3)",
                borderRadius: "12px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(189, 40, 32, 0.35)",
              }}
            >
              🔓 Acessar Nuvem R2
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Perfil Cliente -> Redirecionamento amigável
  if (userMgmt.loggedUserRole === "client") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse at 50% 0%, #28120e 0%, #160a08 50%, #0a0403 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#fcf9f5",
        }}
      >
        <div
          style={{
            background: "linear-gradient(150deg, rgba(38, 18, 14, 0.95), rgba(20, 10, 8, 0.98))",
            border: "1px solid rgba(209, 160, 104, 0.35)",
            borderRadius: "20px",
            padding: "40px 36px",
            maxWidth: "460px",
            width: "100%",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🔒</span>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "0 0 10px" }}>
            Acesso Restrito à Equipe FAF
          </h2>
          <p style={{ fontSize: "13.5px", color: "#d4c4b6", margin: "0 0 24px", lineHeight: 1.6 }}>
            Olá, <strong>{userMgmt.loggedUserName}</strong>. A gestão bruta do Cloudflare R2 é restrita a operadores internos. Acesse seus lotes pelo Portal do Cliente.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a
              href="https://portal.fafeu.online"
              style={{
                background: "linear-gradient(135deg, #d1a068, #a8793e)",
                color: "#1a0f0d",
                padding: "12px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 15px rgba(209, 160, 104, 0.3)",
              }}
            >
              🌐 Ir para o Portal do Cliente
            </a>
            <button
              onClick={userMgmt.handleLogout}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(209, 160, 104, 0.25)",
                color: "#fcf9f5",
                padding: "10px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔄 Trocar de Usuário (Logout)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Aplicação Principal FAF Cloud Storage
  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "radial-gradient(ellipse at 50% 0%, #28120e 0%, #160a08 50%, #0a0403 100%)"
          : "radial-gradient(ellipse at 50% 0%, #fffbf7 0%, #f7efe6 50%, #eddcd0 100%)",
        color: isDark ? "#fcf9f5" : "#1a0f0d",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: isDark ? "rgba(22, 10, 8, 0.9)" : "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(14px)",
          borderBottom: isDark ? "1px solid rgba(209, 160, 104, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)",
          padding: "0 28px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(70,30,20,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{ height: "42px", width: "auto", objectFit: "contain", display: "block" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: isDark ? "#dfa84a" : "#b37e33",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                CLOUD.FAFEU.ONLINE
              </span>
              <span
                style={{
                  background: isDark ? "rgba(189, 40, 32, 0.2)" : "rgba(189, 40, 32, 0.1)",
                  color: isDark ? "#fca5a5" : "#bd2820",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  border: "1px solid rgba(189, 40, 32, 0.35)",
                }}
              >
                ● CLOUDFLARE R2
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#1a0f0d",
                letterSpacing: "-0.01em",
              }}
            >
              FAF Cloud Storage & Arquivos EUDR
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />

          {/* User Profile Badge */}
          <div
            style={{
              background: isDark ? "rgba(38, 18, 14, 0.9)" : "rgba(250, 238, 231, 0.9)",
              border: "1px solid rgba(209, 160, 104, 0.3)",
              borderRadius: "8px",
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "14px" }}>👤</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                {userMgmt.loggedUserName || userMgmt.loggedUserKey}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#dfa84a", textTransform: "uppercase" }}>
                {userMgmt.loggedUserRole === "admin" ? "ADMINISTRADOR FAF" : "OPERADOR FAF"}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setUploadFolder(currentPath);
              setShowUploadModal(true);
            }}
            style={{
              background: "#10b981",
              color: "#042f2e",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
            }}
          >
            ⬆️ Novo Upload
          </button>

          <button
            onClick={fetchFiles}
            disabled={loading}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#e2e8f0",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🔄 {loading ? "Atualizando..." : "Recarregar"}
          </button>

          <button
            onClick={userMgmt.handleLogout}
            title="Sair"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🚪 Sair
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: "1600px",
          width: "100%",
          margin: "0 auto",
          padding: "24px 28px 60px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxSizing: "border-box",
        }}
      >
        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              background:
                feedback.type === "success"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${
                feedback.type === "success"
                  ? "rgba(16, 185, 129, 0.4)"
                  : "rgba(239, 68, 68, 0.4)"
              }`,
              color: feedback.type === "success" ? "#6ee7b7" : "#fca5a5",
              padding: "12px 20px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "16px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Control Bar: Mode Switcher & Search Bar */}
        <section
          style={{
            background: "rgba(11, 29, 23, 0.85)",
            border: "1px solid rgba(52, 211, 153, 0.2)",
            borderRadius: "14px",
            padding: "16px 20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {/* Mode Tabs */}
          <div
            style={{
              display: "flex",
              background: "#081611",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "10px",
              padding: "4px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setBrowseMode("tree")}
              style={{
                background: browseMode === "tree" ? "#10b981" : "transparent",
                color: browseMode === "tree" ? "#042f2e" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              🗂️ Navegador por Pastas (R2)
            </button>

            <button
              onClick={() => setBrowseMode("search")}
              style={{
                background: browseMode === "search" ? "#10b981" : "transparent",
                color: browseMode === "search" ? "#042f2e" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              🔍 Pesquisa & Todos os Arquivos
            </button>
          </div>

          {/* Quick Stats Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#94a3b8" }}>
            <span>
              📦 <strong>{metrics.totalCount}</strong> arquivos catalogados
            </span>
            <span>•</span>
            <span>
              💾 <strong>{metrics.totalFormatted}</strong> tamanho total
            </span>
          </div>
        </section>

        {/* VIEW MODE 1: HIERARCHICAL FOLDER TREE (R2 EXPLORER) */}
        {browseMode === "tree" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Breadcrumbs Navigation Bar */}
            <div
              style={{
                background: "rgba(11, 29, 23, 0.7)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
                borderRadius: "12px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {/* Breadcrumb Path Links */}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", fontSize: "13px" }}>
                <button
                  onClick={() => setCurrentPath("")}
                  style={{
                    background: currentPath === "" ? "rgba(52, 211, 153, 0.2)" : "transparent",
                    border: "none",
                    color: currentPath === "" ? "#34d399" : "#cbd5e1",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  🏠 Nuvem R2 (Raiz)
                </button>

                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.path}>
                    <span style={{ color: "#64748b" }}>/</span>
                    <button
                      onClick={() => setCurrentPath(crumb.path)}
                      style={{
                        background:
                          idx === breadcrumbs.length - 1
                            ? "rgba(52, 211, 153, 0.2)"
                            : "transparent",
                        border: "none",
                        color:
                          idx === breadcrumbs.length - 1
                            ? "#34d399"
                            : "#cbd5e1",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      📁 {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action buttons on current directory */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {currentPath !== "" && (
                  <button
                    onClick={() => {
                      const parent = currentPath.split("/").slice(0, -1).join("/");
                      setCurrentPath(parent);
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#e2e8f0",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ⬆️ Subir Pasta
                  </button>
                )}

                <button
                  onClick={() => {
                    setUploadFolder(currentPath);
                    setShowUploadModal(true);
                  }}
                  style={{
                    background: "rgba(52, 211, 153, 0.18)",
                    border: "1px solid rgba(52, 211, 153, 0.4)",
                    color: "#34d399",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  ➕ Upload nesta Pasta
                </button>
              </div>
            </div>

            {/* Subfolders Grid */}
            {currentSubfolders.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#a7f3d0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📁 Pastas ({currentSubfolders.length})
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {currentSubfolders.map((subfolder) => (
                    <div
                      key={subfolder.fullPath}
                      onClick={() => setCurrentPath(subfolder.fullPath)}
                      style={{
                        background: "rgba(11, 29, 23, 0.8)",
                        border: "1px solid rgba(52, 211, 153, 0.2)",
                        borderRadius: "12px",
                        padding: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#10b981";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.background = "rgba(16, 44, 36, 0.9)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(52, 211, 153, 0.2)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.background = "rgba(11, 29, 23, 0.8)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <span style={{ fontSize: "28px" }}>📁</span>
                        <div style={{ minWidth: 0 }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#ffffff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {subfolder.name}
                          </h4>
                          <span style={{ fontSize: "11px", color: "#6ee7b7" }}>
                            {subfolder.fileCount} arquivo(s) • {subfolder.totalSizeFormatted}
                          </span>
                        </div>
                      </div>

                      <span style={{ color: "#34d399", fontSize: "16px", fontWeight: 700 }}>→</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Files in Current Folder */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#a7f3d0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📄 Arquivos nesta Pasta ({currentPathFiles.length})
                </h3>

                {currentPathFiles.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => toggleSelectAll(currentPathFiles)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#34d399",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {selectedKeys.size === currentPathFiles.length && currentPathFiles.length > 0
                        ? "Desmarcar todos"
                        : "Selecionar todos da pasta"}
                    </button>

                    {selectedKeys.size > 0 && (
                      <button
                        onClick={() => {
                          const targets = files.filter((f) => selectedKeys.has(f.key));
                          setDeleteTarget(targets);
                        }}
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "5px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Excluir Selecionados ({selectedKeys.size})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {currentPathFiles.length === 0 ? (
                <div
                  style={{
                    background: "rgba(11, 29, 23, 0.4)",
                    border: "1px dashed rgba(52, 211, 153, 0.2)",
                    borderRadius: "12px",
                    padding: "36px 20px",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📂</span>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    Esta pasta não contém arquivos diretamente na raiz dela. Clique nas subpastas acima para navegar.
                  </p>
                </div>
              ) : (
                /* Files Table */
                <div
                  style={{
                    background: "rgba(11, 29, 23, 0.8)",
                    border: "1px solid rgba(52, 211, 153, 0.2)",
                    borderRadius: "14px",
                    overflowX: "auto",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      minWidth: "750px",
                      borderCollapse: "collapse",
                      textAlign: "left",
                      fontSize: "13px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "rgba(6, 18, 14, 0.95)",
                          borderBottom: "1px solid rgba(52, 211, 153, 0.25)",
                        }}
                      >
                        <th style={{ padding: "12px 16px", width: "40px" }}>
                          <input
                            type="checkbox"
                            checked={
                              selectedKeys.size === currentPathFiles.length &&
                              currentPathFiles.length > 0
                            }
                            onChange={() => toggleSelectAll(currentPathFiles)}
                            style={{ cursor: "pointer", accentColor: "#10b981" }}
                          />
                        </th>
                        <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800 }}>NOME DO ARQUIVO</th>
                        <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800 }}>FORMATO</th>
                        <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800, textAlign: "right" }}>TAMANHO</th>
                        <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800 }}>MODIFICADO</th>
                        <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800, textAlign: "right" }}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPathFiles.map((file, idx) => {
                        const isSelected = selectedKeys.has(file.key);
                        const isGeo = file.extension === "geojson" || file.extension === "kml";
                        const isJson = file.extension === "json";
                        return (
                          <tr
                            key={file.key}
                            style={{
                              background: isSelected
                                ? "rgba(16, 185, 129, 0.15)"
                                : idx % 2 === 0
                                ? "transparent"
                                : "rgba(255, 255, 255, 0.02)",
                              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            <td style={{ padding: "12px 16px" }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectKey(file.key)}
                                style={{ cursor: "pointer", accentColor: "#10b981" }}
                              />
                            </td>

                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "18px" }}>
                                  {isGeo
                                    ? "🗺️"
                                    : isJson
                                    ? "⚙️"
                                    : file.extension === "zip"
                                    ? "📦"
                                    : file.extension === "xlsx"
                                    ? "📊"
                                    : "📄"}
                                </span>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 700, color: "#ffffff" }}>{file.filename}</p>
                                  <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                                    {file.key}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  background: "rgba(52, 211, 153, 0.12)",
                                  color: "#34d399",
                                  border: "1px solid rgba(52, 211, 153, 0.25)",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                }}
                              >
                                {file.extension}
                              </span>
                            </td>

                            <td style={{ padding: "12px 16px", textAlign: "right", color: "#cbd5e1", fontWeight: 600 }}>
                              {file.sizeFormatted}
                            </td>

                            <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "12px" }}>
                              {new Date(file.lastModified).toLocaleString("pt-BR")}
                            </td>

                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <button
                                  onClick={() => handleOpenPreview(file)}
                                  title="Ver Arquivo / Mapa"
                                  style={{
                                    background: "rgba(52, 211, 153, 0.15)",
                                    border: "1px solid rgba(52, 211, 153, 0.3)",
                                    color: "#34d399",
                                    borderRadius: "6px",
                                    padding: "5px 10px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  👁️ Ver
                                </button>

                                <a
                                  href={file.downloadUrl}
                                  download={file.filename}
                                  title="Baixar Arquivo"
                                  style={{
                                    background: "rgba(59, 130, 246, 0.15)",
                                    border: "1px solid rgba(59, 130, 246, 0.3)",
                                    color: "#60a5fa",
                                    borderRadius: "6px",
                                    padding: "5px 10px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  ⬇️ Baixar
                                </a>

                                <button
                                  onClick={() => setDeleteTarget(file)}
                                  title="Excluir"
                                  style={{
                                    background: "rgba(239, 68, 68, 0.15)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    color: "#f87171",
                                    borderRadius: "6px",
                                    padding: "5px 8px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE 2: GLOBAL SEARCH & FLAT LIST */}
        {browseMode === "search" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Global Search Filters */}
            <div
              style={{
                background: "rgba(11, 29, 23, 0.7)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "14px",
              }}
            >
              {/* Search input */}
              <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por nome de talhão, fazenda, contrato, região ou arquivo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 36px",
                    background: "#081611",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "9px 12px",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="TODAS">Categorias: Todas</option>
                <option value="Contratos EUDR">Contratos EUDR</option>
                <option value="Talhões EUDR">Talhões EUDR</option>
                <option value="Polígonos">Polígonos</option>
                <option value="Planilhas">Planilhas</option>
                <option value="Metadados">Metadados</option>
                <option value="Documentos">Documentos</option>
              </select>

              {/* Extension filter */}
              <select
                value={selectedExt}
                onChange={(e) => setSelectedExt(e.target.value)}
                style={{
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "9px 12px",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="ALL">Formatos: Todos</option>
                <option value="geojson">.geojson</option>
                <option value="json">.json</option>
                <option value="xlsx">.xlsx</option>
                <option value="zip">.zip</option>
                <option value="kml">.kml</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "9px 12px",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="name">Ordenar por Nome</option>
                <option value="date">Ordenar por Data</option>
                <option value="size">Ordenar por Tamanho</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                style={{
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#34d399",
                  padding: "9px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {sortOrder === "asc" ? "▲ ASC" : "▼ DESC"}
              </button>
            </div>

            {/* Results Table */}
            <div
              style={{
                background: "rgba(11, 29, 23, 0.8)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
                borderRadius: "14px",
                overflowX: "auto",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "900px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "rgba(6, 18, 14, 0.95)",
                      borderBottom: "1px solid rgba(52, 211, 153, 0.25)",
                    }}
                  >
                    <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800, minWidth: "220px", whiteSpace: "nowrap" }}>ARQUIVO</th>
                    <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800, minWidth: "300px", whiteSpace: "nowrap" }}>PASTA / CAMINHO</th>
                    <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800, minWidth: "150px", whiteSpace: "nowrap" }}>CATEGORIA</th>
                    <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800, textAlign: "right", minWidth: "100px", whiteSpace: "nowrap" }}>TAMANHO</th>
                    <th style={{ padding: "12px 16px", color: "#a7f3d0", fontWeight: 800, textAlign: "right", minWidth: "160px", whiteSpace: "nowrap" }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {globalFilteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        Nenhum arquivo encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    globalFilteredFiles.map((file, idx) => (
                      <tr
                        key={file.key}
                        style={{
                          background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.02)",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <td style={{ padding: "12px 16px", minWidth: "220px" }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "#ffffff" }}>{file.filename}</p>
                          <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                            {file.key}
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px", maxWidth: "340px" }}>
                          <button
                            onClick={() => {
                              setCurrentPath(file.folder === "raiz" ? "" : file.folder);
                              setBrowseMode("tree");
                            }}
                            title={file.folder}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#6ee7b7",
                              fontSize: "12px",
                              cursor: "pointer",
                              padding: 0,
                              textDecoration: "underline",
                              textAlign: "left",
                              maxWidth: "100%",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            📁 {file.folder}
                          </button>
                        </td>

                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap", minWidth: "150px" }}>
                          <span
                            style={{
                              background: "rgba(52, 211, 153, 0.12)",
                              color: "#34d399",
                              border: "1px solid rgba(52, 211, 153, 0.25)",
                              borderRadius: "6px",
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              display: "inline-block",
                            }}
                          >
                            {file.category}
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right", color: "#cbd5e1", fontWeight: 600 }}>
                          {file.sizeFormatted}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={() => handleOpenPreview(file)}
                              style={{
                                background: "rgba(52, 211, 153, 0.15)",
                                border: "1px solid rgba(52, 211, 153, 0.3)",
                                color: "#34d399",
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              👁️ Ver
                            </button>

                            <a
                              href={file.downloadUrl}
                              download={file.filename}
                              style={{
                                background: "rgba(59, 130, 246, 0.15)",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                color: "#60a5fa",
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              ⬇️ Baixar
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Visualizer Modal */}
      {previewFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0d221b",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "1000px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(52, 211, 153, 0.2)",
                background: "#081611",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#34d399",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  PREVIEW · {previewFile.category}
                </span>
                <h3 style={{ margin: "2px 0 0", color: "#ffffff", fontSize: "16px", fontWeight: 700 }}>
                  {previewFile.filename}
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <a
                  href={previewFile.downloadUrl}
                  download={previewFile.filename}
                  style={{
                    background: "#10b981",
                    color: "#042f2e",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  ⬇️ Baixar Arquivo
                </a>

                <button
                  onClick={() => setPreviewFile(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: "#ffffff",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {previewLoading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#6ee7b7" }}>
                  Carregando conteúdo do arquivo...
                </div>
              ) : (
                <>
                  {previewGeoJson && (
                    <div>
                      <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#34d399", fontWeight: 700 }}>
                        🗺️ Visualização Geográfica (Satélite ESRI)
                      </h4>
                      <GeoJsonMap geojsonData={previewGeoJson} />
                    </div>
                  )}

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <h4 style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", fontWeight: 700 }}>
                        📑 Conteúdo Estruturado
                      </h4>
                      {previewContent && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(previewContent);
                            setFeedback({ type: "success", text: "Conteúdo copiado com sucesso!" });
                          }}
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "#e2e8f0",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          📋 Copiar
                        </button>
                      )}
                    </div>
                    <pre
                      style={{
                        background: "#06130e",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "14px",
                        color: "#a7f3d0",
                        fontSize: "12px",
                        fontFamily: "Consolas, Monaco, monospace",
                        maxHeight: "280px",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        margin: 0,
                      }}
                    >
                      {previewContent || "Nenhum conteúdo textual disponível para este formato."}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#1c0a0a",
              border: "1px solid #ef4444",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(239, 68, 68, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "28px" }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, color: "#fca5a5", fontSize: "17px", fontWeight: 800 }}>
                  Confirmar Exclusão no R2
                </h3>
                <span style={{ fontSize: "12px", color: "#f87171" }}>
                  Ação permanente e irreversível
                </span>
              </div>
            </div>

            <p style={{ color: "#e2e8f0", fontSize: "13px", lineHeight: "1.5", margin: "0 0 16px" }}>
              {Array.isArray(deleteTarget) ? (
                <>
                  Você está prestes a excluir <strong>{deleteTarget.length} arquivos</strong> da nuvem R2.
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir o arquivo <strong>{deleteTarget.filename}</strong>?
                </>
              )}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  background: "#ef4444",
                  border: "none",
                  color: "#ffffff",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0d221b",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "17px", fontWeight: 800 }}>
                ⬆️ Upload de Arquivos para o R2
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#a7f3d0", marginBottom: "6px" }}>
                  PASTA DE DESTINO:
                </label>
                <input
                  type="text"
                  placeholder="ex: mapping_eudr_data/MOGIANA ou contratos_clientes"
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#081611",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    padding: "10px 12px",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#a7f3d0", marginBottom: "6px" }}>
                  SELECIONAR ARQUIVOS:
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed rgba(52, 211, 153, 0.4)",
                    borderRadius: "10px",
                    padding: "24px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(16, 44, 36, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "28px", display: "block", marginBottom: "6px" }}>📁</span>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                    {selectedUploadFiles && selectedUploadFiles.length > 0
                      ? `${selectedUploadFiles.length} arquivo(s) selecionado(s)`
                      : "Clique para escolher arquivos"}
                  </p>
                  <span style={{ fontSize: "11px", color: "#6ee7b7" }}>
                    .geojson, .xlsx, .kml, .zip, .json, .pdf
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => setSelectedUploadFiles(e.target.files)}
                  style={{ display: "none" }}
                />
              </div>

              {uploadProgress && (
                <p style={{ fontSize: "12px", color: "#34d399", margin: 0, fontWeight: 700 }}>
                  {uploadProgress}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    background: "#10b981",
                    border: "none",
                    color: "#042f2e",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {isUploading ? "Enviando..." : "Confirmar e Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
