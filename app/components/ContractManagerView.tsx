"use client";

import React, { useState, useEffect, useRef } from "react";
import { ContractRecord } from "@/app/lib/contractStore";
import { PlotMasterRecord } from "@/app/lib/plotMasterData";

interface ContractManagerViewProps {
  onOpenLanding: () => void;
  loggedUserKey?: string;
}

interface DraftPlotItem {
  plotId: string;
  producer: string;
  supplier: string;
  farm: string;
  hectares: number;
}

interface DraftLotItem {
  lotNumber: string;
  region: string;
  plots: DraftPlotItem[];
}

// Componente de Autocomplete Customizado com Filtro em Tempo Real
interface PlotAutocompleteInputProps {
  value: string;
  onChange: (plotId: string) => void;
  onSelect: (plot: PlotMasterRecord) => void;
  plotMasterList: PlotMasterRecord[];
  placeholder?: string;
}

function PlotAutocompleteInput({ value, onChange, onSelect, plotMasterList, placeholder }: PlotAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toUpperCase();
  const normQuery = query.replace(/[^A-Z0-9]/g, "");

  // Verificar se o valor atual ja e exatamente um talhao cadastrado
  const exactMatch = plotMasterList.find(
    (p) => p.plotId.toUpperCase() === query || p.plotId.replace(/[^A-Z0-9]/g, "") === normQuery
  );

  // Filtragem estrita: mostra APENAS o que combina exatamente com o que foi digitado!
  const filteredPlots = query
    ? plotMasterList.filter((p) => {
        const pId = p.plotId.toUpperCase();
        const normP = pId.replace(/[^A-Z0-9]/g, "");
        return pId.includes(query) || normP.includes(normQuery);
      })
    : plotMasterList.slice(0, 8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
          const newVal = e.target.value;
          onChange(newVal);
          setIsOpen(true);
        }}
        onFocus={() => {
          // Se ainda nao tiver selecionado um talhao exato, exibe o menu
          if (!exactMatch || value !== exactMatch.plotId) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder || "Ex: NAS-02, P2401..."}
        required
        style={{
          width: "100%",
          padding: "7px 9px",
          borderRadius: "6px",
          border: "1px solid #0284c7",
          fontSize: "12px",
          fontWeight: 800,
          background: "#f0f9ff",
          outline: "none",
        }}
      />

      {/* Menu Dropdown de Sugestoes: Largura Ampla (320px) e Z-Index Elevado (Nao corta na tela) */}
      {isOpen && filteredPlots.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "320px",
            maxWidth: "360px",
            zIndex: 9999,
            background: "#ffffff",
            border: "1px solid #0284c7",
            borderRadius: "10px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {filteredPlots.map((p, idx) => (
            <div
              key={`${p.plotId}-${idx}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Evita que o evento onBlur feche antes de processar o clique
                handleSelectOption(p);
              }}
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--forest-950)", display: "flex", justifyContent: "space-between" }}>
                <span>{p.plotId}</span>
                <span style={{ fontWeight: 700, color: "#0284c7", fontSize: "11px" }}>{p.hectares} ha</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--forest-900)", fontWeight: 600, marginTop: "2px" }}>
                Produtor: <strong>{p.producer}</strong>
              </div>
              <div style={{ fontSize: "10px", color: "#0369a1", fontWeight: 600 }}>
                Fornecedor: {p.supplier}
              </div>
              <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                Fazenda: {p.farm}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContractManagerView({ onOpenLanding, loggedUserKey = "joao.matos" }: ContractManagerViewProps) {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [plotMasterList, setPlotMasterList] = useState<PlotMasterRecord[]>([]);
  const [contractCode, setContractCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Iniciar TUDO em branco (zero mock data)
  const [lots, setLots] = useState<DraftLotItem[]>([
    {
      lotNumber: "LOTE 01",
      region: "",
      plots: [
        { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 },
      ],
    },
  ]);

  const loadContractsAndPlots = async () => {
    try {
      const resContracts = await fetch("/api/r2/copy-contract");
      if (resContracts.ok) {
        const dataContracts = await resContracts.json();
        if (dataContracts.contracts) setContracts(dataContracts.contracts);
      }

      const resPlots = await fetch("/api/plot-lookup");
      if (resPlots.ok) {
        const dataPlots = await resPlots.json();
        if (dataPlots.plots && dataPlots.plots.length > 0) {
          setPlotMasterList(dataPlots.plots);
        }
      }
    } catch {
      // Ignorar erros silenciosos de rede
    }
  };

  useEffect(() => {
    loadContractsAndPlots();
  }, []);

  const handleAddLot = () => {
    const nextLotNum = `LOTE ${String(lots.length + 1).padStart(2, "0")}`;
    setLots([
      ...lots,
      {
        lotNumber: nextLotNum,
        region: "",
        plots: [{ plotId: "", producer: "", supplier: "", farm: "", hectares: 0 }],
      },
    ]);
  };

  const handleRemoveLot = (index: number) => {
    if (lots.length === 1) return;
    setLots(lots.filter((_, i) => i !== index));
  };

  const handleLotChange = (index: number, field: keyof Omit<DraftLotItem, "plots">, value: string) => {
    const updated = [...lots];
    updated[index] = { ...updated[index], [field]: value };
    setLots(updated);
  };

  const handleAddPlotToLot = (lotIndex: number) => {
    const updated = [...lots];
    const lotPlots = updated[lotIndex].plots;
    updated[lotIndex].plots = [
      ...lotPlots,
      { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 },
    ];
    setLots(updated);
  };

  const handleRemovePlotFromLot = (lotIndex: number, plotIndex: number) => {
    const updated = [...lots];
    if (updated[lotIndex].plots.length === 1) return;
    updated[lotIndex].plots = updated[lotIndex].plots.filter((_, i) => i !== plotIndex);
    setLots(updated);
  };

  const handlePlotIdInputChange = (lotIndex: number, plotIndex: number, rawValue: string) => {
    const cleanId = rawValue.toUpperCase().trim();
    const normId = cleanId.replace(/[^A-Z0-9]/g, "");
    const updated = [...lots];

    if (!cleanId) {
      updated[lotIndex].plots[plotIndex] = {
        plotId: "",
        producer: "",
        supplier: "",
        farm: "",
        hectares: 0,
      };
      setLots(updated);
      return;
    }

    const matched = plotMasterList.find(
      (p) =>
        p.plotId.toUpperCase().trim() === cleanId ||
        p.plotId.replace(/[^A-Z0-9]/g, "") === normId
    );

    if (matched) {
      updated[lotIndex].plots[plotIndex] = {
        plotId: matched.plotId || cleanId,
        producer: matched.producer,
        supplier: matched.supplier,
        farm: matched.farm,
        hectares: matched.hectares,
      };
      if (matched.region && !updated[lotIndex].region) {
        updated[lotIndex].region = matched.region.toUpperCase();
      }
    } else {
      updated[lotIndex].plots[plotIndex] = {
        ...updated[lotIndex].plots[plotIndex],
        plotId: cleanId,
      };
    }

    setLots(updated);
  };

  const handleSelectPlotMaster = (lotIndex: number, plotIndex: number, plot: PlotMasterRecord) => {
    const updated = [...lots];
    updated[lotIndex].plots[plotIndex] = {
      plotId: plot.plotId,
      producer: plot.producer,
      supplier: plot.supplier,
      farm: plot.farm,
      hectares: plot.hectares,
    };

    if (plot.region && !updated[lotIndex].region) {
      updated[lotIndex].region = plot.region.toUpperCase();
    }

    setLots(updated);
  };

  const handlePlotFieldChange = (lotIndex: number, plotIndex: number, field: "producer" | "supplier" | "farm" | "hectares", value: any) => {
    const updated = [...lots];
    updated[lotIndex].plots[plotIndex] = {
      ...updated[lotIndex].plots[plotIndex],
      [field]: field === "hectares" ? parseFloat(value) || 0 : value,
    };
    setLots(updated);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractCode.trim() || !clientName.trim()) {
      alert("⚠️ Código do Contrato e Nome do Cliente são obrigatórios.");
      return;
    }

    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      if (!lot.plots || lot.plots.length === 0) {
        alert(`⚠️ Adicione ao menos 1 talhão ao Lote ${i + 1}.`);
        return;
      }
      for (let j = 0; j < lot.plots.length; j++) {
        if (!lot.plots[j].plotId.trim()) {
          alert(`⚠️ Preencha o Código do Talhão ${j + 1} no Lote ${i + 1}.`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // 1. Atualizar novos talhoes no servidor
      for (const lot of lots) {
        for (const p of lot.plots) {
          if (p.plotId.trim()) {
            await fetch("/api/plot-lookup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plotId: p.plotId,
                producer: p.producer,
                supplier: p.supplier,
                farm: p.farm,
                region: lot.region,
                hectares: p.hectares,
              }),
            });
          }
        }
      }

      // 2. Salvar contrato no R2
      const res = await fetch("/api/r2/copy-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractCode: contractCode.trim().toUpperCase(),
          clientName: clientName.trim(),
          lots,
          createdBy: loggedUserKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Contrato ${data.record.contractCode} criado com sucesso!\n\n${data.record.lots.length} lote(s) salvos no Cloudflare R2.`);
        setContractCode("");
        setClientName("");
        setLots([
          {
            lotNumber: "LOTE 01",
            region: "",
            plots: [{ plotId: "", producer: "", supplier: "", farm: "", hectares: 0 }],
          },
        ]);
        loadContractsAndPlots();
      } else {
        throw new Error(data.error || "Erro ao criar pacote do contrato.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar contrato.";
      alert(`⚠️ ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadGeoJson = async (key: string, filename: string) => {
    setDownloadingKey(key);
    try {
      const res = await fetch(`/api/r2/download?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(data.error || "Erro ao obter URL de download.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao baixar.";
      alert(`⚠️ ${msg}`);
    } finally {
      setDownloadingKey(null);
    }
  };

  // Soma Total dos Hectares de Todos os Lotes do Contrato
  const grandTotalHectares = lots.reduce((acc, lot) => {
    return acc + lot.plots.reduce((sum, p) => sum + (Number(p.hectares) || 0), 0);
  }, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        color: "var(--forest-950)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          background: "var(--surface-dark)",
          color: "#fff",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--line-dark)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="brand-mark" style={{ width: "42px", height: "42px", fontSize: "14px" }}>FAF</div>
          <div>
            <div style={{ fontSize: "10px", color: "#6ee7b7", fontWeight: 700, letterSpacing: "1px" }}>
              CONTRATOS.FAFEU.ONLINE
            </div>
            <h1 style={{ fontSize: "18px", margin: 0, fontWeight: 700, color: "#fff" }}>
              Gerenciador de Contratos & Banco Criptografado (AES-256)
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "20px", color: "#a7f3d0", fontWeight: 700 }}>
            🔒 {plotMasterList.length} Talhões Protegidos (AES-256)
          </span>
          <button
            onClick={onOpenLanding}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🏠 Início
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1380px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 0.65fr", gap: "32px" }}>
          {/* Coluna Esquerda: Formulário de Criação de Contrato */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <h2 style={{ fontSize: "20px", margin: 0, color: "var(--forest-950)", fontWeight: 700 }}>
                  📜 Criar Novo Contrato de Cliente
                </h2>
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
                  Digite o PLOT ID (ex: <strong>NAS-02</strong>, <strong>P2401</strong>) para autopreencher a partir do banco de dados criptografado.
                </p>
              </div>

              {/* Banner de Soma Total do Contrato */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  textAlign: "right",
                }}
              >
                <div style={{ fontSize: "10px", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                  📐 Soma Total do Contrato
                </div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#15803d" }}>
                  {grandTotalHectares.toFixed(2)} <span style={{ fontSize: "12px", fontWeight: 700 }}>ha</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveContract} style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700 }}>
                  Código do Contrato *
                  <input
                    type="text"
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value.toUpperCase())}
                    placeholder="Ex: 2026-C001"
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", fontSize: "13px" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700 }}>
                  Nome do Cliente / Importador *
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Bremen Importers GmbH"
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", fontSize: "13px" }}
                  />
                </label>
              </div>

              {/* Seção de Lotes */}
              <div style={{ borderTop: "1px solid var(--line-light)", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, color: "var(--forest-950)" }}>
                    📦 Lotes do Contrato ({lots.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLot}
                    style={{
                      background: "#15803d",
                      color: "#fff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ➕ Adicionar mais um lote
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxHeight: "640px", overflowY: "auto", paddingRight: "6px", paddingBottom: "140px" }}>
                  {lots.map((lot, lotIdx) => {
                    const lotTotalHectares = lot.plots.reduce((sum, p) => sum + (Number(p.hectares) || 0), 0);

                    return (
                      <div
                        key={lotIdx}
                        style={{
                          background: "var(--canvas)",
                          border: "1px solid var(--line-strong)",
                          borderRadius: "14px",
                          padding: "18px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--forest-900)" }}>
                              {lot.lotNumber || `LOTE ${lotIdx + 1}`}
                            </span>
                            {/* BADGE DA SOMA DOS HECTARES DO LOTE */}
                            <span style={{ fontSize: "12px", background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "20px", fontWeight: 800, border: "1px solid #bae6fd" }}>
                              📐 Soma do Lote: {lotTotalHectares.toFixed(2)} ha
                            </span>
                          </div>
                          {lots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLot(lotIdx)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--danger)",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              🗑️ Remover Lote
                            </button>
                          )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                          <label style={{ fontSize: "11px", fontWeight: 700 }}>
                            Nome / Código do Lote
                            <input
                              type="text"
                              value={lot.lotNumber}
                              onChange={(e) => handleLotChange(lotIdx, "lotNumber", e.target.value)}
                              placeholder="Ex: LOTE 01"
                              style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px" }}
                            />
                          </label>

                          <label style={{ fontSize: "11px", fontWeight: 700 }}>
                            Região do Lote
                            <input
                              type="text"
                              value={lot.region}
                              onChange={(e) => handleLotChange(lotIdx, "region", e.target.value)}
                              placeholder="Ex: MOGIANA"
                              style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px" }}
                            />
                          </label>
                        </div>

                        {/* Lista Dinâmica de Talhões por Lote */}
                        <div style={{ background: "#fff", padding: "14px", borderRadius: "10px", border: "1px solid var(--line-light)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-950)" }}>
                              🌐 Talhões deste Lote ({lot.plots.length}) • Total: <strong style={{ color: "#0284c7" }}>{lotTotalHectares.toFixed(2)} ha</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddPlotToLot(lotIdx)}
                              style={{
                                background: "#0369a1",
                                color: "#fff",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ➕ Adicionar mais um talhão neste lote
                            </button>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {lot.plots.map((plot, plotIdx) => (
                              <div
                                key={plotIdx}
                                style={{
                                  background: "var(--canvas)",
                                  padding: "12px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--line-light)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#0284c7" }}>
                                    Talhão #{plotIdx + 1}
                                  </span>
                                  {lot.plots.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePlotFromLot(lotIdx, plotIdx)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--danger)",
                                        fontSize: "11px",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                      }}
                                    >
                                      ✖ Remover Talhão
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.8fr", gap: "8px" }}>
                                  <label style={{ fontSize: "10px", fontWeight: 700 }}>
                                    PLOT ID *
                                    <PlotAutocompleteInput
                                      value={plot.plotId}
                                      onChange={(newVal) => handlePlotIdInputChange(lotIdx, plotIdx, newVal)}
                                      onSelect={(selectedPlot) => handleSelectPlotMaster(lotIdx, plotIdx, selectedPlot)}
                                      plotMasterList={plotMasterList}
                                      placeholder="Ex: NAS-02, P2401..."
                                    />
                                  </label>

                                  <label style={{ fontSize: "10px", fontWeight: 600 }}>
                                    Produtor
                                    <input
                                      type="text"
                                      value={plot.producer}
                                      onChange={(e) => handlePlotFieldChange(lotIdx, plotIdx, "producer", e.target.value)}
                                      placeholder="Nome do Produtor"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--line)", fontSize: "11px" }}
                                    />
                                  </label>

                                  <label style={{ fontSize: "10px", fontWeight: 600 }}>
                                    Fornecedor
                                    <input
                                      type="text"
                                      value={plot.supplier}
                                      onChange={(e) => handlePlotFieldChange(lotIdx, plotIdx, "supplier", e.target.value)}
                                      placeholder="Nome do Fornecedor"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--line)", fontSize: "11px" }}
                                    />
                                  </label>

                                  <label style={{ fontSize: "10px" }}>
                                    Fazenda
                                    <input
                                      type="text"
                                      value={plot.farm}
                                      onChange={(e) => handlePlotFieldChange(lotIdx, plotIdx, "farm", e.target.value)}
                                      placeholder="Nome da Fazenda"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--line)", fontSize: "11px" }}
                                    />
                                  </label>

                                  <label style={{ fontSize: "10px" }}>
                                    Área (ha)
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={plot.hectares || ""}
                                      onChange={(e) => handlePlotFieldChange(lotIdx, plotIdx, "hectares", e.target.value)}
                                      placeholder="0.00"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--line)", fontSize: "11px" }}
                                    />
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="primary-button"
                style={{ width: "100%", padding: "14px", fontSize: "14px", fontWeight: 700, borderRadius: "10px", marginTop: "10px" }}
              >
                {isSaving ? "⏳ Criando Pastas e Copiando GeoJSONs no R2..." : `🚀 Criar Pacote do Contrato (${grandTotalHectares.toFixed(2)} ha) no R2`}
              </button>
            </form>
          </div>

          {/* Coluna Direita: Tabela de Contratos Criados */}
          <div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h3 style={{ fontSize: "18px", margin: "0 0 16px", fontWeight: 700, color: "var(--forest-950)" }}>
                📁 Contratos Ativos no R2 ({contracts.length})
              </h3>

              {contracts.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>Nenhum contrato criado ainda.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {contracts.map((c) => {
                    const activeContractHectares = c.lots.reduce((acc, l) => {
                      return acc + (l.plots || []).reduce((s, p) => s + (Number(p.hectares) || 0), 0);
                    }, 0);

                    return (
                      <div
                        key={c.id}
                        style={{
                          background: "var(--canvas)",
                          border: "1px solid var(--line)",
                          borderRadius: "12px",
                          padding: "18px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ background: "#eef2ff", color: "#3730a3", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 800 }}>
                            {c.contractCode}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <h4 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, color: "var(--forest-950)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{c.clientName}</span>
                          <span style={{ fontSize: "12px", color: "#166534", fontWeight: 800, background: "#dcfce7", padding: "2px 8px", borderRadius: "10px" }}>
                            📐 {activeContractHectares.toFixed(2)} ha
                          </span>
                        </h4>

                        <div style={{ borderTop: "1px solid var(--line-light)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {c.lots.map((lot) => {
                            const activeLotHectares = (lot.plots || []).reduce((s, p) => s + (Number(p.hectares) || 0), 0);

                            return (
                              <div key={lot.id} style={{ background: "#fff", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-light)" }}>
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-900)", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                                  <span>📦 {lot.lotNumber} ({lot.plots ? lot.plots.length : 1} talhão(ões))</span>
                                  <span style={{ color: "#0369a1", fontWeight: 800 }}>{activeLotHectares.toFixed(2)} ha</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {(lot.plots || []).map((p, pIdx) => (
                                    <div key={pIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", background: "var(--canvas)", padding: "8px 10px", borderRadius: "6px" }}>
                                      <div>
                                        <div style={{ fontWeight: 800, color: "var(--forest-950)" }}>🌐 {p.plotId} ({p.hectares || 0} ha)</div>
                                        <div style={{ fontSize: "10px", color: "#0369a1", fontWeight: 600 }}>
                                          Produtor: <strong>{p.producer}</strong> • Fornecedor: <strong>{p.supplier}</strong>
                                        </div>
                                        <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                                          Fazenda: {p.farm}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDownloadGeoJson(p.targetGeojsonKey, `${p.plotId}.geojson`)}
                                        disabled={downloadingKey === p.targetGeojsonKey}
                                        style={{
                                          padding: "4px 8px",
                                          fontSize: "10px",
                                          fontWeight: 700,
                                          borderRadius: "4px",
                                          background: "var(--forest-900)",
                                          color: "#fff",
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Baixar GeoJSON
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
