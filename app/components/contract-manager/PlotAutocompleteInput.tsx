"use client";

import { useState, useEffect, useRef } from "react";
import type { PlotMasterRecord } from "@/app/lib/plotMasterData";

interface PlotAutocompleteInputProps {
  value: string;
  onChange: (plotId: string) => void;
  onSelect: (plot: PlotMasterRecord) => void;
  plotMasterList: PlotMasterRecord[];
  placeholder?: string;
}

export function PlotAutocompleteInput({
  value,
  onChange,
  onSelect,
  plotMasterList,
  placeholder,
}: PlotAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toUpperCase();
  const normQuery = query.replace(/[^A-Z0-9]/g, "");

  const exactMatch = plotMasterList.find(
    (p) =>
      p.plotId.toUpperCase() === query ||
      p.plotId.replace(/[^A-Z0-9]/g, "") === normQuery
  );

  const filteredPlots = query
    ? plotMasterList.filter((p) => {
        const pId = (p.plotId || "").toUpperCase();
        const producer = (p.producer || "").toUpperCase();
        const supplier = (p.supplier || "").toUpperCase();
        const farm = (p.farm || "").toUpperCase();
        const normP = pId.replace(/[^A-Z0-9]/g, "");

        return (
          pId.includes(query) ||
          (normQuery.length > 0 && normP.includes(normQuery)) ||
          producer.includes(query) ||
          supplier.includes(query) ||
          farm.includes(query)
        );
      })
    : plotMasterList.slice(0, 8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOption = (p: PlotMasterRecord) => {
    onSelect(p);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setIsOpen(true);
        }}
        onFocus={() => {
          if (!exactMatch || value !== exactMatch.plotId) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder || "Ex: NAS-02, P2401..."}
        required
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: "8px",
          border: exactMatch
            ? "1.5px solid #10b981"
            : "1px solid rgba(52, 211, 153, 0.3)",
          fontSize: "13px",
          fontWeight: 700,
          background: exactMatch
            ? "rgba(16, 185, 129, 0.08)"
            : "rgba(255,255,255,0.03)",
          color: "#fff",
          outline: "none",
          transition: "all 0.18s",
        }}
      />
      {isOpen && filteredPlots.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#1a1f2e",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            borderRadius: "8px",
            maxHeight: "280px",
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {filteredPlots.map((p, idx) => (
            <button
              key={`${p.plotId}-${idx}`}
              type="button"
              onClick={() => handleSelectOption(p)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                borderBottom:
                  idx < filteredPlots.length - 1
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "none",
                color: "#fff",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "12.5px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(52, 211, 153, 0.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <strong style={{ fontSize: "13px", color: "#34d399" }}>
                {p.plotId}
              </strong>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                {p.producer}
                {p.supplier ? ` · ${p.supplier}` : ""}
                {p.farm ? ` · ${p.farm}` : ""}
              </span>
              {p.hectares > 0 && (
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {p.hectares.toFixed(2)} ha
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {isOpen && query && filteredPlots.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#1a1f2e",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            color: "#f87171",
            fontSize: "12px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          Nenhum talhão encontrado para "{query}"
        </div>
      )}
    </div>
  );
}
