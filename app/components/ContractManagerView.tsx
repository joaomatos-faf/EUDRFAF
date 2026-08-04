"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ContractRecord } from "@/app/lib/contractStore";
import { PlotMasterRecord } from "@/app/lib/plotMasterData";
import { ClientSelectAutocomplete } from "./ClientSelectAutocomplete";

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

// Componente de Autocomplete de Talhões
interface PlotAutocompleteInputProps {
  value: string;
  onChange: (plotId: string) => void;
  onSelect: (plot: PlotMasterRecord) => void;
  plotMasterList: PlotMasterRecord[];
  placeholder?: string;
}

function PlotAutocompleteInput({
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
          border: exactMatch ? "1.5px solid #10b981" : "1px solid #cbd5e1",
          fontSize: "13px",
          fontWeight: 700,
          background: exactMatch ? "#f0fdf4" : "#ffffff",
          color: "var(--forest-950, #0f261e)",
          outline: "none",
          transition: "all 0.15s ease",
        }}
      />

      {isOpen && filteredPlots.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "340px",
            maxWidth: "380px",
            zIndex: 9999,
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            boxShadow:
              "0 12px 30px rgba(15, 38, 30, 0.18), 0 4px 10px rgba(0,0,0,0.06)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              background: "#f8fafc",
              borderBottom: "1px solid #f1f5f9",
              fontSize: "11px",
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            Sugestões da Base de Talhões ({filteredPlots.length})
          </div>
          {filteredPlots.map((p, idx) => (
            <div
              key={`${p.plotId}-${idx}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectOption(p);
              }}
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f0fdf4")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#ffffff")
              }
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "13px",
                  color: "var(--forest-950, #0f261e)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>🌱 {p.plotId}</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#059669",
                    fontSize: "11.5px",
                    background: "rgba(16, 185, 129, 0.12)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {p.hectares ? `${p.hectares.toFixed(2)} ha` : "0 ha"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#334155",
                  fontWeight: 600,
                  marginTop: "3px",
                }}
              >
                Produtor: <strong>{p.producer}</strong>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  marginTop: "1px",
                  display: "flex",
                  gap: "6px",
                }}
              >
                <span>Fazenda: {p.farm || "N/A"}</span>
                {p.supplier && <span>• Fornecedor: {p.supplier}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContractManagerView({
  onOpenLanding,
  loggedUserKey = "usuario",
}: ContractManagerViewProps) {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [plotMasterList, setPlotMasterList] = useState<PlotMasterRecord[]>([]);
  const [contractCode, setContractCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lotSearchQueries, setLotSearchQueries] = useState<
    Record<number, string>
  >({});
  const [editingContractId, setEditingContractId] = useState<string | null>(
    null
  );

  const lotsContainerRef = useRef<HTMLDivElement>(null);

  // Inicialização com 1 lote vazio
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
      // Ignorar falhas silenciosas
    }
  };

  useEffect(() => {
    loadContractsAndPlots();
  }, []);

  const grandTotalHectares = useMemo(() => {
    return lots.reduce((total, lot) => {
      const lotSum = lot.plots.reduce(
        (sum, p) => sum + (Number(p.hectares) || 0),
        0
      );
      return total + lotSum;
    }, 0);
  }, [lots]);

  const totalPlotsCount = useMemo(() => {
    return lots.reduce((total, lot) => total + lot.plots.length, 0);
  }, [lots]);

  const handleAddLot = () => {
    const nextLotNum = `LOTE ${String(lots.length + 1).padStart(2, "0")}`;
    const collapsedPreviousLots = lots.map((lot) => ({
      ...lot,
      isCollapsed: true,
    }));

    setLots([
      ...collapsedPreviousLots,
      {
        lotNumber: nextLotNum,
        region: "",
        plots: [
          { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 },
        ],
        isCollapsed: false,
      },
    ]);

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

  const handleLotChange = (
    index: number,
    field: keyof Omit<DraftLotItem, "plots" | "isCollapsed">,
    value: string
  ) => {
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
    updated[lotIndex].plots = updated[lotIndex].plots.filter(
      (_, i) => i !== plotIndex
    );
    setLots(updated);
  };

  const handlePlotIdInputChange = (
    lotIndex: number,
    plotIndex: number,
    rawValue: string
  ) => {
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

  const handleSelectPlotMaster = (
    lotIndex: number,
    plotIndex: number,
    plot: PlotMasterRecord
  ) => {
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

  const handlePlotFieldChange = (
    lotIndex: number,
    plotIndex: number,
    field: "producer" | "supplier" | "farm" | "hectares",
    value: string | number
  ) => {
    const updated = [...lots];
    updated[lotIndex].plots[plotIndex] = {
      ...updated[lotIndex].plots[plotIndex],
      [field]:
        field === "hectares" ? parseFloat(String(value)) || 0 : String(value),
    };
    setLots(updated);
  };

  const handleAddMultiplePlotsToLot = (
    lotIdx: number,
    plotsToAdd: PlotMasterRecord[]
  ) => {
    setLots((prevLots) => {
      const newLots = [...prevLots];
      const targetLot = { ...newLots[lotIdx] };
      let newPlots = [...targetLot.plots];

      const lastPlot = newPlots[newPlots.length - 1];
      if (
        lastPlot &&
        !lastPlot.plotId.trim() &&
        (!lastPlot.hectares || lastPlot.hectares === 0)
      ) {
        newPlots.pop();
      }

      const existingIds = new Set(
        newPlots.map((p) => p.plotId.toUpperCase())
      );
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
        plots: [
          { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 },
        ],
        isCollapsed: false,
      },
    ]);
  };

  const isContractCodeDuplicate =
    !editingContractId && contractCode.trim()
      ? contracts.some(
          (c) =>
            c.contractCode.trim().toUpperCase() ===
            contractCode.trim().toUpperCase()
        )
      : false;

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractCode.trim() || !clientName.trim()) {
      alert("⚠️ Preencha o código do contrato e o nome do cliente.");
      return;
    }

    if (isContractCodeDuplicate) {
      alert(
        `⚠️ Já existe um contrato cadastrado com o código "${contractCode
          .trim()
          .toUpperCase()}".\n\nPor favor, informe um código diferente.`
      );
      return;
    }

    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      if (!lot.plots || lot.plots.length === 0) {
        alert(`⚠️ Adicione ao menos 1 talhão ao ${lot.lotNumber || `Lote ${i + 1}`}.`);
        return;
      }
      for (let j = 0; j < lot.plots.length; j++) {
        if (!lot.plots[j].plotId.trim()) {
          alert(
            `⚠️ Preencha o Código do Talhão ${j + 1} no ${
              lot.lotNumber || `Lote ${i + 1}`
            }.`
          );
          return;
        }
      }
    }

    setIsSaving(true);
    try {
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
        alert(
          `✅ Contrato ${data.record.contractCode} ${
            isEditing ? "atualizado" : "criado"
          } com sucesso no Cloudflare R2!`
        );
        handleCancelEdit();
        loadContractsAndPlots();
      } else {
        throw new Error(data.error || "Erro ao salvar contrato.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao processar contrato.";
      alert(`⚠️ ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadGeoJson = async (key: string, filename: string) => {
    setDownloadingKey(key);
    try {
      const res = await fetch(`/api/r2/download?key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("Erro ao baixar arquivo do R2.");
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      alert("⚠️ Não foi possível baixar o arquivo do servidor.");
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDeleteContract = async (id: string, code: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o Contrato ${code} do Cloudflare R2?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/r2/copy-contract?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        loadContractsAndPlots();
      } else {
        alert(`⚠️ ${data.error || "Erro ao excluir contrato."}`);
      }
    } catch {
      alert("⚠️ Erro ao excluir contrato.");
    }
  };

  const filteredContracts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contracts;
    return contracts.filter((c) => {
      const matchClient = (c.clientName || "").toLowerCase().includes(q);
      const matchCode = (c.contractCode || "").toLowerCase().includes(q);
      const matchPlots = (c.lots || []).some((l) =>
        (l.plots || []).some((p) =>
          (p.plotId || "").toLowerCase().includes(q) ||
          (p.producer || "").toLowerCase().includes(q) ||
          (p.farm || "").toLowerCase().includes(q)
        )
      );
      return matchClient || matchCode || matchPlots;
    });
  }, [contracts, searchQuery]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas, #f3f5f2)",
        color: "var(--ink, #18211d)",
        fontFamily:
          "'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif",
      }}
    >
      {/* Top Corporate Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#0c2a21",
          color: "#ffffff",
          padding: "0 max(28px, calc((100vw - 1480px) / 2))",
          height: "74px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{
              height: "40px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
          <div>
            <p
              style={{
                margin: "0 0 2px",
                color: "var(--orange-500, #d77442)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              FAF COFFEES • CONTRACT MANAGEMENT & CLOUDFLARE R2
            </p>
            <h1
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "19px",
                fontWeight: 700,
                letterSpacing: "-.02em",
              }}
            >
              Gestão de Contratos e Importadores
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: "#d1fae5",
              fontSize: "12.5px",
              fontWeight: 600,
              background: "rgba(255,255,255,0.08)",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            👤 {loggedUserKey}
          </span>
          <button
            onClick={onOpenLanding}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🏠 Voltar ao Início
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: "1480px",
          margin: "0 auto",
          padding: "28px 24px 80px",
        }}
      >
        {/* KPI Metrics Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "18px 22px",
              borderRadius: "14px",
              border: "1px solid #dce3de",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Contratos Ativos no R2
              </span>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#1e293b",
                  marginTop: "2px",
                }}
              >
                {contracts.length}{" "}
                <span
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  contrato(s)
                </span>
              </div>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#e0f2fe",
                color: "#0369a1",
                display: "grid",
                placeItems: "center",
                fontSize: "20px",
              }}
            >
              📋
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px 22px",
              borderRadius: "14px",
              border: "1px solid #dce3de",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Soma do Contrato Atual
              </span>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#059669",
                  marginTop: "2px",
                }}
              >
                {grandTotalHectares.toFixed(2)}{" "}
                <span
                  style={{
                    fontSize: "13px",
                    color: "#059669",
                    fontWeight: 600,
                  }}
                >
                  hectares
                </span>
              </div>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#ecfdf5",
                color: "#059669",
                display: "grid",
                placeItems: "center",
                fontSize: "20px",
              }}
            >
              📐
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px 22px",
              borderRadius: "14px",
              border: "1px solid #dce3de",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Composição do Contrato
              </span>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f261e",
                  marginTop: "4px",
                }}
              >
                {lots.length} {lots.length === 1 ? "lote" : "lotes"} ·{" "}
                {totalPlotsCount} {totalPlotsCount === 1 ? "talhão" : "talhões"}
              </div>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#f1f5f9",
                color: "#475569",
                display: "grid",
                placeItems: "center",
                fontSize: "20px",
              }}
            >
              🌱
            </div>
          </div>
        </div>

        {/* 2 Columns: Left Form / Right Table */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 0.7fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* Coluna Esquerda: Formulário de Contrato */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dce3de",
              borderRadius: "16px",
              padding: "26px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                paddingBottom: "14px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    margin: 0,
                    color: "var(--forest-950, #0f261e)",
                    fontWeight: 800,
                  }}
                >
                  {editingContractId
                    ? `✏️ Editando Contrato: ${contractCode}`
                    : "📜 Cadastrar Novo Contrato"}
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "3px 0 0",
                  }}
                >
                  Selecione o cliente europeu, defina os lotes e monte os
                  talhões para publicação automática no Cloudflare R2.
                </p>
              </div>

              {editingContractId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✕ Cancelar Edição
                </button>
              )}
            </div>

            <form
              onSubmit={handleSaveContract}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Header Fields: Client Autocomplete + Contract Code */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: "16px",
                  alignItems: "start",
                }}
              >
                <ClientSelectAutocomplete
                  value={clientName}
                  onChange={(name) => setClientName(name)}
                  label="Cliente / Importador Europeu *"
                  placeholder="Selecione um cliente europeu ou cadastre..."
                  required={true}
                />

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--forest-950, #0f261e)",
                      marginBottom: "6px",
                    }}
                  >
                    Código do Contrato *
                  </label>
                  <input
                    type="text"
                    value={contractCode}
                    onChange={(e) =>
                      setContractCode(e.target.value.toUpperCase())
                    }
                    placeholder="Ex: 2026-C001"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: isContractCodeDuplicate
                        ? "1.5px solid #ef4444"
                        : "1px solid #cbd5e1",
                      background: isContractCodeDuplicate
                        ? "#fef2f2"
                        : "#ffffff",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "var(--forest-950, #0f261e)",
                      outline: "none",
                    }}
                  />
                  {isContractCodeDuplicate && (
                    <span
                      style={{
                        fontSize: "11.5px",
                        color: "#dc2626",
                        fontWeight: 700,
                        marginTop: "4px",
                        display: "block",
                      }}
                    >
                      ⚠️ Contrato já existe! Use outro código.
                    </span>
                  )}
                </div>
              </div>

              {/* Lotes & Talhões Section */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "15px",
                      margin: 0,
                      fontWeight: 800,
                      color: "var(--forest-950, #0f261e)",
                    }}
                  >
                    📦 Lotes & Talhões ({lots.length})
                  </h3>
                </div>

                <div
                  ref={lotsContainerRef}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    maxHeight: "680px",
                    overflowY: "auto",
                    paddingRight: "4px",
                  }}
                >
                  {lots.map((lot, lotIdx) => {
                    const lotTotalHectares = lot.plots.reduce(
                      (sum, p) => sum + (Number(p.hectares) || 0),
                      0
                    );
                    const isCollapsed = Boolean(lot.isCollapsed);

                    return (
                      <div
                        key={lotIdx}
                        style={{
                          background: "#fbfcfb",
                          border: isCollapsed
                            ? "1px solid #e2e8f0"
                            : "1.5px solid #10b981",
                          borderRadius: "14px",
                          padding: "18px",
                          boxShadow: isCollapsed
                            ? "none"
                            : "0 4px 12px rgba(16, 185, 129, 0.08)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Lot Card Header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 800,
                                color: "var(--forest-950, #0f261e)",
                              }}
                            >
                              {lot.lotNumber || `LOTE ${lotIdx + 1}`}{" "}
                              {lot.region ? `(${lot.region})` : ""}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                background: "#ecfdf5",
                                color: "#065f46",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                fontWeight: 800,
                                border: "1px solid #a7f3d0",
                              }}
                            >
                              📐 {lotTotalHectares.toFixed(2)} ha
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleCollapseLot(lotIdx)}
                              style={{
                                background: isCollapsed ? "#f1f5f9" : "#ffffff",
                                color: "#334155",
                                border: "1px solid #cbd5e1",
                                padding: "5px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {isCollapsed
                                ? "👁️ Ver / Editar Talhões"
                                : "🔼 Recolher Lote"}
                            </button>

                            {lots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLot(lotIdx)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#dc2626",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsed Preview */}
                        {isCollapsed ? (
                          <div
                            style={{
                              background: "#ffffff",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              marginTop: "12px",
                              fontSize: "12.5px",
                              color: "#475569",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>
                              {lot.plots.length} talhão(ões):{" "}
                              <strong style={{ color: "#0f261e" }}>
                                {lot.plots
                                  .map((p) => p.plotId || "Sem ID")
                                  .join(", ")}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleCollapseLot(lotIdx)}
                              style={{
                                background: "#059669",
                                color: "#ffffff",
                                border: "none",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Editar
                            </button>
                          </div>
                        ) : (
                          /* Expanded Full Lot Editor */
                          <div style={{ marginTop: "14px" }}>
                            {/* Lot Name and Region */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "12px",
                                marginBottom: "14px",
                              }}
                            >
                              <div>
                                <label
                                  style={{
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    color: "#475569",
                                    display: "block",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Nome do Lote
                                </label>
                                <input
                                  type="text"
                                  value={lot.lotNumber}
                                  onChange={(e) =>
                                    handleLotChange(
                                      lotIdx,
                                      "lotNumber",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ex: LOTE 01"
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    background: "#ffffff",
                                  }}
                                />
                              </div>

                              <div>
                                <label
                                  style={{
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    color: "#475569",
                                    display: "block",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Região do Lote
                                </label>
                                <input
                                  type="text"
                                  value={lot.region}
                                  onChange={(e) =>
                                    handleLotChange(
                                      lotIdx,
                                      "region",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ex: MOGIANA, CERRADO, SUL DE MINAS"
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    background: "#ffffff",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Batch Add helper from Master Data */}
                            <div
                              style={{
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "10px",
                                padding: "12px",
                                marginBottom: "16px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  color: "#166534",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                ⚡{" "}
                                <span>
                                  Adicionar talhões em lote por
                                  Produtor/Fazenda/Fornecedor
                                </span>
                              </div>
                              <input
                                type="text"
                                value={lotSearchQueries[lotIdx] || ""}
                                onChange={(e) =>
                                  setLotSearchQueries((prev) => ({
                                    ...prev,
                                    [lotIdx]: e.target.value,
                                  }))
                                }
                                placeholder="Digite nome da fazenda ou produtor para buscar talhões da base..."
                                style={{
                                  width: "100%",
                                  padding: "8px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #86efac",
                                  fontSize: "12.5px",
                                  background: "#ffffff",
                                  outline: "none",
                                }}
                              />

                              {lotSearchQueries[lotIdx]?.trim() && (
                                <div style={{ marginTop: "10px" }}>
                                  {(() => {
                                    const q = lotSearchQueries[lotIdx]
                                      .toLowerCase()
                                      .trim();
                                    const matches = plotMasterList.filter(
                                      (p) =>
                                        (p.farm || "")
                                          .toLowerCase()
                                          .includes(q) ||
                                        (p.producer || "")
                                          .toLowerCase()
                                          .includes(q) ||
                                        (p.supplier || "")
                                          .toLowerCase()
                                          .includes(q)
                                    );

                                    if (matches.length === 0) {
                                      return (
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            color: "#64748b",
                                            padding: "4px",
                                          }}
                                        >
                                          Nenhum talhão encontrado para &quot;{q}
                                          &quot;.
                                        </div>
                                      );
                                    }

                                    return (
                                      <div>
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: "11.5px",
                                              fontWeight: 700,
                                              color: "#166534",
                                            }}
                                          >
                                            {matches.length} talhão(ões)
                                            encontrado(s)
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleAddMultiplePlotsToLot(
                                                lotIdx,
                                                matches
                                              )
                                            }
                                            style={{
                                              background: "#16a34a",
                                              color: "#ffffff",
                                              border: "none",
                                              padding: "4px 10px",
                                              borderRadius: "6px",
                                              fontSize: "11px",
                                              fontWeight: 700,
                                              cursor: "pointer",
                                            }}
                                          >
                                            ➕ Inserir Todos ({matches.length})
                                          </button>
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "6px",
                                            maxHeight: "120px",
                                            overflowY: "auto",
                                          }}
                                        >
                                          {matches.slice(0, 15).map((m) => (
                                            <button
                                              key={m.plotId}
                                              type="button"
                                              onClick={() =>
                                                handleAddMultiplePlotsToLot(
                                                  lotIdx,
                                                  [m]
                                                )
                                              }
                                              style={{
                                                background: "#ffffff",
                                                border: "1px solid #86efac",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                fontSize: "11.5px",
                                                cursor: "pointer",
                                                textAlign: "left",
                                              }}
                                            >
                                              <strong>{m.plotId}</strong> ({m.hectares} ha) · {m.farm}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Plots List Inside Lot */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                              }}
                            >
                              {lot.plots.map((plot, plotIdx) => (
                                <div
                                  key={plotIdx}
                                  style={{
                                    background: "#ffffff",
                                    padding: "12px 14px",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 800,
                                        color: "#059669",
                                      }}
                                    >
                                      Talhão #{plotIdx + 1}
                                    </span>
                                    {lot.plots.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemovePlotFromLot(
                                            lotIdx,
                                            plotIdx
                                          )
                                        }
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "#dc2626",
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        ✕ Remover
                                      </button>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "1.3fr 1.1fr 1.1fr 1.1fr 0.8fr",
                                      gap: "10px",
                                    }}
                                  >
                                    <div>
                                      <label
                                        style={{
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          color: "#475569",
                                          display: "block",
                                          marginBottom: "3px",
                                        }}
                                      >
                                        PLOT ID *
                                      </label>
                                      <PlotAutocompleteInput
                                        value={plot.plotId}
                                        onChange={(newVal) =>
                                          handlePlotIdInputChange(
                                            lotIdx,
                                            plotIdx,
                                            newVal
                                          )
                                        }
                                        onSelect={(selectedPlot) =>
                                          handleSelectPlotMaster(
                                            lotIdx,
                                            plotIdx,
                                            selectedPlot
                                          )
                                        }
                                        plotMasterList={plotMasterList}
                                        placeholder="Ex: NAS-02, P2401..."
                                      />
                                    </div>

                                    <div>
                                      <label
                                        style={{
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          color: "#475569",
                                          display: "block",
                                          marginBottom: "3px",
                                        }}
                                      >
                                        Produtor
                                      </label>
                                      <input
                                        type="text"
                                        value={plot.producer}
                                        onChange={(e) =>
                                          handlePlotFieldChange(
                                            lotIdx,
                                            plotIdx,
                                            "producer",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Nome do Produtor"
                                        style={{
                                          width: "100%",
                                          padding: "8px 10px",
                                          borderRadius: "8px",
                                          border: "1px solid #cbd5e1",
                                          fontSize: "12px",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label
                                        style={{
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          color: "#475569",
                                          display: "block",
                                          marginBottom: "3px",
                                        }}
                                      >
                                        Fornecedor
                                      </label>
                                      <input
                                        type="text"
                                        value={plot.supplier}
                                        onChange={(e) =>
                                          handlePlotFieldChange(
                                            lotIdx,
                                            plotIdx,
                                            "supplier",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Nome do Fornecedor"
                                        style={{
                                          width: "100%",
                                          padding: "8px 10px",
                                          borderRadius: "8px",
                                          border: "1px solid #cbd5e1",
                                          fontSize: "12px",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label
                                        style={{
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          color: "#475569",
                                          display: "block",
                                          marginBottom: "3px",
                                        }}
                                      >
                                        Fazenda
                                      </label>
                                      <input
                                        type="text"
                                        value={plot.farm}
                                        onChange={(e) =>
                                          handlePlotFieldChange(
                                            lotIdx,
                                            plotIdx,
                                            "farm",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Nome da Fazenda"
                                        style={{
                                          width: "100%",
                                          padding: "8px 10px",
                                          borderRadius: "8px",
                                          border: "1px solid #cbd5e1",
                                          fontSize: "12px",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label
                                        style={{
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          color: "#475569",
                                          display: "block",
                                          marginBottom: "3px",
                                        }}
                                      >
                                        Área (ha)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={plot.hectares || ""}
                                        onChange={(e) =>
                                          handlePlotFieldChange(
                                            lotIdx,
                                            plotIdx,
                                            "hectares",
                                            e.target.value
                                          )
                                        }
                                        placeholder="0.00"
                                        style={{
                                          width: "100%",
                                          padding: "8px 10px",
                                          borderRadius: "8px",
                                          border: "1px solid #cbd5e1",
                                          fontSize: "12px",
                                          fontWeight: 700,
                                          color: "#059669",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add Plot to Current Lot */}
                            <button
                              type="button"
                              onClick={() => handleAddPlotToLot(lotIdx)}
                              style={{
                                width: "100%",
                                marginTop: "10px",
                                background: "#ffffff",
                                color: "#059669",
                                border: "1px dashed #10b981",
                                padding: "9px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              ➕ Adicionar mais um talhão neste lote (
                              {lot.lotNumber || `LOTE ${lotIdx + 1}`})
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Another Lot Button */}
                  <button
                    type="button"
                    onClick={handleAddLot}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#f0fdf4",
                      color: "#166534",
                      border: "1.5px dashed #86efac",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      marginTop: "4px",
                    }}
                  >
                    <span>➕</span> Adicionar Mais Um Lote ao Contrato
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "14px",
                  fontWeight: 800,
                  borderRadius: "12px",
                  border: "none",
                  background: editingContractId
                    ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
                    : "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(9, 46, 32, 0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                {isSaving
                  ? "⏳ Processando e Publicando no R2..."
                  : editingContractId
                  ? `💾 Salvar Alterações do Contrato (${grandTotalHectares.toFixed(
                      2
                    )} ha) no R2`
                  : `🚀 Criar Pacote do Contrato (${grandTotalHectares.toFixed(
                      2
                    )} ha) no R2`}
              </button>
            </form>
          </div>

          {/* Coluna Direita: Contratos Salvos no R2 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dce3de",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  margin: 0,
                  fontWeight: 800,
                  color: "var(--forest-950, #0f261e)",
                }}
              >
                📁 Contratos no R2 ({contracts.length})
              </h3>
            </div>

            {/* Search Filter */}
            <div style={{ marginBottom: "14px", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar contrato ou cliente..."
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 32px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  background: "#f8fafc",
                }}
              />
            </div>

            {/* Contracts Feed */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "740px",
                overflowY: "auto",
              }}
            >
              {filteredContracts.length === 0 ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  Nenhum contrato encontrado.
                </div>
              ) : (
                filteredContracts.map((c) => {
                  const contractPlotsCount = (c.lots || []).reduce(
                    (sum, l) => sum + (l.plots || []).length,
                    0
                  );
                  const contractTotalHectares = (c.lots || []).reduce(
                    (sum, l) =>
                      sum +
                      (l.plots || []).reduce(
                        (pSum, p) => pSum + (Number(p.hectares) || 0),
                        0
                      ),
                    0
                  );
                  const firstPlotWithKey = (c.lots || [])
                    .flatMap((l) => l.plots || [])
                    .find((p) => p.targetGeojsonKey || p.sourceGeojsonKey);
                  const contractGeojsonKey =
                    firstPlotWithKey?.targetGeojsonKey ||
                    firstPlotWithKey?.sourceGeojsonKey;

                  return (
                    <div
                      key={c.id}
                      style={{
                        background: "#fbfcfb",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "14px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "var(--forest-950, #0f261e)",
                            }}
                          >
                            📋 {c.contractCode}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#059669",
                              marginTop: "2px",
                            }}
                          >
                            🏢 {c.clientName}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: "12px",
                            background: "#ecfdf5",
                            color: "#065f46",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontWeight: 800,
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          {contractTotalHectares.toFixed(2)} ha
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "11.5px",
                          color: "#64748b",
                          marginTop: "8px",
                        }}
                      >
                        {c.lots?.length || 0} lote(s) · {contractPlotsCount} talhão(ões)
                      </div>

                      {/* Action buttons */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "10px",
                          paddingTop: "10px",
                          borderTop: "1px solid #f1f5f9",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleStartEditContract(c)}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Editar
                        </button>

                        {contractGeojsonKey && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadGeoJson(
                                contractGeojsonKey,
                                `${c.contractCode}.geojson`
                              )
                            }
                            disabled={downloadingKey === contractGeojsonKey}
                            style={{
                              flex: 1.2,
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "none",
                              background:
                                "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
                              color: "#ffffff",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {downloadingKey === contractGeojsonKey
                              ? "⏳ Baixando..."
                              : "🌐 GeoJSON"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteContract(c.id, c.contractCode)
                          }
                          style={{
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "1px solid #fee2e2",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
