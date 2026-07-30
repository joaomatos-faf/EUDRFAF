export interface ContractPlotItem {
  plotId: string;
  sourceGeojsonKey: string;
  targetGeojsonKey: string;
}

export interface ContractLotItem {
  id: string;
  lotNumber: string;
  region: string;
  supplier: string;
  farm: string;
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
        supplier: "Adilson Reis",
        farm: "Sítio Dutra",
        plots: [
          {
            plotId: "FAFDRAN-01",
            sourceGeojsonKey: "mapping_eudr_data/MOGIANA/ADILSON_REIS/SITIO_DUTRA/FAFDRAN-01.geojson",
            targetGeojsonKey: "contratos_clientes/BREMEN_IMPORTERS_GMBH/2026-C001/LOTE_01/FAFDRAN-01.geojson",
          },
          {
            plotId: "FAFDRAN-02",
            sourceGeojsonKey: "mapping_eudr_data/MOGIANA/ADILSON_REIS/SITIO_DUTRA/FAFDRAN-02.geojson",
            targetGeojsonKey: "contratos_clientes/BREMEN_IMPORTERS_GMBH/2026-C001/LOTE_01/FAFDRAN-02.geojson",
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
