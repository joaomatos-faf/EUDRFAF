export interface PublishedPlotRecord {
  id: string;
  plotId: string;
  contractId: string;
  producer: string;
  supplier?: string;
  farm: string;
  region: string;
  municipality: string;
  state: string;
  area: number;
  compliance: string;
  publishedAt: string;
  publishedBy: string;
  geojsonKey: string;
  clientName?: string;
  geometry?: any;
}

import { getContracts, loadContractsFromR2 } from "./contractStore";
import { getObjectFromR2, uploadToR2, listR2Objects } from "./r2";

const PUBLISHED_R2_INDEX_KEY = "contratos_clientes/published_plots_index.json";

let memoryPublishedStore: PublishedPlotRecord[] = [
  {
    id: "pub-001",
    plotId: "FAFDRAN-01",
    contractId: "2026-C001",
    producer: "Adilson Reis",
    supplier: "Adilson Reis",
    farm: "Sítio Dutra",
    region: "MOGIANA",
    municipality: "Divinolândia",
    state: "SP",
    area: 1.78,
    compliance: "CONFORME",
    publishedAt: new Date().toISOString(),
    publishedBy: "joao.matos",
    geojsonKey: "mapping_eudr_data/MOGIANA/ADILSON_REIS/SITIO_DUTRA/FAFDRAN-01.geojson",
  },
];

export async function loadPublishedPlotsFromR2(): Promise<PublishedPlotRecord[]> {
  try {
    const buffer = await getObjectFromR2(PUBLISHED_R2_INDEX_KEY);
    if (buffer) {
      const text = buffer.toString("utf8");
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryPublishedStore = parsed;
      }
    }
  } catch (err) {
    console.warn("⚠️ Não foi possível carregar índice de talhões publicados do R2:", err);
  }
  return memoryPublishedStore;
}

export async function savePublishedPlotsToR2(): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(memoryPublishedStore, null, 2);
    await uploadToR2(PUBLISHED_R2_INDEX_KEY, jsonStr, "application/json");
    return true;
  } catch (err) {
    console.warn("⚠️ Não foi possível salvar índice de talhões publicados no R2:", err);
    return false;
  }
}

