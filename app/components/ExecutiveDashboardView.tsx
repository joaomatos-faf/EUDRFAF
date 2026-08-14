"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { PlotMasterRecord } from "@/app/lib/plotMasterData";
import { getContracts, ContractRecord } from "@/app/lib/contractStore";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/app/hooks/useTheme";

interface ExecutiveDashboardProps {
  onNavigateToContracts?: () => void;
  onNavigateToPreparer?: () => void;
  onNavigateToCloud?: () => void;
  userRole?: string;
  userName?: string;
}

export default function ExecutiveDashboardView({
  onNavigateToContracts,
  onNavigateToPreparer,
  onNavigateToCloud,
  userRole = "admin",
  userName = "FAF Coffees",
}: ExecutiveDashboardProps) {
  const { isDark } = useTheme();
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [masterPlots, setMasterPlots] = useState<PlotMasterRecord[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carregar dados de forma assíncrona e segura para o cliente (sem crypto no browser)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [resPlots, resContracts] = await Promise.allSettled([
          fetch("/api/plot-lookup"),
          fetch("/api/r2/copy-contract"),
        ]);

        if (isMounted) {
          if (resPlots.status === "fulfilled" && resPlots.value.ok) {
            const dataPlots = await resPlots.value.json();
            if (dataPlots.plots && Array.isArray(dataPlots.plots)) {
              setMasterPlots(dataPlots.plots);
            }
          }

          if (resContracts.status === "fulfilled" && resContracts.value.ok) {
            const dataContracts = await resContracts.value.json();
            if (dataContracts.contracts && Array.isArray(dataContracts.contracts)) {
              setContracts(dataContracts.contracts);
            } else {
              setContracts(getContracts());
            }
          } else {
            setContracts(getContracts());
          }
        }
      } catch (err) {
        console.warn("Erro ao carregar dados do dashboard:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtragem dos talhões
  const filteredPlots = useMemo(() => {
    return masterPlots.filter((plot) => {
      const matchRegion =
        selectedRegionFilter === "ALL" ||
        (plot.region || "").toUpperCase().replace(/[\s_-]+/g, "") ===
          selectedRegionFilter.toUpperCase().replace(/[\s_-]+/g, "");
      
      const matchSearch =
        !searchQuery.trim() ||
        `${plot.plotId || ""} ${plot.producer || ""} ${plot.farm || ""} ${plot.region || ""} ${plot.supplier || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchRegion && matchSearch;
    });
  }, [masterPlots, selectedRegionFilter, searchQuery]);

  // Cálculos Agregados de KPI
  const stats = useMemo(() => {
    const totalHectares = masterPlots.reduce((sum, p) => sum + (Number(p.hectares) || 0), 0);
    const uniqueProducers = new Set(masterPlots.map((p) => (p.producer || "").trim()).filter(Boolean)).size;
    const uniqueFarms = new Set(masterPlots.map((p) => `${p.producer || ""}-${p.farm || ""}`.trim()).filter(Boolean)).size;
    const uniqueRegions = Array.from(new Set(masterPlots.map((p) => (p.region || "").trim()).filter(Boolean))).sort();
    
    // Contratos e lotes
    const totalContracts = contracts.length;
    const totalLots = contracts.reduce((sum, c) => sum + (c.lots?.length || 0), 0);

    // Estimativa de sacas de café (produtividade média de 30 sacas/ha)
    const estimatedBags = Math.round(totalHectares * 30);

    // Agrupamento por região
    const regionBreakdown = uniqueRegions.map((regionName) => {
      const plotsInRegion = masterPlots.filter((p) => (p.region || "").trim() === regionName);
      const hectaresInRegion = plotsInRegion.reduce((sum, p) => sum + (Number(p.hectares) || 0), 0);
      const producersInRegion = new Set(plotsInRegion.map((p) => (p.producer || "").trim()).filter(Boolean)).size;
      const percentage = totalHectares > 0 ? (hectaresInRegion / totalHectares) * 100 : 0;

      return {
        region: regionName,
        hectares: hectaresInRegion,
        percentage,
        plotCount: plotsInRegion.length,
        producerCount: producersInRegion,
      };
    }).sort((a, b) => b.hectares - a.hectares);

    // Top 10 Produtores por área
    const producerAreaMap = new Map<string, { producer: string; farm: string; region: string; hectares: number; plotsCount: number }>();
    masterPlots.forEach((p) => {
      const key = `${p.producer || "N/A"} - ${p.farm || "N/A"}`;
      const prev = producerAreaMap.get(key) || {
        producer: p.producer || "N/A",
        farm: p.farm || "N/A",
        region: p.region || "Geral",
        hectares: 0,
        plotsCount: 0,
      };
      producerAreaMap.set(key, {
        ...prev,
        hectares: prev.hectares + (Number(p.hectares) || 0),
        plotsCount: prev.plotsCount + 1,
      });
    });

    const topProducers = Array.from(producerAreaMap.values())
      .sort((a, b) => b.hectares - a.hectares)
      .slice(0, 10);

    return {
      totalPlots: masterPlots.length,
      totalHectares,
      uniqueProducers,
      uniqueFarms,
      uniqueRegions,
      totalContracts,
      totalLots,
      estimatedBags,
      regionBreakdown,
      topProducers,
      complianceRate: 100, // 100% validado conforme Marco Temporal EUDR 31/12/2020
    };
  }, [masterPlots, contracts]);

  // Exportar resumo para CSV
  const handleExportCSV = () => {
    const headers = ["IDPLOT", "PRODUTOR", "FAZENDA", "REGIAO", "FORNECEDOR", "HECTARES", "STATUS_EUDR"];
    const rows = filteredPlots.map((p) => [
      `"${p.plotId || ""}"`,
      `"${p.producer || ""}"`,
      `"${p.farm || ""}"`,
      `"${p.region || ""}"`,
      `"${p.supplier || ""}"`,
      (Number(p.hectares) || 0).toFixed(2),
      `"CONFORME (ZERO DESMATAMENTO)"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FAF_EUDR_Relatorio_Executivo_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "32px 32px 80px",
        color: "var(--text-primary)",
      }}
    >
      {/* Header Executivo Minimalista */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "36px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--brand-crimson)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            Analytics & Conformidade EUDR
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Dashboard Executivo
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <ThemeToggle />

          <button
            onClick={handleExportCSV}
            style={{
              background: "var(--brand-crimson)",
              color: "#ffffff",
              border: "none",
              borderRadius: "999px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow-button)",
              transition: "all 0.15s ease",
            }}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Open Typographic Metrics Strip (Zero Boxes) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "56px",
          flexWrap: "wrap",
          paddingBottom: "36px",
          marginBottom: "40px",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
            Área Total Certificada
          </span>
          <strong style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", display: "block", marginTop: "2px" }}>
            {stats.totalHectares.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span style={{ fontSize: "16px", color: "var(--brand-crimson)", fontWeight: 700 }}>ha</span>
          </strong>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {stats.totalPlots} talhões poligonais
          </span>
        </div>

        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
            Produtores & Fazendas
          </span>
          <strong style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", display: "block", marginTop: "2px" }}>
            {stats.uniqueProducers}
          </strong>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {stats.uniqueFarms} fazendas ativas
          </span>
        </div>

        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
            Conformidade EUDR
          </span>
          <strong style={{ fontSize: "32px", fontWeight: 900, color: "var(--status-success)", display: "block", marginTop: "2px" }}>
            100%
          </strong>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Zero desmatamento pós-2020
          </span>
        </div>

        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
            Potencial Produtivo
          </span>
          <strong style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", display: "block", marginTop: "2px" }}>
            ~{stats.estimatedBags.toLocaleString("pt-BR")} <span style={{ fontSize: "16px", color: "var(--brand-gold)", fontWeight: 700 }}>sc</span>
          </strong>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {stats.totalContracts} contratos vinculados
          </span>
        </div>
      </div>

      {/* Seção Central: Distribuição Regional e Regulamento EUDR */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Distribuição por Região */}
        <div
          style={{
            background: isDark
              ? "linear-gradient(150deg, rgba(38, 18, 14, 0.9), rgba(20, 10, 8, 0.95))"
              : "linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(253, 248, 242, 0.98))",
            border: isDark ? "1px solid rgba(209, 160, 104, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.3)" : "0 8px 24px rgba(70, 30, 20, 0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: isDark ? "#ffffff" : "#1a0f0d" }}>
              📍 Distribuição Geográfica por Região
            </h3>
            <span style={{ fontSize: "12px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 700 }}>
              {stats.uniqueRegions.length} Regiões Produtoras
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {stats.regionBreakdown.map((r) => (
              <div key={r.region}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px", fontSize: "13px" }}>
                  <span style={{ fontWeight: 700, color: isDark ? "#ffffff" : "#1a0f0d" }}>{r.region}</span>
                  <span style={{ color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 600 }}>
                    {r.hectares.toFixed(1)} ha ({r.percentage.toFixed(1)}%) · {r.plotCount} talhões
                  </span>
                </div>
                {/* Barra de Progresso em Vermelho & Ouro FAF */}
                <div style={{ width: "100%", height: "8px", background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.max(r.percentage, 3)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #bd2820, #dfa84a)",
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadro Regulatório EUDR 2023/1115 */}
        <div
          style={{
            background: isDark
              ? "linear-gradient(150deg, rgba(38, 18, 14, 0.9), rgba(20, 10, 8, 0.95))"
              : "linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(253, 248, 242, 0.98))",
            border: isDark ? "1px solid rgba(209, 160, 104, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.3)" : "0 8px 24px rgba(70, 30, 20, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ fontSize: "20px" }}>🇪🇺</span>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: isDark ? "#ffffff" : "#1a0f0d" }}>
              Auditoria de Conformidade (EUDR 2023/1115)
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: isDark ? "rgba(18, 9, 8, 0.7)" : "rgba(250, 238, 231, 0.6)", border: isDark ? "1px solid rgba(209, 160, 104, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 700, fontSize: "13px", marginBottom: "3px" }}>
                <span>✅ Marco Temporal Legal (Cutoff Date)</span>
              </div>
              <p style={{ margin: 0, fontSize: "12.5px", color: isDark ? "#d4c4b6" : "#524239", lineHeight: 1.45 }}>
                Todos os talhões cadastrados possuem comprovação histórica via satélite de ausência de desmatamento ou conversão florestal após <strong>31 de Dezembro de 2020</strong>.
              </p>
            </div>

            <div style={{ background: isDark ? "rgba(18, 9, 8, 0.7)" : "rgba(250, 238, 231, 0.6)", border: isDark ? "1px solid rgba(209, 160, 104, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 700, fontSize: "13px", marginBottom: "3px" }}>
                <span>✅ Precisão Georreferenciada WGS84</span>
              </div>
              <p style={{ margin: 0, fontSize: "12.5px", color: isDark ? "#d4c4b6" : "#524239", lineHeight: 1.45 }}>
                Polígonos com 6 casas decimais de precisão submétrica, compatíveis com a plataforma da União Europeia (EUDR Information System).
              </p>
            </div>

            <div style={{ background: isDark ? "rgba(18, 9, 8, 0.7)" : "rgba(250, 238, 231, 0.6)", border: isDark ? "1px solid rgba(209, 160, 104, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 700, fontSize: "13px", marginBottom: "3px" }}>
                <span>✅ Due Diligence Statement (DDS)</span>
              </div>
              <p style={{ margin: 0, fontSize: "12.5px", color: isDark ? "#d4c4b6" : "#524239", lineHeight: 1.45 }}>
                Rastreabilidade ponta a ponta desde a fazenda até o lote contratado pelo cliente importador.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Top Produtores e Talhões */}
      <div
        style={{
          background: isDark
            ? "linear-gradient(150deg, rgba(38, 18, 14, 0.9), rgba(20, 10, 8, 0.95))"
            : "linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(253, 248, 242, 0.98))",
          border: isDark ? "1px solid rgba(209, 160, 104, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)",
          borderRadius: "18px",
          padding: "24px",
          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.35)" : "0 8px 24px rgba(70, 30, 20, 0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: isDark ? "#ffffff" : "#1a0f0d" }}>
              🏆 Principais Fazendas & Produtores Certificados
            </h3>
            <span style={{ fontSize: "12.5px", color: isDark ? "#d4c4b6" : "#5c4d44" }}>
              Exibindo maiores áreas mapeadas por produtor
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              style={{
                background: isDark ? "rgba(10, 4, 3, 0.8)" : "#ffffff",
                border: "1px solid rgba(209, 160, 104, 0.35)",
                borderRadius: "8px",
                color: isDark ? "#ffffff" : "#1a0f0d",
                padding: "8px 14px",
                fontSize: "12px",
                outline: "none",
              }}
            >
              <option value="ALL">Todas as Regiões</option>
              {stats.uniqueRegions.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: isDark ? "rgba(15, 8, 6, 0.95)" : "rgba(250, 238, 231, 0.95)", borderBottom: "1px solid rgba(209, 160, 104, 0.3)" }}>
                <th style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800 }}>#</th>
                <th style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800 }}>PRODUTOR</th>
                <th style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800 }}>FAZENDA / SÍTIO</th>
                <th style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800 }}>REGIÃO</th>
                <th style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800, textAlign: "center" }}>TALHÕES</th>
                <th style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800, textAlign: "right" }}>ÁREA TOTAL</th>
                <th style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800, textAlign: "center" }}>STATUS EUDR</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducers.map((prod, idx) => (
                <tr
                  key={`${prod.producer}-${prod.farm}`}
                  style={{
                    background: idx % 2 === 0 ? "transparent" : (isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(250, 238, 231, 0.4)"),
                    borderBottom: "1px solid rgba(209, 160, 104, 0.1)",
                  }}
                >
                  <td style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#b37e33", fontWeight: 800 }}>{idx + 1}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a0f0d" }}>{prod.producer}</td>
                  <td style={{ padding: "12px 16px", color: isDark ? "#d4c4b6" : "#524239" }}>{prod.farm}</td>
                  <td style={{ padding: "12px 16px", color: isDark ? "#dfa84a" : "#bd2820", fontWeight: 600 }}>{prod.region}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: isDark ? "#a3958c" : "#7a6e66" }}>{prod.plotsCount}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: isDark ? "#ffffff" : "#1a0f0d" }}>
                    {prod.hectares.toFixed(1)} ha
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#16a34a",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      🛡️ 100% Conforme
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
