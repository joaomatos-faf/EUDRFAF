"use client";

import { useState, useMemo } from "react";
import type { ContractRecord } from "@/app/lib/contractStore";

interface ContractListProps {
  contracts: ContractRecord[];
  onEdit: (contract: ContractRecord) => void;
  onDelete: (id: string) => void;
  onDownload: (key: string) => void;
  downloadingKey: string | null;
}

export function ContractList({
  contracts,
  onEdit,
  onDelete,
  onDownload,
  downloadingKey,
}: ContractListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return contracts;
    
    const query = searchQuery.toLowerCase();
    return contracts.filter((c) => {
      const matchClient = c.clientName.toLowerCase().includes(query);
      const matchCode = c.contractCode.toLowerCase().includes(query);
      const matchPlots = c.lots.some(lot =>
        lot.plots?.some(plot =>
          plot.plotId?.toLowerCase().includes(query) ||
          plot.producer?.toLowerCase().includes(query) ||
          plot.supplier?.toLowerCase().includes(query) ||
          plot.farm?.toLowerCase().includes(query)
        )
      );
      
      return matchClient || matchCode || matchPlots;
    });
  }, [contracts, searchQuery]);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar contratos (cliente, código, talhões...)"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(52, 211, 153, 0.2)",
            background: "rgba(30, 41, 59, 0.6)",
            color: "#e2e8f0",
            fontSize: "13px",
          }}
        />
      </div>

      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
        {filteredContracts.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "13px",
            }}
          >
            {searchQuery ? "Nenhum contrato encontrado para a busca." : "Nenhum contrato salvo ainda."}
          </div>
        ) : (
          filteredContracts.map((c) => {
            const contractPlotsCount = c.lots.reduce(
              (total, lot) => total + (lot.plots?.length || 0),
              0
            );
            
            const contractTotalHectares = c.lots.reduce((total, lot) => {
              const lotSum = (lot.plots || []).reduce(
                (sum, p) => sum + (Number(p.hectares) || 0),
                0
              );
              return total + lotSum;
            }, 0);
            
            const firstPlotWithKey = (c.lots || [])
              .flatMap(lot => lot.plots || [])
              .find(plot => plot.sourceGeojsonKey);

            return (
              <div
                key={c.id}
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(52, 211, 153, 0.15)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#e2e8f0",
                      }}
                    >
                      {c.contractCode}
                    </h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                      {c.clientName}
                    </p>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "12px",
                      color: "#94a3b8",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>{contractPlotsCount}</strong> talhões
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>{contractTotalHectares.toFixed(2)}</strong> ha
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    style={{
                      padding: "6px 10px",
                      background: "rgba(59, 130, 246, 0.15)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      color: "#93c5fd",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Editar
                  </button>
                  
                  {firstPlotWithKey?.sourceGeojsonKey && (
                    <button
                      type="button"
                      onClick={() => onDownload(firstPlotWithKey.sourceGeojsonKey!)}
                      disabled={downloadingKey === firstPlotWithKey.sourceGeojsonKey}
                      style={{
                        padding: "6px 10px",
                        background: downloadingKey === firstPlotWithKey.sourceGeojsonKey
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(245, 158, 11, 0.15)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        color: downloadingKey === firstPlotWithKey.sourceGeojsonKey
                          ? "#fbbf24"
                          : "#fde68a",
                        borderRadius: "6px",
                        cursor: downloadingKey === firstPlotWithKey.sourceGeojsonKey ? "wait" : "pointer",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {downloadingKey === firstPlotWithKey.sourceGeojsonKey ? "Baixando..." : "Baixar ZIP"}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    style={{
                      padding: "6px 10px",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#f87171",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
