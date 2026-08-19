"use client";

import { useState } from "react";
import { ClientSelectAutocomplete } from "../ClientSelectAutocomplete";
import { LotEditor } from "./LotEditor";
import type { DraftLotItem } from "./types";
import type { PlotMasterRecord } from "@/app/lib/plotMasterData";
import type { ContractRecord } from "@/app/lib/contractStore";

interface ContractFormProps {
  lots: DraftLotItem[];
  contractCode: string;
  clientName: string;
  grandTotalHectares: number;
  totalPlotsCount: number;
  isSaving: boolean;
  editingContractId: string | null;
  plotMasterList: PlotMasterRecord[];
  contracts: ContractRecord[];
  loggedUserKey?: string;
  lotsContainerRef: React.RefObject<HTMLDivElement | null>;
  onContractCodeChange: (value: string) => void;
  onClientNameChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddLot: () => void;
  onToggleCollapseLot: (index: number) => void;
  onRemoveLot: (index: number) => void;
  onLotChange: (index: number, field: keyof Omit<DraftLotItem, "plots" | "isCollapsed">, value: string) => void;
  onAddPlotToLot: (lotIndex: number) => void;
  onRemovePlotFromLot: (lotIndex: number, plotIndex: number) => void;
  onPlotIdChange: (lotIndex: number, plotIndex: number, value: string) => void;
  onSelectPlot: (lotIndex: number, plotIndex: number, plot: PlotMasterRecord) => void;
  onPlotFieldChange: (lotIndex: number, plotIndex: number, field: "producer" | "supplier" | "farm" | "hectares", value: string | number) => void;
  onAddMultiplePlotsToLot: (lotIdx: number, plotsToAdd: PlotMasterRecord[]) => void;
}

export function ContractForm({
  lots,
  contractCode,
  clientName,
  grandTotalHectares,
  totalPlotsCount,
  isSaving,
  editingContractId,
  plotMasterList,
  contracts,
  loggedUserKey = "usuario",
  lotsContainerRef,
  onContractCodeChange,
  onClientNameChange,
  onSave,
  onCancel,
  onAddLot,
  onToggleCollapseLot,
  onRemoveLot,
  onLotChange,
  onAddPlotToLot,
  onRemovePlotFromLot,
  onPlotIdChange,
  onSelectPlot,
  onPlotFieldChange,
  onAddMultiplePlotsToLot,
}: ContractFormProps) {
  const isContractCodeDuplicate =
    !editingContractId && contractCode.trim()
      ? contracts.some(
          (c) =>
            c.contractCode.trim().toUpperCase() ===
            contractCode.trim().toUpperCase()
        )
      : false;

  return (
    <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", padding: "24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <label>
          <small style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "12px" }}>
            Cliente *
          </small>
          <ClientSelectAutocomplete
            value={clientName}
            onChange={onClientNameChange}
            placeholder="Selecione o cliente..."
          />
        </label>
        <label>
          <small style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "12px" }}>
            Código do Contrato *
          </small>
          <input
            type="text"
            value={contractCode}
            onChange={(e) => onContractCodeChange(e.target.value.toUpperCase())}
            placeholder="Ex: FAF-CA-2026-001"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: isContractCodeDuplicate
                ? "1.5px solid #f87171"
                : "1px solid rgba(52, 211, 153, 0.3)",
              background: "rgba(30, 41, 59, 0.6)",
              color: "#e2e8f0",
              fontSize: "13px",
              fontWeight: 700,
            }}
          />
          {isContractCodeDuplicate && (
            <small style={{ color: "#f87171", fontSize: "11px", display: "block", marginTop: "4px" }}>
              ⚠️ Código já existe. Informe um código diferente.
            </small>
          )}
        </label>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "rgba(30, 41, 59, 0.5)",
          borderRadius: "12px",
          marginBottom: "24px",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
            <strong>{lots.length}</strong> lotes · <strong>{totalPlotsCount}</strong> talhões
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
            Total de área
          </p>
          <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#34d399" }}>
            {grandTotalHectares.toFixed(2)} ha
          </p>
        </div>
      </div>

      <div ref={lotsContainerRef} style={{ marginBottom: "24px" }}>
        {lots.map((lot, index) => (
          <LotEditor
            key={`${lot.lotNumber}-${index}`}
            lot={lot}
            lotIndex={index}
            plotMasterList={plotMasterList}
            onToggleCollapse={onToggleCollapseLot}
            onRemove={onRemoveLot}
            onChange={onLotChange}
            onAddPlot={onAddPlotToLot}
            onRemovePlot={onRemovePlotFromLot}
            onPlotIdChange={onPlotIdChange}
            onSelectPlot={onSelectPlot}
            onPlotFieldChange={onPlotFieldChange}
            onAddMultiplePlots={onAddMultiplePlotsToLot}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={onAddLot}
          style={{
            flex: 1,
            padding: "12px",
            background: "rgba(52, 211, 153, 0.1)",
            border: "1px solid rgba(52, 211, 153, 0.2)",
            color: "#34d399",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          + Adicionar Lote
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          onClick={onSave}
          disabled={isSaving}
          style={{
            padding: "12px 20px",
            background: isSaving
              ? "rgba(52, 211, 153, 0.2)"
              : "rgba(52, 211, 153, 0.15)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            color: isSaving ? "#94a3b8" : "#34d399",
            borderRadius: "8px",
            cursor: isSaving ? "wait" : "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {isSaving ? "Salvando..." : editingContractId ? "Atualizar" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
