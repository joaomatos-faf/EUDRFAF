"use client";

import { useState, useEffect } from "react";
import { PublishedPlotRecord } from "@/app/lib/clientPortalStore";

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export default function ClientPortalModal({ isOpen, onClose, userEmail = "cliente@fafcoffees.com" }: ClientPortalModalProps) {
  const [plots, setPlots] = useState<PublishedPlotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractFilter, setContractFilter] = useState("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPlots = async () => {
    setLoading(true);
    try {
      const url = contractFilter !== "TODOS" ? `/api/r2/list?contractId=${encodeURIComponent(contractFilter)}` : "/api/r2/list";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPlots(data.plots || []);
      }
    } catch {
      setFeedback({ type: "error", text: "Não foi possível carregar a lista do portal." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlots();
    }
  }, [isOpen, contractFilter]);

  const handleDownload = async (key: string, filename: string) => {
    if (!key) {
      setFeedback({ type: "error", text: "Arquivo não disponível no Cloudflare R2." });
      return;
    }
    setDownloadingKey(key);
    setFeedback(null);
    try {
      const res = await fetch(`/api/r2/download?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        // Open download link in new tab or trigger download
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setFeedback({ type: "success", text: `Download do arquivo ${filename} iniciado com sucesso via Cloudflare R2!` });
      } else {
        throw new Error(data.error || "Erro ao obter URL de download.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao baixar arquivo.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setDownloadingKey(null);
    }
  };

  if (!isOpen) return null;

  const filteredPlots = plots.filter((plot) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      plot.plotId.toLowerCase().includes(q) ||
      plot.contractId.toLowerCase().includes(q) ||
      plot.producer.toLowerCase().includes(q) ||
      plot.farm.toLowerCase().includes(q) ||
      plot.municipality.toLowerCase().includes(q)
    );
  });

  const availableContracts = Array.from(new Set(plots.map((p) => p.contractId)));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1080px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.3)",
          border: "1px solid var(--line-strong)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--line-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(4px)",
                display: "grid",
                placeItems: "center",
                fontSize: "22px",
              }}
            >
              🌐
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#fff", fontWeight: 700, letterSpacing: "-0.3px" }}>
                Portal do Cliente & Downloads EUDR
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#c2e6d6" }}>
                Acesso seguro via Cloudflare R2 Storage • Logado como: <strong>{userEmail}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              fontSize: "18px",
              cursor: "pointer",
              color: "#fff",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: "12px 24px",
              background: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: feedback.type === "success" ? "#065f46" : "#991b1b",
              borderBottom: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
              fontSize: "13px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 600,
            }}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontSize: "14px" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Controls Bar */}
        <div
          style={{
            padding: "16px 28px",
            borderBottom: "1px solid var(--line-light)",
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            alignItems: "center",
            background: "#fdfefe",
          }}
        >
          <div style={{ flex: "1 1 280px" }}>
            <input
              type="text"
              placeholder="Buscar por talhão, contrato, produtor ou município…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px",
                fontSize: "13px",
                borderRadius: "10px",
                border: "1px solid var(--line-strong)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ flex: "0 0 200px" }}>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px",
                fontSize: "13px",
                borderRadius: "10px",
                border: "1px solid var(--line-strong)",
                background: "#fff",
                minHeight: "38px",
                fontWeight: 600,
              }}
            >
              <option value="TODOS">Todos Contratos ({plots.length})</option>
              {availableContracts.map((c) => (
                <option key={c} value={c}>
                  📋 Contrato {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Plots List Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {loading ? (
            <div style={{ padding: "40px 0", textContent: "center", color: "var(--muted)", textAlign: "center" }}>
              ⏳ Carregando dados do Cloudflare R2...
            </div>
          ) : filteredPlots.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📂</div>
              <h4 style={{ margin: 0, fontSize: "16px", color: "var(--forest-950)" }}>Nenhum talhão publicado encontrado</h4>
              <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                Os arquivos publicados para este contrato aparecerão automaticamente nesta lista.
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8faf9", borderBottom: "2px solid var(--line-light)", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", color: "var(--forest-950)", fontWeight: 700 }}>Código Talhão</th>
                  <th style={{ padding: "12px 14px", color: "var(--forest-950)", fontWeight: 700 }}>Contrato</th>
                  <th style={{ padding: "12px 14px", color: "var(--forest-950)", fontWeight: 700 }}>Produtor / Fazenda</th>
                  <th style={{ padding: "12px 14px", color: "var(--forest-950)", fontWeight: 700 }}>Município</th>
                  <th style={{ padding: "12px 14px", color: "var(--forest-950)", fontWeight: 700 }}>Área (ha)</th>
                  <th style={{ padding: "12px 14px", color: "var(--forest-950)", fontWeight: 700 }}>Status EUDR</th>
                  <th style={{ padding: "12px 14px", color: "var(--forest-950)", fontWeight: 700, textAlign: "right" }}>Downloads R2</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlots.map((plot) => (
                  <tr key={plot.id} style={{ borderBottom: "1px solid var(--line-light)" }}>
                    <td style={{ padding: "14px", fontWeight: 700, color: "var(--forest-950)" }}>{plot.plotId}</td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          background: "#eef2ff",
                          color: "#3730a3",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        {plot.contractId}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontWeight: 600 }}>{plot.producer}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{plot.farm}</div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      {plot.municipality} - {plot.state}
                    </td>
                    <td style={{ padding: "14px", fontWeight: 600 }}>{plot.area.toFixed(2)} ha</td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          background: plot.compliance === "CONFORME" ? "#ecfdf5" : "#fff7ed",
                          color: plot.compliance === "CONFORME" ? "#065f46" : "#c2410c",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: `1px solid ${plot.compliance === "CONFORME" ? "#a7f3d0" : "#fed7aa"}`,
                        }}
                      >
                        {plot.compliance === "CONFORME" ? "✓ CONFORME" : "⚠️ EM ANÁLISE"}
                      </span>
                    </td>
                    <td style={{ padding: "14px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleDownload(plot.geojsonKey, `${plot.plotId}.geojson`)}
                          disabled={downloadingKey === plot.geojsonKey}
                          style={{
                            padding: "6px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "8px",
                            border: "1px solid var(--forest-900)",
                            background: "var(--forest-900)",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          🌐 GeoJSON
                        </button>

                        <button
                          onClick={() => handleDownload(plot.xlsxKey, `${plot.plotId}-cadastro.xlsx`)}
                          disabled={downloadingKey === plot.xlsxKey}
                          style={{
                            padding: "6px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "8px",
                            border: "1px solid #15803d",
                            background: "#166534",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          📊 Excel
                        </button>

                        <button
                          onClick={() => handleDownload(plot.shapeKey, `${plot.plotId}-shapefile.zip`)}
                          disabled={downloadingKey === plot.shapeKey}
                          style={{
                            padding: "6px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "8px",
                            border: "1px solid #0369a1",
                            background: "#075985",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          📦 Shape ZIP
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid var(--line-light)",
            background: "#fafcfb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            ⚡ Os downloads são servidos com links privados assinados diretamente da infraestrutura **Cloudflare R2**.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid var(--line-strong)",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Fechar Portal
          </button>
        </div>
      </div>
    </div>
  );
}
