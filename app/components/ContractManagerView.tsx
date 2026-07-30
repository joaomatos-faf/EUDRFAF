"use client";

import React, { useState, useEffect } from "react";
import { ContractRecord, ContractLotItem } from "@/app/lib/contractStore";

interface ContractManagerViewProps {
  onOpenLanding: () => void;
  loggedUserKey?: string;
}

interface DraftLotItem {
  lotNumber: string;
  region: string;
  supplier: string;
  farm: string;
  plotId: string;
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
      supplier: "Adilson Reis",
      farm: "Sítio Dutra",
      plotId: "FAFDRAN-01",
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
    const lastLot = lots[lots.length - 1] || { region: "MOGIANA", supplier: "", farm: "", plotId: "" };
    setLots([
      ...lots,
      {
        lotNumber: nextLotNum,
        region: lastLot.region || "MOGIANA",
        supplier: lastLot.supplier || "",
        farm: lastLot.farm || "",
        plotId: "",
      },
    ]);
  };

  const handleRemoveLot = (index: number) => {
    if (lots.length === 1) return;
    setLots(lots.filter((_, i) => i !== index));
  };

  const handleLotChange = (index: number, field: keyof DraftLotItem, value: string) => {
    const updated = [...lots];
    updated[index] = { ...updated[index], [field]: value };
    setLots(updated);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractCode.trim() || !clientName.trim()) {
      alert("⚠️ Código do Contrato e Nome do Cliente são obrigatórios.");
      return;
    }

    for (let i = 0; i < lots.length; i++) {
      if (!lots[i].plotId.trim()) {
        alert(`⚠️ Preencha o Código do Talhão para o Lote ${i + 1}.`);
        return;
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
        alert(`✅ Contrato ${data.record.contractCode} criado com sucesso!\n\n${data.record.lots.length} lote(s) copiados para Cloudflare R2.`);
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
              Gerenciador de Contratos & Enxoval de Lotes
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
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
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
              Associe múltiplos lotes/talhões ao cliente. O sistema criará as pastas no Cloudflare R2 e copiará os GeoJSONs originais sem movê-los.
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
                    📦 Enxoval de Lotes / Talhões ({lots.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLot}
                    style={{
                      background: "#15803d",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ➕ Adicionar mais um lote
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                  {lots.map((lot, index) => (
                    <div
                      key={index}
                      style={{
                        background: "var(--canvas)",
                        border: "1px solid var(--line)",
                        borderRadius: "12px",
                        padding: "16px",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-900)" }}>
                          Lote #{index + 1}
                        </span>
                        {lots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLot(index)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--danger)",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Remover
                          </button>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 600 }}>
                          Número / Código do Lote
                          <input
                            type="text"
                            value={lot.lotNumber}
                            onChange={(e) => handleLotChange(index, "lotNumber", e.target.value)}
                            placeholder="Ex: LOTE 01"
                            style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px" }}
                          />
                        </label>

                        <label style={{ fontSize: "11px", fontWeight: 600 }}>
                          Código do Talhão (.geojson) *
                          <input
                            type="text"
                            value={lot.plotId}
                            onChange={(e) => handleLotChange(index, "plotId", e.target.value.toUpperCase())}
                            placeholder="Ex: FAFDRAN-01"
                            required
                            style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px", fontWeight: 700 }}
                          />
                        </label>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        <label style={{ fontSize: "11px" }}>
                          Região
                          <input
                            type="text"
                            value={lot.region}
                            onChange={(e) => handleLotChange(index, "region", e.target.value)}
                            placeholder="MOGIANA"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "11px" }}
                          />
                        </label>

                        <label style={{ fontSize: "11px" }}>
                          Fornecedor / Produtor
                          <input
                            type="text"
                            value={lot.supplier}
                            onChange={(e) => handleLotChange(index, "supplier", e.target.value)}
                            placeholder="Adilson Reis"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "11px" }}
                          />
                        </label>

                        <label style={{ fontSize: "11px" }}>
                          Fazenda
                          <input
                            type="text"
                            value={lot.farm}
                            onChange={(e) => handleLotChange(index, "farm", e.target.value)}
                            placeholder="Sítio Dutra"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "11px" }}
                          />
                        </label>
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

                      <div style={{ borderTop: "1px solid var(--line-light)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>
                          Lotes Vinculados ({c.lots.length}):
                        </span>
                        {c.lots.map((lot) => (
                          <div
                            key={lot.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#fff",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid var(--line-light)",
                              fontSize: "12px",
                            }}
                          >
                            <div>
                              <strong>{lot.lotNumber}</strong>: {lot.plotId}
                              <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                                Caminho: {lot.targetGeojsonKey}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadGeoJson(lot.targetGeojsonKey, `${lot.plotId}.geojson`)}
                              disabled={downloadingKey === lot.targetGeojsonKey}
                              style={{
                                padding: "4px 8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                background: "var(--forest-900)",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              🌐 Baixar GeoJSON
                            </button>
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
