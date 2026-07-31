"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  isCollapsed?: boolean;
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

  // Filtragem flexível por Código do Talhão, Produtor, Fornecedor ou Fazenda
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
    : plotMasterList.slice(0, 10);

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
  const [searchQuery, setSearchQuery] = useState("");

  const lotsContainerRef = useRef<HTMLDivElement>(null);

  // Iniciar TUDO em branco (zero mock data)
  const [lots, setLots] = useState<DraftLotItem[]>([
    {
      lotNumber: "LOTE 01",
      region: "",
      plots: [
        { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 },
      ],
      isCollapsed: false,
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
    // Recolher lotes anteriores para focar no novo lote
    const collapsedPreviousLots = lots.map((lot) => ({
      ...lot,
      isCollapsed: true,
    }));

    setLots([
      ...collapsedPreviousLots,
      {
        lotNumber: nextLotNum,
        region: "",
        plots: [{ plotId: "", producer: "", supplier: "", farm: "", hectares: 0 }],
        isCollapsed: false,
      },
    ]);

    // Rolar suavemente ate o final onde o novo lote foi inserido
    setTimeout(() => {
      if (lotsContainerRef.current) {
        lotsContainerRef.current.scrollTo({
          top: lotsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 120);
  };

  const handleToggleCollapseLot = (index: number) => {
    const updated = [...lots];
    updated[index].isCollapsed = !updated[index].isCollapsed;
    setLots(updated);
  };

  const handleRemoveLot = (index: number) => {
    if (lots.length === 1) return;
    setLots(lots.filter((_, i) => i !== index));
  };

  const handleLotChange = (index: number, field: keyof Omit<DraftLotItem, "plots" | "isCollapsed">, value: string) => {
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

  const [lotSearchQueries, setLotSearchQueries] = useState<Record<number, string>>({});

  const handleAddSinglePlotToLot = (lotIdx: number, plot: PlotMasterRecord) => {
    setLots((prevLots) => {
      const newLots = [...prevLots];
      const targetLot = { ...newLots[lotIdx] };
      const newPlots = [...targetLot.plots];

      const lastPlot = newPlots[newPlots.length - 1];
      const isLastEmpty = lastPlot && !lastPlot.plotId.trim() && (!lastPlot.hectares || lastPlot.hectares === 0);

      const itemToInsert = {
        plotId: plot.plotId,
        producer: plot.producer,
        supplier: plot.supplier,
        farm: plot.farm,
        hectares: plot.hectares,
      };

      if (isLastEmpty) {
        newPlots[newPlots.length - 1] = itemToInsert;
      } else {
        newPlots.push(itemToInsert);
      }

      if (plot.region && !targetLot.region) {
        targetLot.region = plot.region.toUpperCase();
      }

      targetLot.plots = newPlots;
      newLots[lotIdx] = targetLot;
      return newLots;
    });
  };

  const handleAddMultiplePlotsToLot = (lotIdx: number, plotsToAdd: PlotMasterRecord[]) => {
    setLots((prevLots) => {
      const newLots = [...prevLots];
      const targetLot = { ...newLots[lotIdx] };
      let newPlots = [...targetLot.plots];

      const lastPlot = newPlots[newPlots.length - 1];
      if (lastPlot && !lastPlot.plotId.trim() && (!lastPlot.hectares || lastPlot.hectares === 0)) {
        newPlots.pop();
      }

      const existingIds = new Set(newPlots.map((p) => p.plotId.toUpperCase()));
      plotsToAdd.forEach((p) => {
        if (!existingIds.has(p.plotId.toUpperCase())) {
          newPlots.push({
            plotId: p.plotId,
            producer: p.producer,
            supplier: p.supplier,
            farm: p.farm,
            hectares: p.hectares,
          });
          if (p.region && !targetLot.region) {
            targetLot.region = p.region.toUpperCase();
          }
        }
      });

      targetLot.plots = newPlots;
      newLots[lotIdx] = targetLot;
      return newLots;
    });

    setLotSearchQueries((prev) => ({ ...prev, [lotIdx]: "" }));
  };

  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  const handleStartEditContract = (c: ContractRecord) => {
    setEditingContractId(c.id);
    setClientName(c.clientName);
    setContractCode(c.contractCode);
    setLots(
      c.lots.map((lot) => ({
        lotNumber: lot.lotNumber,
        region: lot.region || "",
        plots: (lot.plots || []).map((p) => ({
          plotId: p.plotId || "",
          producer: p.producer || "",
          supplier: p.supplier || "",
          farm: p.farm || "",
          hectares: Number(p.hectares) || 0,
        })),
        isCollapsed: false,
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingContractId(null);
    setContractCode("");
    setClientName("");
    setLots([
      {
        lotNumber: "LOTE 01",
        region: "",
        plots: [{ plotId: "", producer: "", supplier: "", farm: "", hectares: 0 }],
        isCollapsed: false,
      },
    ]);
  };

  const isContractCodeDuplicate = !editingContractId && contractCode.trim()
    ? contracts.some((c) => c.contractCode.trim().toUpperCase() === contractCode.trim().toUpperCase())
    : false;

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractCode.trim() || !clientName.trim()) {
      alert("⚠️ Preencha o código do contrato e o nome do cliente.");
      return;
    }

    if (isContractCodeDuplicate) {
      alert(`⚠️ Já existe um contrato cadastrado com o código "${contractCode.trim().toUpperCase()}".\n\nPor favor, informe um código de contrato diferente.`);
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

      // 2. Salvar ou Atualizar contrato no R2
      const isEditing = Boolean(editingContractId);
      const res = await fetch("/api/r2/copy-contract", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContractId || undefined,
          contractCode: contractCode.trim().toUpperCase(),
          clientName: clientName.trim(),
          lots,
          createdBy: loggedUserKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Contrato ${data.record.contractCode} ${isEditing ? "atualizado" : "criado"} com sucesso!\n\n${data.record.lots.length} lote(s) salvos no Cloudflare R2.`);
        handleCancelEdit();
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
      if (!res.ok) {
        throw new Error("Erro ao baixar o arquivo do servidor.");
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao baixar.";
      alert(`⚠️ ${msg}`);
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDeleteContract = async (id: string, contractCode: string) => {
    if (!confirm(`⚠️ Deseja realmente excluir o contrato ${contractCode} do servidor?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/r2/copy-contract?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Contrato ${contractCode} excluído com sucesso do servidor!`);
        loadContractsAndPlots();
      } else {
        throw new Error(data.error || "Erro ao excluir contrato.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir.";
      alert(`⚠️ ${msg}`);
    }
  };

  const [expandedContractIds, setExpandedContractIds] = useState<Record<string, boolean>>({});

  const toggleExpandContract = (id: string) => {
    setExpandedContractIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [expandedClientNames, setExpandedClientNames] = useState<Record<string, boolean>>({});

  const toggleExpandClient = (clientName: string) => {
    setExpandedClientNames((prev) => ({
      ...prev,
      [clientName]: !prev[clientName],
    }));
  };

  // Soma Total dos Hectares de Todos os Lotes do Contrato
  const grandTotalHectares = lots.reduce((acc, lot) => {
    return acc + lot.plots.reduce((sum, p) => sum + (Number(p.hectares) || 0), 0);
  }, 0);

  // Filtro de Contratos por Busca (Cliente, Código do Contrato ou Código do Talhão)
  const filteredContracts = searchQuery.trim()
    ? contracts.filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        const matchClient = c.clientName.toLowerCase().includes(q);
        const matchCode = c.contractCode.toLowerCase().includes(q);
        const matchPlot = (c.lots || []).some((l) =>
          (l.plots || []).some((p) => (p.plotId || "").toLowerCase().includes(q))
        );
        return matchClient || matchCode || matchPlot;
      })
    : contracts;

  // Agrupar contratos por Nome do Cliente para que apareçam sempre juntos
  const groupedContracts = useMemo(() => {
    const map = new Map<string, ContractRecord[]>();
    filteredContracts.forEach((c) => {
      const key = c.clientName.trim();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(c);
    });
    return Array.from(map.entries()).map(([clientName, clientContracts]) => ({
      clientName,
      contracts: clientContracts,
      totalHectares: clientContracts.reduce((acc, c) => {
        return (
          acc +
          c.lots.reduce((lAcc, l) => {
            return lAcc + (l.plots || []).reduce((pAcc, p) => pAcc + (Number(p.hectares) || 0), 0);
          }, 0)
        );
      }, 0),
    }));
  }, [filteredContracts]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        color: "var(--forest-950)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Navbar com fundo verde escuro solido #143022 de alto contraste */}
      <header
        style={{
          background: "#143022",
          color: "#ffffff",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1e4630",
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#1e4630", border: "1px solid #2d6646", color: "#34d399", fontSize: "14px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "1px" }}>
            FAF
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#34d399", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" }}>
              CONTRATOS.FAFEU.ONLINE
            </div>
            <h1 style={{ fontSize: "18px", margin: 0, fontWeight: 800, color: "#ffffff" }}>
              Gerenciador de Contratos & Banco Criptografado (AES-256)
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", padding: "5px 12px", borderRadius: "20px", color: "#34d399", fontWeight: 800 }}>
            🔒 {plotMasterList.length} Talhões Protegidos (AES-256)
          </span>
          <button
            onClick={onOpenLanding}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 800,
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
                <h2 style={{ fontSize: "20px", margin: 0, color: "var(--forest-950)", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span>📜 {clientName.trim() ? `Contrato: ${clientName.trim()}` : "Criar Novo Contrato de Cliente"}</span>
                  {contractCode.trim() && (
                    <span style={{ fontSize: "12px", background: "#eef2ff", color: "#3730a3", padding: "3px 10px", borderRadius: "6px", fontWeight: 800, border: "1px solid #c7d2fe" }}>
                      N° {contractCode.trim()}
                    </span>
                  )}
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

            {editingContractId && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fffbe6", border: "1px solid #fef08a", padding: "10px 14px", borderRadius: "10px", marginTop: "14px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#b45309" }}>
                  ✏️ Editando Contrato: {contractCode} ({clientName})
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ❌ Cancelar Edição
                </button>
              </div>
            )}

            <form onSubmit={handleSaveContract} style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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

                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700 }}>
                  Código do Contrato *
                  <input
                    type="text"
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value.toUpperCase())}
                    placeholder="Ex: 2026-C001"
                    required
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: isContractCodeDuplicate ? "2px solid #ef4444" : "1px solid var(--line)",
                      background: isContractCodeDuplicate ? "#fef2f2" : "#fff",
                      outline: "none",
                      fontSize: "13px",
                    }}
                  />
                  {isContractCodeDuplicate && (
                    <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: 800, marginTop: "2px" }}>
                      ⚠️ Este contrato já existe no servidor! Informe outro código.
                    </span>
                  )}
                </label>
              </div>

              {/* Seção de Lotes */}
              <div style={{ borderTop: "1px solid var(--line-light)", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, color: "var(--forest-950)" }}>
                    📦 Lotes do Contrato ({lots.length})
                  </h3>
                </div>

                <div
                  ref={lotsContainerRef}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    maxHeight: "640px",
                    overflowY: "auto",
                    paddingRight: "6px",
                    paddingBottom: "140px",
                    scrollBehavior: "smooth",
                  }}
                >
                  {lots.map((lot, lotIdx) => {
                    const lotTotalHectares = lot.plots.reduce((sum, p) => sum + (Number(p.hectares) || 0), 0);
                    const isCollapsed = Boolean(lot.isCollapsed);

                    return (
                      <div
                        key={lotIdx}
                        style={{
                          background: "var(--canvas)",
                          border: isCollapsed ? "1px solid var(--line)" : "2px solid #0284c7",
                          borderRadius: "14px",
                          padding: "18px",
                          transition: "all 0.2s ease-in-out",
                          boxShadow: isCollapsed ? "none" : "0 4px 14px rgba(2, 132, 199, 0.1)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCollapsed ? "0" : "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--forest-900)" }}>
                              {lot.lotNumber || `LOTE ${lotIdx + 1}`} {lot.region ? `(${lot.region})` : ""}
                            </span>
                            {/* BADGE DA SOMA DOS HECTARES DO LOTE */}
                            <span style={{ fontSize: "12px", background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "20px", fontWeight: 800, border: "1px solid #bae6fd" }}>
                              📐 Soma: {lotTotalHectares.toFixed(2)} ha
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {/* BOTÃO DE EXPANDIR / RECOLHER A LISTA DO LOTE */}
                            <button
                              type="button"
                              onClick={() => handleToggleCollapseLot(lotIdx)}
                              style={{
                                background: isCollapsed ? "#e0f2fe" : "#f1f5f9",
                                color: isCollapsed ? "#0369a1" : "#475569",
                                border: "1px solid #bae6fd",
                                padding: "5px 12px",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              {isCollapsed ? "👁️ Ver / Editar Talhões" : "🔼 Recolher Lote"}
                            </button>

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
                                🗑️ Remover
                              </button>
                            )}
                          </div>
                        </div>

                        {/* SE ESTIVER RECOLHIDO: Exibe um resumo compacto e elegante */}
                        {isCollapsed ? (
                          <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--line-light)", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "12px", color: "var(--forest-950)", fontWeight: 700 }}>
                              🌐 {lot.plots.length} talhão(ões):{" "}
                              <span style={{ fontWeight: 600, color: "#0369a1" }}>
                                {lot.plots.map((p) => p.plotId || "Sem ID").filter(Boolean).join(", ") || "Nenhum código preenchido"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleCollapseLot(lotIdx)}
                              style={{ background: "#0284c7", color: "#fff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                            >
                              ✏️ Abrir Lote
                            </button>
                          </div>
                        ) : (
                          /* SE ESTIVER EXPANDIDO: Exibe todos os inputs do lote e dos talhões */
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px", marginTop: "10px" }}>
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

                            {/* Busca Rápida de Talhões por Produtor, Fornecedor ou Fazenda */}
                            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 800, color: "#0369a1", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                🔍 <span>Buscar e adicionar talhões por Produtor, Fornecedor ou Fazenda</span>
                              </div>
                              <input
                                type="text"
                                value={lotSearchQueries[lotIdx] || ""}
                                onChange={(e) => setLotSearchQueries((prev) => ({ ...prev, [lotIdx]: e.target.value }))}
                                placeholder="Digite o nome do Produtor, Fornecedor ou Fazenda..."
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  border: "1px solid #0284c7",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  background: "#fff",
                                  outline: "none",
                                }}
                              />

                              {/* Resultados da Busca em Lote */}
                              {lotSearchQueries[lotIdx]?.trim() && (
                                <div style={{ marginTop: "10px", background: "#fff", borderRadius: "8px", border: "1px solid #cbd5e1", maxHeight: "220px", overflowY: "auto", padding: "8px" }}>
                                  {(() => {
                                    const q = (lotSearchQueries[lotIdx] || "").trim().toUpperCase();
                                    const matches = plotMasterList.filter((p) => {
                                      const pId = (p.plotId || "").toUpperCase();
                                      const prod = (p.producer || "").toUpperCase();
                                      const supp = (p.supplier || "").toUpperCase();
                                      const farm = (p.farm || "").toUpperCase();
                                      return pId.includes(q) || prod.includes(q) || supp.includes(q) || farm.includes(q);
                                    });

                                    if (matches.length === 0) {
                                      return <div style={{ fontSize: "11px", color: "var(--muted)", padding: "6px" }}>Nenhum talhão encontrado para &quot;{lotSearchQueries[lotIdx]}&quot;.</div>;
                                    }

                                    return (
                                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#166534" }}>
                                            📍 {matches.length} talhão(ões) encontrado(s)
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleAddMultiplePlotsToLot(lotIdx, matches)}
                                            style={{
                                              background: "#166534",
                                              color: "#fff",
                                              border: "none",
                                              padding: "4px 10px",
                                              borderRadius: "6px",
                                              fontSize: "10px",
                                              fontWeight: 800,
                                              cursor: "pointer",
                                            }}
                                          >
                                            ✨ Adicionar Todos os {matches.length} Talhões ao Lote
                                          </button>
                                        </div>
                                        {matches.map((p, mIdx) => (
                                          <div key={mIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", background: "#f8fafc", padding: "6px 10px", borderRadius: "6px" }}>
                                            <div>
                                              <strong style={{ color: "var(--forest-950)" }}>🌐 {p.plotId}</strong> ({p.hectares} ha)
                                              <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                                                👤 Produtor: {p.producer} • 🏡 Fazenda: {p.farm}
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleAddSinglePlotToLot(lotIdx, p)}
                                              style={{
                                                background: "#0284c7",
                                                color: "#fff",
                                                border: "none",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                              }}
                                            >
                                              ➕ Adicionar
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Lista Dinâmica de Talhões por Lote */}
                            <div style={{ background: "#fff", padding: "14px", borderRadius: "10px", border: "1px solid var(--line-light)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-950)" }}>
                                  🌐 Talhões deste Lote ({lot.plots.length}) • Total: <strong style={{ color: "#0284c7" }}>{lotTotalHectares.toFixed(2)} ha</strong>
                                </span>
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

                              {/* BOTÃO DE ADICIONAR MAIS UM TALHÃO POSICIONADO NO FINAL DO LOTE */}
                              <button
                                type="button"
                                onClick={() => handleAddPlotToLot(lotIdx)}
                                style={{
                                  width: "100%",
                                  marginTop: "12px",
                                  background: "#f0f9ff",
                                  color: "#0369a1",
                                  border: "1px dashed #0284c7",
                                  padding: "10px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#e0f2fe")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                              >
                                ➕ Adicionar mais um talhão neste lote ({lot.lotNumber || `LOTE ${lotIdx + 1}`})
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* BOTÃO DE ADICIONAR MAIS UM LOTE POSICIONADO NO FINAL DA LISTA DE LOTES */}
                  <button
                    type="button"
                    onClick={handleAddLot}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      background: "#15803d",
                      color: "#fff",
                      border: "none",
                      padding: "12px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 3px 10px rgba(21, 128, 61, 0.2)",
                    }}
                  >
                    ➕ Adicionar mais um lote ao contrato
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="primary-button"
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "10px",
                  marginTop: "10px",
                  background: editingContractId ? "#d97706" : undefined,
                }}
              >
                {isSaving
                  ? "⏳ Salvando e Atualizando no Cloudflare R2..."
                  : editingContractId
                  ? `💾 Salvar Alterações do Contrato (${grandTotalHectares.toFixed(2)} ha) no R2`
                  : `🚀 Criar Pacote do Contrato (${grandTotalHectares.toFixed(2)} ha) no R2`}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "18px", margin: 0, fontWeight: 700, color: "var(--forest-950)" }}>
                  📁 Contratos Ativos no R2 ({contracts.length})
                </h3>
              </div>

              {/* Barra de Pesquisa de Contratos & Clientes */}
              <div style={{ marginBottom: "16px", position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Pesquisar por cliente, número de contrato ou talhão..."
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #0284c7",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "#f0f9ff",
                    outline: "none",
                    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.08)",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--muted)",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>

              {contracts.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>Nenhum contrato criado ainda.</p>
              ) : filteredContracts.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
                  🔍 Nenhum contrato encontrado para &quot;<strong>{searchQuery}</strong>&quot;.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {groupedContracts.map((group) => {
                    const isClientExpanded = searchQuery.trim() ? true : Boolean(expandedClientNames[group.clientName]);

                    return (
                      <div
                        key={group.clientName}
                        style={{
                          background: "#fff",
                          border: isClientExpanded ? "2px solid #0369a1" : "1px solid #cbd5e1",
                          borderRadius: "14px",
                          padding: "16px",
                          boxShadow: isClientExpanded ? "0 4px 14px rgba(3, 105, 161, 0.08)" : "0 2px 6px rgba(0, 0, 0, 0.03)",
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        {/* Cabeçalho do Cliente (Clicável para Expandir/Recolher Todos os Contratos do Cliente) */}
                        <div
                          onClick={() => toggleExpandClient(group.clientName)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🏢</span>
                            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--forest-950)" }}>
                              {group.clientName}
                            </span>
                            <span style={{ background: "#e2e8f0", color: "#334155", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 800 }}>
                              {group.contracts.length} contrato(s)
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandClient(group.clientName);
                              }}
                              style={{
                                background: isClientExpanded ? "#e0f2fe" : "#f1f5f9",
                                color: isClientExpanded ? "#0369a1" : "#475569",
                                border: "1px solid #bae6fd",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {isClientExpanded ? "🔼 Recolher Cliente" : `👁️ Ver Contratos (${group.contracts.length})`}
                            </button>
                          </div>
                        </div>

                        {/* Lista de Contratos deste Cliente (Expansível) */}
                        {isClientExpanded && (
                          <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "12px", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {group.contracts.map((c) => {
                          const activeContractHectares = c.lots.reduce((acc, l) => {
                            return acc + (l.plots || []).reduce((s, p) => s + (Number(p.hectares) || 0), 0);
                          }, 0);

                          const isExpanded = Boolean(expandedContractIds[c.id]);

                          return (
                            <div
                              key={c.id}
                              style={{
                                background: "var(--canvas)",
                                border: isExpanded ? "2px solid #0284c7" : "1px solid var(--line)",
                                borderRadius: "10px",
                                padding: "14px",
                                transition: "all 0.2s ease-in-out",
                                boxShadow: isExpanded ? "0 4px 14px rgba(2, 132, 199, 0.08)" : "none",
                              }}
                            >
                              {/* Cabeçalho do Contrato (Clicável para Expandir/Recolher) */}
                              <div
                                onClick={() => toggleExpandContract(c.id)}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  userSelect: "none",
                                }}
                              >
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ background: "#eef2ff", color: "#3730a3", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                                      Contrato: {c.contractCode}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                                    📦 {c.lots ? c.lots.length : 0} lote(s) • 📅 {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "11px", color: "#166534", fontWeight: 800, background: "#dcfce7", padding: "3px 8px", borderRadius: "10px", border: "1px solid #86efac" }}>
                                    📐 {activeContractHectares.toFixed(2)} ha
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandContract(c.id);
                                    }}
                                    style={{
                                      background: isExpanded ? "#e0f2fe" : "#f1f5f9",
                                      color: isExpanded ? "#0369a1" : "#475569",
                                      border: "1px solid #bae6fd",
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    {isExpanded ? "🔼 Recolher" : "👁️ Ver Lotes"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditContract(c);
                                    }}
                                    style={{
                                      background: "#fffbe6",
                                      color: "#b45309",
                                      border: "1px solid #fef08a",
                                      padding: "5px 8px",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      cursor: "pointer",
                                    }}
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteContract(c.id, c.contractCode);
                                    }}
                                    style={{
                                      background: "#fef2f2",
                                      color: "#991b1b",
                                      border: "1px solid #fecaca",
                                      padding: "5px 8px",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      cursor: "pointer",
                                    }}
                                  >
                                    🗑️ Excluir
                                  </button>
                                </div>
                              </div>

                              {/* Conteúdo Detalhado (Apenas quando Expandido) */}
                              {isExpanded && (
                                <div style={{ borderTop: "1px solid var(--line-light)", marginTop: "12px", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {c.lots.map((lot) => {
                                    const activeLotHectares = (lot.plots || []).reduce((s, p) => s + (Number(p.hectares) || 0), 0);

                                    return (
                                      <div key={lot.id} style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-light)" }}>
                                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest-900)", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                                          <span>📦 {lot.lotNumber} ({lot.plots ? lot.plots.length : 1} talhão(ões))</span>
                                          <span style={{ color: "#0369a1", fontWeight: 800 }}>{activeLotHectares.toFixed(2)} ha</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                          {(lot.plots || []).map((p, pIdx) => (
                                            <div key={pIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", background: "var(--canvas)", padding: "6px 10px", borderRadius: "6px" }}>
                                              <div style={{ fontWeight: 800, color: "var(--forest-950)" }}>
                                                🌐 {p.plotId} ({p.hectares || 0} ha)
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
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
