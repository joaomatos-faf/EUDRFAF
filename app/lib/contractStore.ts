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

let memoryContractsStore: ContractRecord[] = [
  {
    id: "cnt-001",
    contractCode: "2026-C001",
    clientName: "Bremen Importers GmbH",
    lots: [
      {
        id: "lot-01",
        lotNumber: "LOTE 01",
        region: "MOGIANA",
        plots: [
          {
            plotId: "P2401",
            producer: "Adonis Cerri",
            supplier: "Produtor / Gram Cerri",
            farm: "Fazenda da Mata",
            hectares: 9.13,
            sourceGeojsonKey: "mapping_eudr_data/MOGIANA/ADONIS_CERRI/FAZENDA_DA_MATA/P2401.geojson",
            targetGeojsonKey: "contratos_clientes/BREMEN_IMPORTERS_GMBH/2026-C001/LOTE_01/P2401.geojson",
          },
          {
            plotId: "P2402",
            producer: "Adonis Cerri",
            supplier: "Produtor / Gram Cerri",
            farm: "Fazenda da Mata",
            hectares: 16.8,
            sourceGeojsonKey: "mapping_eudr_data/MOGIANA/ADONIS_CERRI/FAZENDA_DA_MATA/P2402.geojson",
            targetGeojsonKey: "contratos_clientes/BREMEN_IMPORTERS_GMBH/2026-C001/LOTE_01/P2402.geojson",
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    createdBy: "joao.matos",
  },
];

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
