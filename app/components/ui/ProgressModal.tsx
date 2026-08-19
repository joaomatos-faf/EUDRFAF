"use client";

import React from "react";
import { ExportStep } from "@/app/hooks/usePackageExporter";

interface ProgressModalProps {
  isOpen: boolean;
  step: ExportStep;
  message: string;
}

export function ProgressModal({ isOpen, step, message }: ProgressModalProps) {
  if (!isOpen || step === "idle") return null;

  const stepsList = [
    { key: "geojson", label: "GeoJSON WGS84" },
    { key: "shapefile", label: "Shapefile ESRI" },
    { key: "excel", label: "Planilha Produtor" },
    { key: "zip", label: "Compactação ZIP" },
    { key: "r2_upload", label: "Cloudflare R2" },
  ];

  const getStepStatus = (itemKey: string) => {
    const order = ["geojson", "shapefile", "excel", "zip", "r2_upload", "done"];
    const currentIndex = order.indexOf(step);
    const itemIndex = order.indexOf(itemKey);

    if (step === "error") return "error";
    if (step === "done" || currentIndex > itemIndex) return "completed";
    if (currentIndex === itemIndex) return "active";
    return "pending";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "20px",
          padding: "28px 24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: step === "error" ? "rgba(220,38,38,0.15)" : "rgba(185,28,28,0.15)",
              color: step === "error" ? "#ef4444" : "var(--brand-crimson)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
            }}
          >
            {step === "error" ? "✕" : step === "done" ? "✓" : "⚡"}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              {step === "done"
                ? "Processamento Concluído"
                : step === "error"
                ? "Falha na Operação"
                : "Processando Pacote EUDR..."}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>
              {message || "Aguarde enquanto os arquivos são gerados..."}
            </p>
          </div>
        </div>

        {/* Steps List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {stepsList.map((item) => {
            const status = getStepStatus(item.key);
            return (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: status === "active" ? "var(--bg-subtle)" : "transparent",
                  fontSize: "13px",
                  color:
                    status === "active"
                      ? "var(--brand-crimson)"
                      : status === "completed"
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  fontWeight: status === "active" ? 700 : 500,
                  transition: "all 0.2s ease",
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 700 }}>
                  {status === "completed" && "✓ Pronto"}
                  {status === "active" && "⏳ Processando..."}
                  {status === "pending" && "—"}
                  {status === "error" && "✕"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
