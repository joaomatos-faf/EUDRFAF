export interface ContractPlotItem {
  plotId: string;
  supplier: string;
  farm: string;
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
            plotId: "FAFDRAN-01",
            supplier: "Adilson Reis",
            farm: "Sítio Dutra",
            sourceGeojsonKey: "mapping_eudr_data/MOGIANA/ADILSON_REIS/SITIO_DUTRA/FAFDRAN-01.geojson",
            targetGeojsonKey: "contratos_clientes/BREMEN_IMPORTERS_GMBH/2026-C001/LOTE_01/FAFDRAN-01.geojson",
          },
          {
            plotId: "FAFDRAV-01",
            supplier: "Valdir Silva",
            farm: "Fazenda Primavera",
            sourceGeojsonKey: "mapping_eudr_data/MOGIANA/VALDIR_SILVA/FAZENDA_PRIMAVERA/FAFDRAV-01.geojson",
            targetGeojsonKey: "contratos_clientes/BREMEN_IMPORTERS_GMBH/2026-C001/LOTE_01/FAFDRAV-01.geojson",
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
