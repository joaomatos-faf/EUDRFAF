"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useUserManagement } from "../hooks/useUserManagement";

// Client-only GeoJSON Map Viewer
function GeoJsonMap({ geojsonData }: { geojsonData: any }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

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

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);

      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, opacity: 0.8 }
      ).addTo(map);

      try {
        const layer = L.geoJSON(geojsonData, {
          style: {
            color: "#34d399",
            weight: 3,
            fillColor: "#10b981",
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
  }, [geojsonData]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "380px",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "#06130e",
      }}
    />
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

export default function CloudStoragePage() {
  const [mounted, setMounted] = useState(false);
  const userMgmt = useUserManagement();

  const [files, setFiles] = useState<CloudFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedExt, setSelectedExt] = useState("ALL");
  const [currentFolder, setCurrentFolder] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
  const [uploadFolder, setUploadFolder] = useState("contratos_clientes");
  const [customFolder, setCustomFolder] = useState("");
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
      setFeedback({ type: "error", text: "Erro ao conectar com o Cloudflare R2." });
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

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = files.length;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const totalFormatted = (totalBytes / 1024 / 1024).toFixed(2) + " MB";

    const categories: Record<string, number> = {};
    const extensions: Record<string, number> = {};
    const foldersSet = new Set<string>();

    files.forEach((f) => {
      categories[f.category] = (categories[f.category] || 0) + 1;
      extensions[f.extension] = (extensions[f.extension] || 0) + 1;
      if (f.folder && f.folder !== "raiz") {
        foldersSet.add(f.folder);
      }
    });

    return {
      totalCount,
      totalBytes,
      totalFormatted,
      categories,
      extensions,
      folders: Array.from(foldersSet).sort(),
    };
  }, [files]);

  // Filtered & Sorted Files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (selectedCategory !== "TODAS" && file.category !== selectedCategory) return false;
        if (selectedExt !== "ALL" && file.extension !== selectedExt) return false;
        if (currentFolder !== "ALL") {
          if (currentFolder === "raiz" && file.folder !== "raiz") return false;
          if (currentFolder !== "raiz" && !file.folder.startsWith(currentFolder)) return false;
        }
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
  }, [files, selectedCategory, selectedExt, currentFolder, searchQuery, sortBy, sortOrder]);

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
        setPreviewContent(text.slice(0, 100000));
      }
    } catch (err) {
      setPreviewContent(`Não foi possível carregar pré-visualização direta: ${err}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Single / Batch Delete
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
          text: `Sucesso: ${keysToDelete.length} arquivo(s) deletado(s) da nuvem R2.`,
        });
        setSelectedKeys(new Set());
        setDeleteTarget(null);
        if (previewFile && keysToDelete.includes(previewFile.key)) {
          setPreviewFile(null);
        }
        await fetchFiles();
      } else {
        setFeedback({ type: "error", text: data.error || "Erro ao deletar arquivo." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro ao comunicar com a API de deleção." });
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFiles || selectedUploadFiles.length === 0) {
      setFeedback({ type: "error", text: "Selecione pelo menos um arquivo para envio." });
      return;
    }

    setIsUploading(true);
    setUploadProgress("Iniciando envio...");

    const finalFolder = uploadFolder === "custom" ? customFolder.trim() : uploadFolder;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedUploadFiles.length; i++) {
      const file = selectedUploadFiles[i];
      setUploadProgress(`Enviando (${i + 1}/${selectedUploadFiles.length}): ${file.name}...`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", finalFolder || "uploads");

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
        text: `Upload concluído: ${successCount} arquivo(s) salvo(s) no R2 com sucesso!`,
      });
      await fetchFiles();
    } else {
      setFeedback({ type: "error", text: "Falha ao enviar arquivo(s) para o R2." });
    }
  };

  const toggleSelectKey = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === filteredFiles.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredFiles.map((f) => f.key)));
    }
  };

  if (!mounted || userMgmt.isAuthenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#081611", display: "grid", placeItems: "center", color: "#6ee7b7" }}>
        Carregando FAF Cloud Storage...
      </div>
    );
  }

  // 1. Não Autenticado -> Exibir Tela de Login Corporativa da FAF
  if (!userMgmt.isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #102a20 0%, #06130e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif",
          color: "#f1f5f9",
        }}
      >
        <div
          style={{
            background: "rgba(11, 29, 23, 0.95)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            borderRadius: "20px",
            padding: "40px 36px",
            maxWidth: "440px",
            width: "100%",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{
              height: "64px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 16px",
              display: "block",
            }}
          />

          <div
            style={{
              display: "inline-block",
              background: "rgba(52, 211, 153, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "999px",
              padding: "4px 12px",
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
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 28px", lineHeight: 1.5 }}>
            Autentique-se com sua conta de operador ou administrador da FAF Coffees para acessar o Cloudflare R2.
          </p>

          {userMgmt.loginError && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "18px",
              }}
            >
              {userMgmt.loginError}
            </div>
          )}

          <form onSubmit={userMgmt.handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#a7f3d0", marginBottom: "6px" }}>
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
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "11px 14px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#a7f3d0", marginBottom: "6px" }}>
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
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  padding: "11px 14px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "10px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(16, 185, 129, 0.25)",
              }}
            >
              🔓 Acessar Nuvem R2
            </button>
          </form>

          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <a
              href="/"
              style={{
                color: "#6ee7b7",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              ← Voltar para a Página Principal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Autenticado como CLIENTE -> Bloquear acesso e direcionar ao Portal do Cliente
  if (userMgmt.loggedUserRole === "client") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #102a20 0%, #06130e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif",
          color: "#f1f5f9",
        }}
      >
        <div
          style={{
            background: "rgba(11, 29, 23, 0.95)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "20px",
            padding: "40px 36px",
            maxWidth: "480px",
            width: "100%",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "44px", display: "block", marginBottom: "14px" }}>🚫</span>
          <div
            style={{
              display: "inline-block",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            ACESSO NÃO AUTORIZADO
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "0 0 10px" }}>
            Acesso Restrito à Equipe FAF
          </h2>

          <p style={{ fontSize: "13.5px", color: "#cbd5e1", margin: "0 0 24px", lineHeight: 1.6 }}>
            Olá, <strong>{userMgmt.loggedUserName || "Cliente"}</strong>. Sua conta possui permissão de <strong>Cliente / Importador</strong>.
            <br /><br />
            O gerenciamento bruto do Cloudflare R2 é de uso restrito dos operadores e administradores da FAF Coffees. Você pode consultar e baixar os lotes de seus contratos no <strong>Portal do Cliente</strong>.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a
              href="https://portal.fafeu.online"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              }}
            >
              🌐 Ir para o Portal do Cliente
            </a>

            <button
              onClick={userMgmt.handleLogout}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#e2e8f0",
                padding: "10px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔄 Entrar com Outro Usuário (Logout)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Autenticado como FAF (Admin ou Usuário Padrão) -> Acesso Total Liberado
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#081611",
        color: "#f1f5f9",
        fontFamily: "'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Corporate Navigation Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(11, 29, 23, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(52, 211, 153, 0.15)",
          padding: "0 32px",
          height: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{ height: "42px", width: "auto", objectFit: "contain" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: "#d77442",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                CLOUD.FAFEU.ONLINE
              </span>
              <span
                style={{
                  background: "rgba(52, 211, 153, 0.15)",
                  color: "#34d399",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                }}
              >
                ● CLOUDFLARE R2 LIVE
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "19px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              FAF Cloud Storage & Dossier Explorer
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Tag do Usuário Logado */}
          <div
            style={{
              background: "rgba(16, 44, 36, 0.8)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "8px",
              padding: "6px 12px",
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
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#34d399", textTransform: "uppercase" }}>
                {userMgmt.loggedUserRole === "admin" ? "ADMINISTRADOR FAF" : "OPERADOR FAF"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              background: "#10b981",
              color: "#042f2e",
              border: "none",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
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
              padding: "9px 14px",
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

          <a
            href="/"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#e2e8f0",
              borderRadius: "8px",
              padding: "9px 14px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🏠 Início
          </a>

          <button
            onClick={userMgmt.handleLogout}
            title="Encerrar Sessão"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              borderRadius: "8px",
              padding: "9px 14px",
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

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: "1540px",
          width: "100%",
          margin: "0 auto",
          padding: "28px 32px 60px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
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

        {/* Metrics Grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "rgba(16, 44, 36, 0.7)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              📦 Total de Arquivos
            </p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
              {metrics.totalCount}
            </h3>
            <span style={{ fontSize: "12px", color: "#6ee7b7" }}>no bucket R2</span>
          </div>

          <div
            style={{
              background: "rgba(16, 44, 36, 0.7)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              💾 Espaço Armazenado
            </p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
              {metrics.totalFormatted}
            </h3>
            <span style={{ fontSize: "12px", color: "#6ee7b7" }}>consumo real</span>
          </div>

          <div
            style={{
              background: "rgba(16, 44, 36, 0.7)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              📑 Contratos EUDR
            </p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
              {metrics.categories["Contratos EUDR"] || 0}
            </h3>
            <span style={{ fontSize: "12px", color: "#6ee7b7" }}>dossiês prontos</span>
          </div>

          <div
            style={{
              background: "rgba(16, 44, 36, 0.7)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🗺️ Talhões & Geometrias
            </p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
              {(metrics.categories["Talhões Individuais"] || 0) + (metrics.categories["Geometrias & Mapas"] || 0)}
            </h3>
            <span style={{ fontSize: "12px", color: "#6ee7b7" }}>GeoJSON / KML</span>
          </div>

          <div
            style={{
              background: "rgba(16, 44, 36, 0.7)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              📁 Pastas Catalogadas
            </p>
            <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
              {metrics.folders.length}
            </h3>
            <span style={{ fontSize: "12px", color: "#6ee7b7" }}>diretórios no servidor</span>
          </div>
        </section>

        {/* Toolbar: Search, Filters, Folder Breadcrumb */}
        <section
          style={{
            background: "rgba(11, 29, 23, 0.8)",
            border: "1px solid rgba(52, 211, 153, 0.15)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Top Row: Search & View Controls */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: "15px",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por nome de arquivo, chave R2, contrato ou pasta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 40px",
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Folder Filter Dropdown */}
            <select
              value={currentFolder}
              onChange={(e) => setCurrentFolder(e.target.value)}
              style={{
                background: "#081611",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                borderRadius: "8px",
                color: "#e2e8f0",
                padding: "10px 14px",
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">📁 Todas as Pastas</option>
              <option value="raiz">📂 Raiz (/)</option>
              {metrics.folders.map((f) => (
                <option key={f} value={f}>
                  📁 {f}
                </option>
              ))}
            </select>

            {/* Extension Filter */}
            <select
              value={selectedExt}
              onChange={(e) => setSelectedExt(e.target.value)}
              style={{
                background: "#081611",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                borderRadius: "8px",
                color: "#e2e8f0",
                padding: "10px 14px",
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">Formatos: Todos</option>
              <option value="geojson">.geojson (Geometrias)</option>
              <option value="json">.json (Metadados)</option>
              <option value="kml">.kml (Google Earth)</option>
              <option value="zip">.zip (Pacotes)</option>
              <option value="xlsx">.xlsx (Planilhas)</option>
              <option value="pdf">.pdf (Dossiês)</option>
            </select>

            {/* Sort Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="date">Ordenar por Data</option>
                <option value="name">Ordenar por Nome</option>
                <option value="size">Ordenar por Tamanho</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title="Inverter Ordem"
                style={{
                  background: "#081611",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "8px",
                  color: "#34d399",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {sortOrder === "asc" ? "▲ ASC" : "▼ DESC"}
              </button>
            </div>

            {/* View Mode Switcher */}
            <div
              style={{
                display: "flex",
                background: "#081611",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setViewMode("table")}
                style={{
                  background: viewMode === "table" ? "#10b981" : "transparent",
                  color: viewMode === "table" ? "#042f2e" : "#94a3b8",
                  border: "none",
                  padding: "9px 14px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                📑 Tabela
              </button>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  background: viewMode === "grid" ? "#10b981" : "transparent",
                  color: viewMode === "grid" ? "#042f2e" : "#94a3b8",
                  border: "none",
                  padding: "9px 14px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ⊞ Grade
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              paddingTop: "6px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {["TODAS", "Contratos EUDR", "Talhões Individuais", "Geometrias & Mapas", "Planilhas de Dados", "Arquivos Compactados (ZIP)", "Metadados do Sistema"].map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === "TODAS" ? files.length : metrics.categories[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: isSelected ? "#34d399" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${isSelected ? "#34d399" : "rgba(255, 255, 255, 0.12)"}`,
                    color: isSelected ? "#042f2e" : "#cbd5e1",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      background: isSelected ? "rgba(4, 47, 46, 0.25)" : "rgba(255, 255, 255, 0.12)",
                      padding: "1px 6px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Batch Selection Action Bar */}
          {selectedKeys.size > 0 && (
            <div
              style={{
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "10px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#fbbf24" }}>
                  ✓ {selectedKeys.size} arquivo(s) selecionado(s)
                </span>
                <button
                  onClick={() => setSelectedKeys(new Set())}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#fde68a",
                    fontSize: "12px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Desmarcar todos
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                    padding: "7px 14px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  🗑️ Excluir Selecionados ({selectedKeys.size})
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Files Content: Table or Grid */}
        {loading ? (
          <div
            style={{
              background: "rgba(11, 29, 23, 0.5)",
              borderRadius: "14px",
              padding: "60px 20px",
              textAlign: "center",
              color: "#6ee7b7",
            }}
          >
            <p style={{ fontSize: "16px", fontWeight: 700 }}>Carregando catálogo de arquivos da nuvem...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div
            style={{
              background: "rgba(11, 29, 23, 0.5)",
              border: "1px dashed rgba(255, 255, 255, 0.15)",
              borderRadius: "14px",
              padding: "60px 20px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>
              Nenhum arquivo encontrado
            </p>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 18px" }}>
              Tente alterar os filtros de busca ou faça upload de um novo arquivo.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                background: "#10b981",
                color: "#042f2e",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ⬆️ Fazer Upload Agora
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div
            style={{
              background: "rgba(11, 29, 23, 0.8)",
              border: "1px solid rgba(52, 211, 153, 0.15)",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "rgba(6, 18, 14, 0.95)", borderBottom: "1px solid rgba(52, 211, 153, 0.2)" }}>
                  <th style={{ padding: "14px 16px", width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedKeys.size === filteredFiles.length && filteredFiles.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer", accentColor: "#10b981" }}
                    />
                  </th>
                  <th style={{ padding: "14px 16px", color: "#a7f3d0", fontWeight: 800, letterSpacing: "0.05em" }}>ARQUIVO / CHAVE R2</th>
                  <th style={{ padding: "14px 16px", color: "#a7f3d0", fontWeight: 800, letterSpacing: "0.05em" }}>PASTA</th>
                  <th style={{ padding: "14px 16px", color: "#a7f3d0", fontWeight: 800, letterSpacing: "0.05em" }}>CATEGORIA</th>
                  <th style={{ padding: "14px 16px", color: "#a7f3d0", fontWeight: 800, letterSpacing: "0.05em" }}>TAMANHO</th>
                  <th style={{ padding: "14px 16px", color: "#a7f3d0", fontWeight: 800, letterSpacing: "0.05em" }}>MODIFICADO</th>
                  <th style={{ padding: "14px 16px", color: "#a7f3d0", fontWeight: 800, letterSpacing: "0.05em", textAlign: "right" }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, idx) => {
                  const isSelected = selectedKeys.has(file.key);
                  const isGeo = file.extension === "geojson" || file.extension === "kml";
                  const isJson = file.extension === "json";
                  return (
                    <tr
                      key={file.key}
                      style={{
                        background: isSelected
                          ? "rgba(16, 185, 129, 0.12)"
                          : idx % 2 === 0
                          ? "rgba(255, 255, 255, 0.01)"
                          : "rgba(255, 255, 255, 0.03)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectKey(file.key)}
                          style={{ cursor: "pointer", accentColor: "#10b981" }}
                        />
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px" }}>
                            {isGeo ? "🗺️" : isJson ? "⚙️" : file.extension === "zip" ? "📦" : file.extension === "xlsx" ? "📊" : "📄"}
                          </span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: "#ffffff" }}>{file.filename}</p>
                            <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>{file.key}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: "12px" }}>
                        📁 {file.folder}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: "rgba(52, 211, 153, 0.12)",
                            color: "#34d399",
                            border: "1px solid rgba(52, 211, 153, 0.25)",
                            borderRadius: "999px",
                            padding: "3px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {file.category}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#cbd5e1", fontWeight: 600 }}>
                        {file.sizeFormatted}
                      </td>

                      <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "12px" }}>
                        {new Date(file.lastModified).toLocaleString("pt-BR")}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Visualizar */}
                          <button
                            onClick={() => handleOpenPreview(file)}
                            title="Visualizar Arquivo"
                            style={{
                              background: "rgba(52, 211, 153, 0.15)",
                              border: "1px solid rgba(52, 211, 153, 0.3)",
                              color: "#34d399",
                              borderRadius: "6px",
                              padding: "6px 10px",
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

                          {/* Baixar */}
                          <a
                            href={file.downloadUrl}
                            download={file.filename}
                            title="Baixar Arquivo"
                            style={{
                              background: "rgba(59, 130, 246, 0.15)",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              color: "#60a5fa",
                              borderRadius: "6px",
                              padding: "6px 10px",
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

                          {/* Deletar */}
                          <button
                            onClick={() => setDeleteTarget(file)}
                            title="Excluir Arquivo do R2"
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#f87171",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
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
        ) : (
          /* Grid View */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: "18px",
            }}
          >
            {filteredFiles.map((file) => {
              const isSelected = selectedKeys.has(file.key);
              const isGeo = file.extension === "geojson" || file.extension === "kml";
              const isJson = file.extension === "json";
              return (
                <div
                  key={file.key}
                  style={{
                    background: isSelected ? "rgba(16, 185, 129, 0.12)" : "rgba(11, 29, 23, 0.8)",
                    border: `1px solid ${isSelected ? "#10b981" : "rgba(52, 211, 153, 0.18)"}`,
                    borderRadius: "12px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectKey(file.key)}
                      style={{ marginTop: "4px", cursor: "pointer", accentColor: "#10b981" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "16px" }}>
                          {isGeo ? "🗺️" : isJson ? "⚙️" : file.extension === "zip" ? "📦" : file.extension === "xlsx" ? "📊" : "📄"}
                        </span>
                        <span
                          style={{
                            background: "rgba(52, 211, 153, 0.12)",
                            color: "#34d399",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "999px",
                          }}
                        >
                          {file.extension.toUpperCase()}
                        </span>
                      </div>
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
                        {file.filename}
                      </h4>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "11px",
                          color: "#64748b",
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        📁 {file.folder}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#94a3b8",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "10px",
                    }}
                  >
                    <span>{file.sizeFormatted}</span>
                    <span>{new Date(file.lastModified).toLocaleDateString("pt-BR")}</span>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenPreview(file)}
                      style={{
                        flex: 1,
                        background: "rgba(52, 211, 153, 0.15)",
                        border: "1px solid rgba(52, 211, 153, 0.3)",
                        color: "#34d399",
                        borderRadius: "6px",
                        padding: "7px 0",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      👁️ Visualizar
                    </button>
                    <a
                      href={file.downloadUrl}
                      download={file.filename}
                      style={{
                        flex: 1,
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        color: "#60a5fa",
                        borderRadius: "6px",
                        padding: "7px 0",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "center",
                        textDecoration: "none",
                      }}
                    >
                      ⬇️ Baixar
                    </a>
                    <button
                      onClick={() => setDeleteTarget(file)}
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#f87171",
                        borderRadius: "6px",
                        padding: "7px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
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
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "#0d221b",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "1080px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
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
                <h3 style={{ margin: "2px 0 0", color: "#ffffff", fontSize: "17px", fontWeight: 700 }}>
                  {previewFile.filename}
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                  onClick={() => {
                    setDeleteTarget(previewFile);
                  }}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#fca5a5",
                    padding: "7px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🗑️ Excluir
                </button>

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
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {previewLoading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#6ee7b7" }}>
                  Carregando conteúdo do arquivo...
                </div>
              ) : (
                <>
                  {/* If GeoJSON has coordinates, show map */}
                  {previewGeoJson && (
                    <div>
                      <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#34d399", fontWeight: 700 }}>
                        🗺️ Visualização Geográfica (Satélite ESRI)
                      </h4>
                      <GeoJsonMap geojsonData={previewGeoJson} />
                    </div>
                  )}

                  {/* Raw Code / Content Viewer */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "#e2e8f0", fontWeight: 700 }}>
                        📑 Conteúdo Estruturado
                      </h4>
                      {previewContent && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(previewContent);
                            setFeedback({ type: "success", text: "Conteúdo copiado para a área de transferência!" });
                          }}
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "#e2e8f0",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          📋 Copiar Código
                        </button>
                      )}
                    </div>
                    <pre
                      style={{
                        background: "#06130e",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "16px",
                        color: "#a7f3d0",
                        fontSize: "12px",
                        fontFamily: "Consolas, Monaco, monospace",
                        maxHeight: "360px",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        margin: 0,
                      }}
                    >
                      {previewContent || "Nenhum conteúdo textual disponível para este arquivo."}
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
              padding: "26px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(239, 68, 68, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "28px" }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, color: "#fca5a5", fontSize: "18px", fontWeight: 800 }}>
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
                  Você está prestes a excluir <strong>{deleteTarget.length} arquivos</strong> do bucket Cloudflare R2:
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", maxHeight: "120px", overflowY: "auto", fontSize: "12px", color: "#fca5a5" }}>
                    {deleteTarget.map((t) => (
                      <li key={t.key}>{t.filename}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  Você tem certeza que deseja excluir o arquivo <strong>{deleteTarget.filename}</strong>?
                  <br />
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                    Chave: {deleteTarget.key} ({deleteTarget.sizeFormatted})
                  </span>
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
                  padding: "9px 16px",
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
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir Definitivamente"}
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
            background: "rgba(0,0,0,0.8)",
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
              padding: "26px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "18px", fontWeight: 800 }}>
                ⬆️ Enviar Arquivo para a Nuvem R2
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

            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Destination Folder Selector */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#a7f3d0", marginBottom: "6px" }}>
                  PASTA DE DESTINO NO R2:
                </label>
                <select
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#081611",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    padding: "10px 14px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="contratos_clientes">contratos_clientes (Dossiês de Contratos)</option>
                  <option value="mapping_eudr_data">mapping_eudr_data (Talhões e Geometrias)</option>
                  <option value="uploads">uploads (Arquivos Gerais)</option>
                  <option value="documentos">documentos (PDFs e Planilhas)</option>
                  <option value="custom">Outra pasta personalizada...</option>
                </select>
              </div>

              {uploadFolder === "custom" && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#a7f3d0", marginBottom: "6px" }}>
                    NOME DA PASTA PERSONALIZADA:
                  </label>
                  <input
                    type="text"
                    placeholder="ex: clientes/lote_especial"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#081611",
                      border: "1px solid rgba(52, 211, 153, 0.3)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      padding: "10px 14px",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              {/* File Dropzone / Selector */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#a7f3d0", marginBottom: "6px" }}>
                  SELECIONE OS ARQUIVOS:
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed rgba(52, 211, 153, 0.4)",
                    borderRadius: "10px",
                    padding: "28px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(16, 44, 36, 0.4)",
                    transition: "border 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📁</span>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                    {selectedUploadFiles && selectedUploadFiles.length > 0
                      ? `${selectedUploadFiles.length} arquivo(s) selecionado(s)`
                      : "Clique para selecionar ou arraste arquivos aqui"}
                  </p>
                  <span style={{ fontSize: "11px", color: "#6ee7b7" }}>
                    Suporta .geojson, .kml, .shp, .zip, .xlsx, .json, .pdf
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: "#ffffff",
                    padding: "9px 16px",
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
                    padding: "9px 22px",
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
