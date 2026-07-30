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
