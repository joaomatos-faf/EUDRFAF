export interface ContractPlotItem {
  plotId: string;
  producer: string;
  supplier: string;
  farm: string;
  hectares: number;
  sourceGeojsonKey: string;
  targetGeojsonKey: string;
}

export interface ContractLotItem {
  id: string;
  lotNumber: string;
  region: string;
  plots: ContractPlotItem[];
}

export interface ContractRecord {
  id: string;
  contractCode: string;
  clientName: string;
  lots: ContractLotItem[];
  createdAt: string;
  createdBy: string;
}

import { getObjectFromR2, uploadToR2 } from "@/app/lib/r2";

const R2_INDEX_KEY = "contratos_clientes/contracts_index.json";

let memoryContractsStore: ContractRecord[] = [];

export function getContracts(): ContractRecord[] {
  return memoryContractsStore;
}

export async function loadContractsFromR2(): Promise<ContractRecord[]> {
  try {
    const buffer = await getObjectFromR2(R2_INDEX_KEY);
    if (buffer) {
      const text = buffer.toString("utf8");
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        memoryContractsStore = parsed;
        return memoryContractsStore;
      }
    }
  } catch (err) {
    console.warn("⚠️ Não foi possível carregar o índice de contratos do R2:", err);
  }
  return memoryContractsStore;
}

export async function saveContractsToR2(): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(memoryContractsStore, null, 2);
    await uploadToR2(R2_INDEX_KEY, jsonStr, "application/json");
    return true;
  } catch (err) {
    console.warn("⚠️ Não foi possível salvar o índice de contratos no R2:", err);
    return false;
  }
}

export function addContract(record: ContractRecord) {
  const existingIdx = memoryContractsStore.findIndex((c) => c.contractCode === record.contractCode);
  if (existingIdx >= 0) {
    memoryContractsStore[existingIdx] = record;
  } else {
    memoryContractsStore.unshift(record);
  }
}

export function updateContract(id: string, record: ContractRecord): boolean {
  const index = memoryContractsStore.findIndex((c) => c.id === id || c.contractCode === id);
  if (index >= 0) {
    memoryContractsStore[index] = {
      ...record,
      id: memoryContractsStore[index].id,
      createdAt: memoryContractsStore[index].createdAt,
    };
    return true;
  }
  addContract(record);
  return true;
}

export function deleteContract(id: string): boolean {
  const initialLen = memoryContractsStore.length;
  memoryContractsStore = memoryContractsStore.filter(
    (c) => c.id !== id && c.contractCode !== id
  );
  return memoryContractsStore.length < initialLen;
}
