"use client";

import { useState } from "react";
import type { DraftLotItem, DraftPlotItem } from "./types";
import { PlotAutocompleteInput } from "./PlotAutocompleteInput";
import type { PlotMasterRecord } from "@/app/lib/plotMasterData";

interface LotEditorProps {
  lot: DraftLotItem;
  lotIndex: number;
  plotMasterList: PlotMasterRecord[];
  onToggleCollapse: (index: number) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof Omit<DraftLotItem, "plots" | "isCollapsed">, value: string) => void;
  onAddPlot: (index: number) => void;
  onRemovePlot: (lotIndex: number, plotIndex: number) => void;
  onPlotIdChange: (lotIndex: number, plotIndex: number, value: string) => void;
  onSelectPlot: (lotIndex: number, plotIndex: number, plot: PlotMasterRecord) => void;
  onPlotFieldChange: (lotIndex: number, plotIndex: number, field: "producer" | "supplier" | "farm" | "hectares", value: string | number) => void;
  onAddMultiplePlots: (lotIdx: number, plotsToAdd: PlotMasterRecord[]) => void;
}

export function LotEditor({
  lot,
  lotIndex,
  plotMasterList,
  onToggleCollapse,
  onRemove,
  onChange,
  onAddPlot,
  onRemovePlot,
  onPlotIdChange,
  onSelectPlot,
  onPlotFieldChange,
  onAddMultiplePlots,
}: LotEditorProps) {
  const [batchSearch, setBatchSearch] = useState("");

  const handleBatchAdd = () => {
    if (!batchSearch.trim()) return;

    const searchTerm = batchSearch.toUpperCase().trim();
    const matchedPlots = plotMasterList.filter(plot => {
      const plotId = plot.plotId.toUpperCase();
      const producer = plot.producer.toUpperCase();
      const supplier = plot.supplier.toUpperCase();
      const farm = plot.farm.toUpperCase();

      return (
        plotId.includes(searchTerm) ||
        producer.includes(searchTerm) ||
        supplier.includes(searchTerm) ||
        farm.includes(searchTerm)
      );
    });

    if (matchedPlots.length > 0) {
      onAddMultiplePlots(lotIndex, matchedPlots);
    }
  };

  return (
    <div
      className={`lot-card ${lot.isCollapsed ? "collapsed" : "expanded"}`}
      style={{
        background: "rgba(30, 41, 59, 0.8)",
        border: "1px solid rgba(52, 211, 153, 0.2)",
        borderRadius: "12px",
        padding: "0",
        marginBottom: "16px",
        overflow: "hidden",
      }}
    >
      {/* Header do Lote */}
      <div
        style={{
          padding: "14px 18px",
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          borderBottom: lot.isCollapsed
            ? "1px solid rgba(52, 211, 153, 0.1)"
            : "none",
        }}
        onClick={() => onToggleCollapse(lotIndex)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(lotIndex);
            }}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
            }}
            title="Remover lote"
            disabled={lotIndex === 0}
          >
            ×
          </button>
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 700,
              color: "#e2e8f0",
            }}
          >
            {lot.lotNumber}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              background: "rgba(148, 163, 184, 0.15)",
              padding: "3px 8px",
              borderRadius: "20px",
            }}
          >
            {lot.plots.length} talhões
          </span>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#cbd5e1",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(lotIndex);
            }}
            title={lot.isCollapsed ? "Expandir" : "Recolher"}
          >
            {lot.isCollapsed ? "+" : "−"}
          </button>
        </div>
      </div>

      {/* Conteúdo colapsado */}
      {lot.isCollapsed && (
        <div style={{ padding: "12px 18px", background: "rgba(15, 23, 42, 0.3)" }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#94a3b8" }}>
            <strong>Região:</strong> {lot.region || "Não definida"}
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
            <strong>Total:</strong> {lot.plots.reduce((sum, p) => sum + p.hectares, 0).toFixed(2)} ha
          </p>
        </div>
      )}

      {/* Conteúdo expandido */}
      {!lot.isCollapsed && (
        <div style={{ padding: "16px 18px" }}>
          {/* Nome e região do lote */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <label>
              <small style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>
                Nome do lote
              </small>
              <input
                type="text"
                value={lot.lotNumber}
                onChange={(e) => onChange(lotIndex, "lotNumber", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  background: "rgba(30, 41, 59, 0.6)",
                  color: "#e2e8f0",
                  fontSize: "13px",
                }}
              />
            </label>
            <label>
              <small style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>
                Região
              </small>
              <input
                type="text"
                value={lot.region}
                onChange={(e) => onChange(lotIndex, "region", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  background: "rgba(30, 41, 59, 0.6)",
                  color: "#e2e8f0",
                  fontSize: "13px",
                }}
              />
            </label>
          </div>

          {/* Helper de adição em lote */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              padding: "12px",
              background: "rgba(15, 23, 42, 0.4)",
              borderRadius: "8px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              placeholder="Buscar no cadastro mestre (por código, produtor, fornecedor...)"
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(52, 211, 153, 0.2)",
                background: "rgba(30, 41, 59, 0.6)",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
            />
            <button
              type="button"
              onClick={handleBatchAdd}
              style={{
                padding: "8px 12px",
                background: "rgba(52, 211, 153, 0.15)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                color: "#34d399",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              + Adicionar
            </button>
          </div>

          {/* Lista de talhões */}
          <div style={{ marginBottom: "16px" }}>
            {lot.plots.map((plot, plotIndex) => (
              <div
                key={`${lotIndex}-${plotIndex}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "12px",
                  padding: "12px",
                  background: "rgba(15, 23, 42, 0.3)",
                  borderRadius: "8px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <small style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>
                    Código do Talhão *
                  </small>
                  <PlotAutocompleteInput
                    value={plot.plotId}
                    onChange={(value) => onPlotIdChange(lotIndex, plotIndex, value)}
                    onSelect={(p) => onSelectPlot(lotIndex, plotIndex, p)}
                    plotMasterList={plotMasterList}
                    placeholder="Ex: NAS-02..."
                  />
                </div>
                <div>
                  <small style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>
                    Produtor
                  </small>
                  <input
                    type="text"
                    value={plot.producer}
                    onChange={(e) => onPlotFieldChange(lotIndex, plotIndex, "producer", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                      background: "rgba(30, 41, 59, 0.6)",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div>
                  <small style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>
                    Fornecedor
                  </small>
                  <input
                    type="text"
                    value={plot.supplier}
                    onChange={(e) => onPlotFieldChange(lotIndex, plotIndex, "supplier", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                      background: "rgba(30, 41, 59, 0.6)",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div>
                  <small style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>
                    Fazenda
                  </small>
                  <input
                    type="text"
                    value={plot.farm}
                    onChange={(e) => onPlotFieldChange(lotIndex, plotIndex, "farm", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                      background: "rgba(30, 41, 59, 0.6)",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div>
                  <small style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>
                    Ha
                  </small>
                  <input
                    type="number"
                    value={plot.hectares || ""}
                    onChange={(e) => onPlotFieldChange(lotIndex, plotIndex, "hectares", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                      background: "rgba(30, 41, 59, 0.6)",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={() => onRemovePlot(lotIndex, plotIndex)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      padding: "4px",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#f87171",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                    }}
                    disabled={lot.plots.length === 1}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onAddPlot(lotIndex)}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              color: "#34d399",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            + Adicionar Talhão a este Lote
          </button>
        </div>
      )}
    </div>
  );
}
