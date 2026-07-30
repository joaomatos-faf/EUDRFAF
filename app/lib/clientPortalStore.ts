export interface PublishedPlotRecord {
  id: string;
  plotId: string;
  contractId: string;
  producer: string;
  farm: string;
  municipality: string;
  state: string;
  area: number;
  compliance: string;
  publishedAt: string;
  publishedBy: string;
  geojsonKey: string;
  xlsxKey: string;
  shapeKey: string;
}

let memoryPublishedStore: PublishedPlotRecord[] = [
  {
    id: "pub-001",
    plotId: "FAFDRAN-01",
    contractId: "2026-C001",
    producer: "Adilson Reis",
    farm: "Sítio Dutra",
    municipality: "Divinolândia",
    state: "SP",
    area: 1.78,
    compliance: "CONFORME",
    publishedAt: new Date().toISOString(),
    publishedBy: "joao.matos",
    geojsonKey: "contratos/2026-C001/FAFDRAN-01/FAFDRAN-01.geojson",
    xlsxKey: "contratos/2026-C001/FAFDRAN-01/FAFDRAN-01-cadastro.xlsx",
    shapeKey: "contratos/2026-C001/FAFDRAN-01/FAFDRAN-01-shapefile.zip",
  },
];

export function getPublishedPlots(contractId?: string): PublishedPlotRecord[] {
  if (!contractId || contractId.trim() === "" || contractId === "TODOS") {
    return memoryPublishedStore;
  }
  return memoryPublishedStore.filter((p) => p.contractId.toLowerCase() === contractId.toLowerCase());
}

export function addPublishedPlot(record: PublishedPlotRecord) {
  const existingIdx = memoryPublishedStore.findIndex((p) => p.plotId === record.plotId && p.contractId === record.contractId);
  if (existingIdx >= 0) {
    memoryPublishedStore[existingIdx] = record;
  } else {
    memoryPublishedStore.unshift(record);
  }
}
