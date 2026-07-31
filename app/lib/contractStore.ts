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

let memoryContractsStore: ContractRecord[] = [];

export function getContracts(): ContractRecord[] {
  return memoryContractsStore;
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
