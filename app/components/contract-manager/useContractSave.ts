import { useState } from "react";
import type { DraftLotItem } from "./types";

/**
 * Hook para gerenciar a lógica de salvamento do contrato
 */
export function useContractSave(lots: DraftLotItem[], loggedUserKey?: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const validateContract = (contractCode: string, clientName: string): string | null => {
    if (!contractCode.trim() || !clientName.trim()) {
      return "⚠️ Preencha o código do contrato e o nome do cliente.";
    }

    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      if (!lot.plots || lot.plots.length === 0) {
        return `⚠️ Adicione ao menos 1 talhão ao ${lot.lotNumber || `Lote ${i + 1}`}.`;
      }
      for (let j = 0; j < lot.plots.length; j++) {
        if (!lot.plots[j].plotId.trim()) {
          return `⚠️ Preencha o Código do Talhão ${j + 1} no ${lot.lotNumber || `Lote ${i + 1}`}.`;
        }
      }
    }

    return null;
  };

  const saveContract = async (
    contractCode: string,
    clientName: string,
    editingContractId: string | null,
    contracts: { contractCode: string }[],
    onRefresh: () => void,
    onCancel: () => void
  ): Promise<boolean> => {
    const validationError = validateContract(contractCode, clientName);
    if (validationError) {
      alert(validationError);
      return false;
    }

    const isContractCodeDuplicate =
      !editingContractId && contractCode.trim()
        ? contracts.some(
            (c) =>
              c.contractCode.trim().toUpperCase() ===
              contractCode.trim().toUpperCase()
          )
        : false;

    if (isContractCodeDuplicate) {
      alert(
        `⚠️ Já existe um contrato cadastrado com o código "${contractCode
          .trim()
          .toUpperCase()}".\n\nPor favor, informe um código diferente.`
      );
      return false;
    }

    setIsSaving(true);
    try {
      // Salva plots no lookup
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
          `✅ Contrato ${data.record.contractCode} ${isEditing ? "atualizado" : "criado"} com sucesso no Cloudflare R2!`
        );
        onCancel();
        onCancel();
        onRefresh();
        return true;
      } else {
        throw new Error(data.error || "Erro ao salvar contrato.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao processar contrato.";
      alert(`⚠️ ${msg}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteContract = async (id: string, onRefresh: () => void) => {
    if (!confirm("Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const res = await fetch(`/api/r2/copy-contract?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Contrato excluído com sucesso!");
        onRefresh();
      } else {
        throw new Error(data.error || "Erro ao excluir contrato.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir contrato.";
      alert(`⚠️ ${msg}`);
    }
  };

  const downloadGeoJson = async (storageKey: string) => {
    setDownloadingKey(storageKey);
    try {
      const res = await fetch(`/api/r2/download?key=${encodeURIComponent(storageKey)}`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = `${storageKey.split('/').pop() || 'contract'}.zip`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(data.error || "Não foi possível obter a URL do R2.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao baixar.";
      alert(`⚠️ ${msg}`);
    } finally {
      setDownloadingKey(null);
    }
  };

  return {
    isSaving,
    downloadingKey,
    saveContract,
    deleteContract,
    downloadGeoJson,
  };
}
