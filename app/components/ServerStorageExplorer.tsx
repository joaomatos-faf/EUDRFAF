"use client";

import React, { useEffect, useMemo, useState } from "react";

export interface R2FileRecord {
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

interface ServerStorageExplorerProps {
  isOpen?: boolean;
  onClose?: () => void;
  userName?: string;
  userRole?: string;
}

export function ServerStorageExplorer({
  isOpen = true,
  onClose,
  userName,
  userRole,
}: ServerStorageExplorerProps) {
  const [files, setFiles] = useState<R2FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState("0 B");
  const [categoriesCount, setCategoriesCount] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Preview modal state
  const [previewFile, setPreviewFile] = useState<R2FileRecord | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/r2/all-files");
      if (!res.ok) throw new Error(`Falha ao consultar servidor (${res.status})`);
      const data = await res.json();
      if (data.files && Array.isArray(data.files)) {
        setFiles(data.files);
        setTotalSize(data.totalSizeFormatted || "0 B");
        setCategoriesCount(data.categoriesCount || {});
      } else {
        setFiles([]);
      }
    } catch (err: any) {
      setError(err?.message || "Erro de conexão com o servidor R2.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePreview = async (file: R2FileRecord) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewContent(null);
    try {
      const res = await fetch(file.rawUrl);
      if (!res.ok) throw new Error("Não foi possível carregar o conteúdo.");
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        setPreviewContent(JSON.stringify(parsed, null, 2));
      } catch {
        setPreviewContent(text.slice(0, 50000));
      }
    } catch (e: any) {
      setPreviewContent(`Erro ao ler arquivo: ${e.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (selectedCategory !== "TODOS") {
      result = result.filter((f) => f.category === selectedCategory);
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (f) =>
          f.key.toLowerCase().includes(q) ||
          f.filename.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.folder.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "date") {
        const timeA = new Date(a.lastModified).getTime();
        const timeB = new Date(b.lastModified).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === "size") {
        return sortOrder === "asc" ? a.size - b.size : b.size - a.size;
      }
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename);
      }
      return 0;
    });

    return result;
  }, [files, selectedCategory, searchQuery, sortBy, sortOrder]);

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case "geojson":
        return "🗺️";
      case "xlsx":
      case "xls":
      case "csv":
        return "📊";
      case "zip":
        return "📦";
      case "json":
        return "⚙️";
      case "kml":
      case "shp":
        return "📍";
      case "pdf":
        return "📕";
      default:
        return "📄";
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case "Contratos EUDR":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" };
      case "Talhões Individuais":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
      case "Geometrias & Mapas":
        return { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.3)" };
      case "Planilhas de Dados":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" };
      case "Arquivos Compactados (ZIP)":
        return { bg: "rgba(236, 72, 153, 0.12)", color: "#ec4899", border: "rgba(236, 72, 153, 0.3)" };
      case "Metadados do Sistema":
        return { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8", border: "rgba(100, 116, 139, 0.3)" };
      default:
        return { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b", border: "rgba(100, 116, 139, 0.25)" };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--canvas, #f3f5f2)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Corporate Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#0d261e",
          color: "#ffffff",
          padding: "0 max(28px, calc((100vw - 1520px) / 2))",
          height: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{
              height: "42px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
          <div>
            <p
              style={{
                margin: "0 0 2px",
                color: "#f59e0b",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              CLOUDFLARE R2 OBJECT STORAGE • BUCKET: FAF-EUDR-STORAGE
            </p>
            <h1
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "19px",
                fontWeight: 700,
                letterSpacing: "-.02em",
              }}
            >
              ☁️ Explorador da Nuvem & Servidor Central
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#34d399",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
            Servidor Ativo ({files.length} arquivos)
          </span>

          {userName && (
            <span
              style={{
                color: "#d1fae5",
                fontSize: "13px",
                fontWeight: 600,
                background: "rgba(255,255,255,0.08)",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              👤 {userName}
            </span>
          )}

          <button
            onClick={fetchFiles}
            disabled={loading}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {loading ? "🔄 Carregando..." : "🔄 Atualizar"}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(239, 68, 68, 0.18)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#fca5a5",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              ✕ Voltar
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          maxWidth: "1520px",
          width: "100%",
          margin: "0 auto",
          padding: "28px 28px 60px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* KPI Metrics Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 22px",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Total de Arquivos
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {files.length}
            </div>
            <div style={{ fontSize: "12px", color: "#10b981", marginTop: "4px", fontWeight: 600 }}>
              Armazenados no Cloudflare R2
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 22px",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Armazenamento Ocupado
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {totalSize}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Volume total de objetos
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 22px",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Contratos & Geometrias
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
              {(categoriesCount["Contratos EUDR"] || 0) + (categoriesCount["Geometrias & Mapas"] || 0)}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Arquivos GeoJSON e Polígonos
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 22px",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Metadados & Sistema
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#6366f1", marginTop: "4px" }}>
              {categoriesCount["Metadados do Sistema"] || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Usuários, logs e índices
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search Input */}
            <div style={{ flex: "1 1 320px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "16px",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Pesquisar por nome de arquivo, caminho (key), extensão ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 42px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Ordenar:</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split("-") as ["date" | "name" | "size", "asc" | "desc"];
                  setSortBy(sb);
                  setSortOrder(so);
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "#f8fafc",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="date-desc">Data mais recente</option>
                <option value="date-asc">Data mais antiga</option>
                <option value="name-asc">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
                <option value="size-desc">Maior tamanho</option>
                <option value="size-asc">Menor tamanho</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedCategory("TODOS")}
              style={{
                padding: "7px 14px",
                borderRadius: "999px",
                fontSize: "12.5px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: selectedCategory === "TODOS" ? "#0f172a" : "#f1f5f9",
                color: selectedCategory === "TODOS" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              Todos os Arquivos ({files.length})
            </button>

            {Object.entries(categoriesCount).map(([cat, count]) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "999px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: active ? "#10b981" : "#f1f5f9",
                    color: active ? "#ffffff" : "#475569",
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Messages */}
        {copiedKey && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              background: "#dcfce7",
              color: "#166534",
              border: "1px solid #86efac",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            📋 Caminho copiado para a área de transferência: <strong>{copiedKey}</strong>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "10px",
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Files Table Container */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.07)",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
          }}
        >
          {loading ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔄</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                Consultando bucket Cloudflare R2...
              </div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>
                Listando todos os arquivos e diretórios disponíveis
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>📂</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                Nenhum arquivo encontrado
              </div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>
                Tente ajustar os termos da busca ou selecione outra categoria.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13.5px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <th style={{ padding: "16px 20px" }}>Arquivo / Nome</th>
                    <th style={{ padding: "16px 16px" }}>Categoria</th>
                    <th style={{ padding: "16px 16px" }}>Caminho no Servidor (Key)</th>
                    <th style={{ padding: "16px 16px" }}>Tamanho</th>
                    <th style={{ padding: "16px 16px" }}>Última Modificação</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file, idx) => {
                    const badge = getCategoryBadgeStyle(file.category);
                    const isEven = idx % 2 === 0;
                    const isPreviewable = file.extension === "geojson" || file.extension === "json";

                    return (
                      <tr
                        key={file.key}
                        style={{
                          background: isEven ? "#ffffff" : "#fafafa",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* File Name & Icon */}
                        <td style={{ padding: "14px 20px", fontWeight: 600, color: "#0f172a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "18px" }}>{getFileIcon(file.extension)}</span>
                            <div>
                              <div style={{ fontWeight: 700, color: "#1e293b" }}>{file.filename}</div>
                              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>
                                {file.extension}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              display: "inline-block",
                            }}
                          >
                            {file.category}
                          </span>
                        </td>

                        {/* Storage Key */}
                        <td style={{ padding: "14px 16px", color: "#64748b", fontFamily: "monospace", fontSize: "12.5px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ wordBreak: "break-all" }}>{file.key}</span>
                            <button
                              onClick={() => handleCopyKey(file.key)}
                              title="Copiar caminho"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                color: "#94a3b8",
                                padding: "2px 4px",
                              }}
                            >
                              📋
                            </button>
                          </div>
                        </td>

                        {/* File Size */}
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "#334155" }}>
                          {file.sizeFormatted}
                        </td>

                        {/* Last Modified */}
                        <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "12.5px" }}>
                          {new Date(file.lastModified).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            {isPreviewable && (
                              <button
                                onClick={() => handlePreview(file)}
                                style={{
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  color: "#334155",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                👁️ Visualizar
                              </button>
                            )}

                            <a
                              href={file.downloadUrl}
                              download={file.filename}
                              style={{
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#ffffff",
                                textDecoration: "none",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              ⬇️ Baixar
                            </a>
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

      {/* File Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              color: "#f8fafc",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
                  📄 {previewFile.filename}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>
                  {previewFile.key} ({previewFile.sizeFormatted})
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <a
                  href={previewFile.downloadUrl}
                  download={previewFile.filename}
                  style={{
                    background: "#10b981",
                    color: "#ffffff",
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  ⬇️ Baixar
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                background: "#0f172a",
              }}
            >
              {previewLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  🔄 Carregando pré-visualização...
                </div>
              ) : (
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "Consolas, Monaco, monospace",
                    fontSize: "12.5px",
                    lineHeight: 1.5,
                    color: "#38bdf8",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
