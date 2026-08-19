"use client";

import { ContractForm } from "./contract-manager/ContractForm";
import { ContractList } from "./contract-manager/ContractList";
import { useContractData } from "./contract-manager/useContractData";
import { useContractEditing } from "./contract-manager/useContractEditing";
import { useContractLots } from "./contract-manager/useContractHooks";
import { useContractSave } from "./contract-manager/useContractSave";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./ui/LanguageToggle";
import { useTheme } from "@/app/hooks/useTheme";
import { useTranslation } from "@/app/hooks/useTranslation";

interface ContractManagerViewProps {
  onOpenLanding: () => void;
  onOpenDashboard?: () => void;
  loggedUserKey?: string;
}

export function ContractManagerView({
  onOpenLanding,
  onOpenDashboard,
  loggedUserKey = "usuario",
}: ContractManagerViewProps) {
  const { locale, t } = useTranslation();
  // Hooks para gerenciamento de dados
  const { contracts, setContracts, plotMasterList, loadContractsAndPlots } = useContractData();
  
  // Hooks para gerenciamento de edição
  const {
    contractCode,
    setContractCode,
    clientName,
    setClientName,
    editingContractId,
    setEditingContractId,
    handleStartEditContract,
    handleCancelEdit,
  } = useContractEditing();
  
  // Hooks para gerenciamento de lotes
  const {
    lots,
    setLots,
    lotsContainerRef,
    grandTotalHectares,
    totalPlotsCount,
    handleAddLot,
    handleToggleCollapseLot,
    handleRemoveLot,
    handleLotChange,
    handleAddPlotToLot,
    handleRemovePlotFromLot,
    handlePlotIdInputChange,
    handleSelectPlotMaster,
    handlePlotFieldChange,
    handleAddMultiplePlotsToLot,
    resetLots,
  } = useContractLots(plotMasterList);
  
  // Hooks para salvamento
  const {
    isSaving,
    downloadingKey,
    saveContract,
    deleteContract,
    downloadGeoJson,
  } = useContractSave(lots, loggedUserKey);

  // Handler para início de edição de contrato
  const handleStartEdit = (c: import("@/app/lib/contractStore").ContractRecord) => {
    handleStartEditContract(c);
    resetLots(
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

  // Handler para salvar contrato
  const handleSave = async () => {
    const success = await saveContract(
      contractCode,
      clientName,
      editingContractId,
      contracts,
      loadContractsAndPlots,
      handleCancelEdit
    );
    return success;
  };

  return (
    <div
      style={{
        maxWidth: "1680px",
        margin: "0 auto",
        padding: "24px",
        minHeight: "100vh",
        background: "var(--bg-canvas)",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          padding: "16px 0",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 800,
              background: "linear-gradient(to right, #34d399, #5eead4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {locale === "en" ? "EUDR Contracts & Lot Management" : "Gestão de Contratos & Lotes"}
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
            {locale === "en"
              ? "Register export contracts and organize farm plots into certified lots"
              : "Cadastre contratos e organize talhões em lotes para exportação"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            onClick={onOpenLanding}
            style={{
              padding: "8px 16px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#93c5fd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {locale === "en" ? "← Home" : "← Início"}
          </button>
          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              style={{
                padding: "8px 16px",
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                color: "#c4b5fd",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Dashboard →
            </button>
          )}
        </div>
      </header>

      {/* Métricas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            padding: "16px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>
            Contratos
          </p>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#34d399" }}>
            {contracts.length}
          </p>
        </div>
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            padding: "16px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>
            Lotes
          </p>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#5eead4" }}>
            {lots.length}
          </p>
        </div>
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            padding: "16px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>
            Talhões
          </p>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#818cf8" }}>
            {totalPlotsCount}
          </p>
        </div>
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            padding: "16px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>
            Área Total
          </p>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#f87171" }}>
            {grandTotalHectares.toFixed(2)} ha
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "32px",
        }}
      >
        {/* Coluna Esquerda: Formulário de Contrato */}
        <div>
          <ContractForm
            lots={lots}
            contractCode={contractCode}
            clientName={clientName}
            grandTotalHectares={grandTotalHectares}
            totalPlotsCount={totalPlotsCount}
            isSaving={isSaving}
            editingContractId={editingContractId}
            plotMasterList={plotMasterList}
            contracts={contracts}
            loggedUserKey={loggedUserKey}
            lotsContainerRef={lotsContainerRef as React.RefObject<HTMLDivElement>}
            onContractCodeChange={setContractCode}
            onClientNameChange={setClientName}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            onAddLot={handleAddLot}
            onToggleCollapseLot={handleToggleCollapseLot}
            onRemoveLot={handleRemoveLot}
            onLotChange={handleLotChange}
            onAddPlotToLot={handleAddPlotToLot}
            onRemovePlotFromLot={handleRemovePlotFromLot}
            onPlotIdChange={handlePlotIdInputChange}
            onSelectPlot={handleSelectPlotMaster}
            onPlotFieldChange={handlePlotFieldChange}
            onAddMultiplePlotsToLot={handleAddMultiplePlotsToLot}
          />
        </div>

        {/* Coluna Direita: Contratos Salvos no R2 */}
        <div>
          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: 700,
                color: "#e2e8f0",
              }}
            >
              Contratos Salvos
            </h2>
            <ContractList
              contracts={contracts}
              onEdit={handleStartEdit}
              onDelete={(id) => deleteContract(id, loadContractsAndPlots)}
              onDownload={downloadGeoJson}
              downloadingKey={downloadingKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
