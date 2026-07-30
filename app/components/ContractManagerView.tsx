"use client";

import React, { useState, useEffect } from "react";
import { ContractRecord } from "@/app/lib/contractStore";

interface ContractManagerViewProps {
  onOpenLanding: () => void;
  loggedUserKey?: string;
}

interface DraftPlotItem {
  plotId: string;
  supplier: string;
  farm: string;
}

interface DraftLotItem {
  lotNumber: string;
  region: string;
  plots: DraftPlotItem[];
}

export function ContractManagerView({ onOpenLanding, loggedUserKey = "joao.matos" }: ContractManagerViewProps) {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [contractCode, setContractCode] = useState("2026-C001");
  const [clientName, setClientName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const [lots, setLots] = useState<DraftLotItem[]>([
    {
      lotNumber: "LOTE 01",
      region: "MOGIANA",
      plots: [
        { plotId: "FAFDRAN-01", supplier: "Adilson Reis", farm: "Sítio Dutra" },
        { plotId: "FAFDRAV-01", supplier: "Valdir Silva", farm: "Fazenda Primavera" },
      ],
    },
  ]);

  const loadContracts = async () => {
    try {
      const res = await fetch("/api/r2/copy-contract");
      const data = await res.json();
      if (data.contracts) {
        setContracts(data.contracts);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleAddLot = () => {
    const nextLotNum = `LOTE ${String(lots.length + 1).padStart(2, "0")}`;
    const lastLot = lots[lots.length - 1] || { region: "MOGIANA" };
    setLots([
      ...lots,
      {
        lotNumber: nextLotNum,
        region: lastLot.region || "MOGIANA",
        plots: [{ plotId: "", supplier: "", farm: "" }],
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
    const lastPlot = lotPlots[lotPlots.length - 1] || { supplier: "", farm: "" };
    updated[lotIndex].plots = [
      ...lotPlots,
      { plotId: "", supplier: lastPlot.supplier || "", farm: lastPlot.farm || "" },
    ];
    setLots(updated);
  };

  const handleRemovePlotFromLot = (lotIndex: number, plotIndex: number) => {
    const updated = [...lots];
    if (updated[lotIndex].plots.length === 1) return;
    updated[lotIndex].plots = updated[lotIndex].plots.filter((_, i) => i !== plotIndex);
    setLots(updated);
  };

  const handlePlotChange = (lotIndex: number, plotIndex: number, field: keyof DraftPlotItem, value: string) => {
    const updated = [...lots];
    const targetValue = field === "plotId" ? value.toUpperCase() : value;
    updated[lotIndex].plots[plotIndex] = {
      ...updated[lotIndex].plots[plotIndex],
      [field]: targetValue,
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
        setClientName("");
        loadContracts();
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
              Gerenciador de Contratos, Lotes & Multi-Talhões
            </h1>
          </div>
        </div>

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
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1250px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "32px" }}>
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
            <h2 style={{ fontSize: "20px", margin: "0 0 8px", color: "var(--forest-950)", fontWeight: 700 }}>
              📜 Criar Novo Contrato de Cliente
            </h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" }}>
              Monte o contrato associando múltiplos lotes. Cada lote pode conter vários talhões de diferentes produtores e fazendas.
            </p>

            <form onSubmit={handleSaveContract} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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

                <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxHeight: "500px", overflowY: "auto", paddingRight: "4px" }}>
                  {lots.map((lot, lotIdx) => (
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
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--forest-900)" }}>
                          {lot.lotNumber || `LOTE ${lotIdx + 1}`}
                        </span>
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
                            🌐 Talhões deste Lote ({lot.plots.length} talhão(ões) de diferentes produtores)
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

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {lot.plots.map((plot, plotIdx) => (
                            <div
                              key={plotIdx}
                              style={{
                                background: "var(--canvas)",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid var(--line-light)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7" }}>
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

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                                <label style={{ fontSize: "10px", fontWeight: 700 }}>
                                  Código Talhão (.geojson) *
                                  <input
                                    type="text"
                                    value={plot.plotId}
                                    onChange={(e) => handlePlotChange(lotIdx, plotIdx, "plotId", e.target.value)}
                                    placeholder="Ex: FAFDRAN-01"
                                    required
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--line)", fontSize: "11px", fontWeight: 700 }}
                                  />
                                </label>

                                <label style={{ fontSize: "10px" }}>
                                  Produtor / Fornecedor
                                  <input
                                    type="text"
                                    value={plot.supplier}
                                    onChange={(e) => handlePlotChange(lotIdx, plotIdx, "supplier", e.target.value)}
                                    placeholder="Ex: Adilson Reis"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--line)", fontSize: "11px" }}
                                  />
                                </label>

                                <label style={{ fontSize: "10px" }}>
                                  Fazenda
                                  <input
                                    type="text"
                                    value={plot.farm}
                                    onChange={(e) => handlePlotChange(lotIdx, plotIdx, "farm", e.target.value)}
                                    placeholder="Ex: Sítio Dutra"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid var(--line)", fontSize: "11px" }}
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="primary-button"
                style={{ width: "100%", padding: "14px", fontSize: "14px", fontWeight: 700, borderRadius: "10px", marginTop: "10px" }}
              >
                {isSaving ? "⏳ Criando Pastas e Copiando GeoJSONs no R2..." : "🚀 Criar Pacote do Contrato no Cloudflare R2"}
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
                📁 Contratos Ativos no Cloudflare R2 ({contracts.length})
              </h3>

              {contracts.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>Nenhum contrato criado ainda.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {contracts.map((c) => (
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

                      <h4 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, color: "var(--forest-950)" }}>
                        {c.clientName}
                      </h4>

                      <div style={{ borderTop: "1px solid var(--line-light)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {c.lots.map((lot) => (
                          <div key={lot.id} style={{ background: "#fff", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-light)" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-900)", marginBottom: "6px" }}>
                              📦 {lot.lotNumber} ({lot.plots ? lot.plots.length : 1} talhão(ões))
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {(lot.plots || []).map((p, pIdx) => (
                                <div key={pIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", background: "var(--canvas)", padding: "6px 10px", borderRadius: "6px" }}>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "var(--forest-950)" }}>🌐 {p.plotId}</div>
                                    <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                                      Produtor: {p.supplier} • Fazenda: {p.farm}
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
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