export async function getAllCloudR2Plots(contractId?: string, clientName?: string): Promise<PublishedPlotRecord[]> {
  const allPlotsMap = new Map<string, PublishedPlotRecord>();

  // 1. Plots publicados explicitamente via R2 publish / memoryPublishedStore
  for (const plot of memoryPublishedStore) {
    const key = `${plot.contractId}_${plot.plotId}`;
    allPlotsMap.set(key, plot);
  }

  // 2. Plots de todos os contratos criados no sistema (getContracts)
  const contracts = getContracts();
  for (const contract of contracts) {
    for (const lot of contract.lots) {
      for (const plot of lot.plots) {
        const key = `${contract.contractCode}_${plot.plotId}`;
        if (!allPlotsMap.has(key)) {
          allPlotsMap.set(key, {
            id: `contract-plot-${contract.contractCode}-${plot.plotId}`,
            plotId: plot.plotId,
            contractId: contract.contractCode,
            clientName: contract.clientName,
            producer: plot.producer || "N/A",
            supplier: plot.supplier || plot.producer || "N/A",
            farm: plot.farm || "N/A",
            region: lot.region || "GERAL",
            municipality: "N/A",
            state: "N/A",
            area: plot.hectares || 0,
            compliance: "CONFORME",
            publishedAt: contract.createdAt || new Date().toISOString(),
            publishedBy: contract.createdBy || "Sistema",
            geojsonKey: plot.targetGeojsonKey || plot.sourceGeojsonKey || `contratos_clientes/${contract.contractCode}/${plot.plotId}.geojson`,
          });
        }
      }
    }
  }

  // 3. Varredura direta de arquivos físicos no bucket R2 (apenas se não for restrito a um cliente específico sem vínculo)
  try {
    const r2Items = await listR2Objects();
    for (const item of r2Items) {
      const parts = item.key.split("/");
      const filename = parts.pop() || item.key;
      const cleanPlotId = filename.replace(/\.geojson$/i, "").replace(/\.zip$/i, "").replace(/\.kml$/i, "");
      
      const existsByGeoKey = Array.from(allPlotsMap.values()).some((p) => p.geojsonKey === item.key);
      if (!existsByGeoKey && cleanPlotId) {
        let contractCode = "AVULSO / NUVEM";
        let producerName = "Nuvem R2";
        let farmName = "Geral";

        if (parts.length >= 2 && parts[0] === "contratos_clientes") {
          contractCode = parts[1];
        } else if (parts.length >= 3 && parts[0] === "mapping_eudr_data") {
          producerName = parts[2].replace(/_/g, " ");
          if (parts[3]) farmName = parts[3].replace(/_/g, " ");
        }

        allPlotsMap.set(`r2-raw-${item.key}`, {
          id: `r2-raw-${item.key}`,
          plotId: cleanPlotId,
          contractId: contractCode,
          clientName: producerName,
          producer: producerName,
          supplier: producerName,
          farm: farmName,
          region: parts[1] || "NUVEM R2",
          municipality: "N/A",
          state: "N/A",
          area: 0,
          compliance: "CONFORME",
          publishedAt: item.lastModified,
          publishedBy: "Cloudflare R2",
          geojsonKey: item.key,
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ Não foi possível listar arquivos brutos do R2:", err);
  }

  let result = Array.from(allPlotsMap.values());

  // Filtro por Cliente
  if (clientName && clientName.trim() !== "") {
    const targetClient = clientName.toLowerCase().trim();
    result = result.filter((p) => {
      const pClient = (p.clientName || "").toLowerCase().trim();
      const pProducer = (p.producer || "").toLowerCase().trim();
      const pSupplier = (p.supplier || "").toLowerCase().trim();
      return (
        (pClient && (pClient.includes(targetClient) || targetClient.includes(pClient))) ||
        (pProducer && (pProducer.includes(targetClient) || targetClient.includes(pProducer))) ||
        (pSupplier && (pSupplier.includes(targetClient) || targetClient.includes(pSupplier)))
      );
    });
  }

  // Filtro por Contrato
  if (!contractId || contractId.trim() === "" || contractId === "TODOS") {
    return result;
  }
  return result.filter((p) => p.contractId.toLowerCase() === contractId.toLowerCase());
}

export function getPublishedPlots(contractId?: string, clientName?: string): PublishedPlotRecord[] {
  const allPlotsMap = new Map<string, PublishedPlotRecord>();

  for (const plot of memoryPublishedStore) {
    const key = `${plot.contractId}_${plot.plotId}`;
    allPlotsMap.set(key, plot);
  }

  const contracts = getContracts();
  for (const contract of contracts) {
    for (const lot of contract.lots) {
      for (const plot of lot.plots) {
        const key = `${contract.contractCode}_${plot.plotId}`;
        if (!allPlotsMap.has(key)) {
          allPlotsMap.set(key, {
            id: `contract-plot-${contract.contractCode}-${plot.plotId}`,
            plotId: plot.plotId,
            contractId: contract.contractCode,
            clientName: contract.clientName,
            producer: plot.producer || "N/A",
            supplier: plot.supplier || plot.producer || "N/A",
            farm: plot.farm || "N/A",
            region: lot.region || "GERAL",
            municipality: "N/A",
            state: "N/A",
            area: plot.hectares || 0,
            compliance: "CONFORME",
            publishedAt: contract.createdAt || new Date().toISOString(),
            publishedBy: contract.createdBy || "Sistema",
            geojsonKey: plot.targetGeojsonKey || plot.sourceGeojsonKey || `contratos_clientes/${contract.contractCode}/${plot.plotId}.geojson`,
          });
        }
      }
    }
  }

  let result = Array.from(allPlotsMap.values());

  if (clientName && clientName.trim() !== "") {
    const targetClient = clientName.toLowerCase().trim();
    result = result.filter((p) => {
      const pClient = (p.clientName || "").toLowerCase().trim();
      const pProducer = (p.producer || "").toLowerCase().trim();
      const pSupplier = (p.supplier || "").toLowerCase().trim();
      return (
        (pClient && (pClient.includes(targetClient) || targetClient.includes(pClient))) ||
        (pProducer && (pProducer.includes(targetClient) || targetClient.includes(pProducer))) ||
        (pSupplier && (pSupplier.includes(targetClient) || targetClient.includes(pSupplier)))
      );
    });
  }

  if (!contractId || contractId.trim() === "" || contractId === "TODOS") {
    return result;
  }
  return result.filter((p) => p.contractId.toLowerCase() === contractId.toLowerCase());
}

export function addPublishedPlot(record: PublishedPlotRecord) {
  const existingIdx = memoryPublishedStore.findIndex((p) => p.plotId === record.plotId && p.contractId === record.contractId);
  if (existingIdx >= 0) {
    memoryPublishedStore[existingIdx] = record;
  } else {
    memoryPublishedStore.unshift(record);
  }
  savePublishedPlotsToR2().catch(() => {});
}
