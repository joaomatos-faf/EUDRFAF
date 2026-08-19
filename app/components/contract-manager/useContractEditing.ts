import { useState } from "react";
import type { ContractRecord } from "@/app/lib/contractStore";
import type { DraftLotItem } from "./types";

/**
 * Hook para gerenciar o estado de edição de contrato
 */
export function useContractEditing() {
  const [contractCode, setContractCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  const handleStartEditContract = (c: ContractRecord) => {
    setEditingContractId(c.id);
    setClientName(c.clientName);
    setContractCode(c.contractCode);
  };

  const handleCancelEdit = () => {
    setEditingContractId(null);
    setContractCode("");
    setClientName("");
  };

  return {
    contractCode,
    setContractCode,
    clientName,
    setClientName,
    isSaving,
    setIsSaving,
    editingContractId,
    setEditingContractId,
    handleStartEditContract,
    handleCancelEdit,
  };
}
