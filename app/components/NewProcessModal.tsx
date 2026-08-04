"use client";

import React from "react";

interface NewProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFromScratch: () => void;
  onNextPlotSameSupplier: () => void;
  currentPlotId: string;
  currentSupplier: string;
  nextPlotIdPreview: string;
}

export function NewProcessModal({
  isOpen,
  onClose,
  onStartFromScratch,
  onNextPlotSameSupplier,
  currentPlotId,
  currentSupplier,
  nextPlotIdPreview,
}: NewProcessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 110,
        background: "rgba(16, 44, 36, 0.65)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "var(--forest-950)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>✨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16.5px", fontWeight: 700, color: "#fff" }}>
                Iniciar Novo Processo
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#b8c9c1" }}>
                Selecione como prefere organizar o próximo talhão.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              borderRadius: "8px",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Option 1: Same Supplier (Recommended) */}
          <div
            onClick={() => {
              onNextPlotSameSupplier();
              onClose();
            }}
            style={{
              border: "1.5px solid var(--forest-700)",
              borderRadius: "12px",
              padding: "16px 18px",
              background: "linear-gradient(180deg, #f3f8f5, #ffffff)",
              cursor: "pointer",
              transition: "transform 0.14s ease, box-shadow 0.14s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span
                style={{
                  background: "var(--forest-100)",
                  color: "var(--forest-900)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                }}
              >
                RECOMMENDED / MESMA FAZENDA
              </span>
              <span style={{ color: "var(--forest-700)", fontWeight: 700, fontSize: "12px" }}>
                {currentPlotId || "FAFDRAD-01"} ➔ {nextPlotIdPreview}
              </span>
            </div>
            <h4 style={{ margin: "4px 0 4px", color: "var(--forest-950)", fontSize: "14px", fontWeight: 750 }}>
              🔁 Próximo Talhão (Mesmo Fornecedor)
            </h4>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "11.5px", lineHeight: 1.45 }}>
              Mantém Fornecedor {currentSupplier ? `("${currentSupplier}")` : ""}, Fazenda, Produtor, CAR e Município. Avança o código do talhão para <strong>{nextPlotIdPreview}</strong> e limpa somente os arquivos e o MapBiomas.
            </p>
          </div>

          {/* Option 2: From Scratch */}
          <div
            onClick={() => {
              onStartFromScratch();
              onClose();
            }}
            style={{
              border: "1px solid var(--line-strong)",
              borderRadius: "12px",
              padding: "16px 18px",
              background: "#ffffff",
              cursor: "pointer",
              transition: "transform 0.14s ease, box-shadow 0.14s ease",
            }}
          >
            <h4 style={{ margin: "0 0 4px", color: "var(--forest-950)", fontSize: "14px", fontWeight: 750 }}>
              🆕 Novo Processo do Zero
            </h4>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "11.5px", lineHeight: 1.45 }}>
              Limpa <strong>todos</strong> os campos cadastrais e arquivos do processo anterior para começar um fornecedor ou região totalmente diferente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            background: "var(--canvas)",
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px",
              background: "#fff",
              border: "1px solid var(--line-strong)",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "12px",
              color: "var(--forest-950)",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
