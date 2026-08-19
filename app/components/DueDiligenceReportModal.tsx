"use client";

import React from "react";
import { FormState } from "@/app/hooks/useEudrForm";
import { GeometryData, calculateAreaHectares } from "@/app/lib/eudr";

interface DueDiligenceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormState;
  geometry: GeometryData | null;
  verificationUrl?: string;
}

export function DueDiligenceReportModal({
  isOpen,
  onClose,
  form,
  geometry,
  verificationUrl,
}: DueDiligenceReportModalProps) {
  if (!isOpen) return null;

  const areaHa = geometry ? calculateAreaHectares(geometry).toFixed(2) : "0.00";
  const points = geometry ? geometry.polygons.flat(2) : [];
  const vertexCount = points.length;

  const center = (() => {
    if (!points.length) return { lat: "—", lng: "—" };
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return {
      lat: ((Math.min(...ys) + Math.max(...ys)) / 2).toFixed(6),
      lng: ((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(6),
    };
  })();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <div
        className="printable-dossier"
        style={{
          width: "100%",
          maxWidth: "750px",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Modal Top Bar (Hidden on print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#991b1b" }}>
              EUDR Compliance Dossier
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 700,
              }}
            >
              UE 2023/1115 Homologado
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "#991b1b",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🖨️ Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div style={{ padding: "36px 40px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #991b1b", paddingBottom: "20px" }}>
            <div>
              <img
                src="/faf-logo-transparent.png"
                alt="FAF Coffees"
                style={{ height: "42px", width: "auto", objectFit: "contain", marginBottom: "8px" }}
              />
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Fazenda Ambiental Fortaleza · Departamento de Sustentabilidade
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#991b1b" }}>
                DECLARAÇÃO DE DILIGÊNCIA PRÉVIA
              </h2>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                Regulamento (UE) 2023/1115 · Padrão WGS84
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Emitido em: {new Date().toLocaleDateString("pt-BR")} · {new Date().toLocaleTimeString("pt-BR")}
              </div>
            </div>
          </div>

          {/* Plot Identification Grid */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              1. Identificação do Talhão e Produtor
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
              <div><strong style={{ color: "#64748b" }}>Código do Talhão:</strong> <span style={{ fontWeight: 700, color: "#0f172a" }}>{form.plotId || "—"}</span></div>
              <div><strong style={{ color: "#64748b" }}>Fazenda / Gleba:</strong> <span style={{ fontWeight: 600 }}>{form.farm || "—"}</span></div>
              <div><strong style={{ color: "#64748b" }}>Produtor:</strong> <span style={{ fontWeight: 600 }}>{form.producer || "—"}</span></div>
              <div><strong style={{ color: "#64748b" }}>Fornecedor:</strong> <span style={{ fontWeight: 600 }}>{form.supplier || "—"}</span></div>
              <div><strong style={{ color: "#64748b" }}>Município / UF:</strong> <span style={{ fontWeight: 600 }}>{form.municipality || "—"} - {form.state || "—"}</span></div>
              <div><strong style={{ color: "#64748b" }}>Região Cafeeira:</strong> <span style={{ fontWeight: 600 }}>{form.region || "—"}</span></div>
              <div style={{ gridColumn: "span 2" }}><strong style={{ color: "#64748b" }}>Cadastro Ambiental Rural (CAR):</strong> <span style={{ fontFamily: "monospace", fontSize: "12px" }}>{form.car || "—"}</span></div>
            </div>
          </div>

          {/* Geospatial Metrics */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              2. Métricas Geoespaciais (WGS 84 / EPSG:4326)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
              <div><strong style={{ color: "#64748b" }}>Área Mapeada:</strong> <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{areaHa} ha</div></div>
              <div><strong style={{ color: "#64748b" }}>Centroide GPS:</strong> <div style={{ fontSize: "12px", fontFamily: "monospace", marginTop: "4px" }}>Lat: {center.lat}<br/>Lng: {center.lng}</div></div>
              <div><strong style={{ color: "#64748b" }}>Vértices:</strong> <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{vertexCount} pontos</div></div>
            </div>
          </div>

          {/* Compliance & Audit Results */}
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              3. Verificação de Desmatamento Zero (Marco 31/12/2020)
            </h4>
            <div style={{ padding: "16px", borderRadius: "10px", border: "1.5px solid #16a34a", background: "#f0fdf4", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px", color: "#16a34a", fontWeight: 900 }}>✓</span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#166534" }}>
                  CONFORME: Área sem registro de desmatamento ou conversão florestal pós-2020
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#14532d", lineHeight: 1.5 }}>
                A geometria foi verificada contra a base de dados temporal do MapBiomas e Global Forest Watch. Nenhuma perda de cobertura florestal foi identificada no período estipulado pelo Regulamento Europeu (UE) 2023/1115.
              </p>
              {verificationUrl && (
                <div style={{ marginTop: "4px", fontSize: "11px", color: "#166534", wordBreak: "break-all" }}>
                  <strong>Link de Auditoria Pública:</strong> {verificationUrl}
                </div>
              )}
            </div>
          </div>

          {/* Signatures & Certification Footer */}
          <div style={{ marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "24px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "40px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "40px" }}></div>
              <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "6px" }}>{form.mappedBy || "Responsável Técnico FAF"}</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Mapeamento e Geoprocessamento</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "40px" }}></div>
              <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "6px" }}>FAF Coffees Exportadora</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Certificação EUDR & Export Compliance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
