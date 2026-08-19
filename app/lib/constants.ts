/**
 * Constantes da aplicação EUDR
 * Centraliza valores padrão e configurações
 */

export const today = new Date().toISOString().slice(0, 10);

export const shapefileDetailFields = new Set<keyof FormState>([
  "plotId", "farm", "producer", "supplier", "region", "municipality", "state",
  "mappedAt", "mappedBy", "car",
]);

export type FormState = {
  plotId: string;
  farm: string;
  producer: string;
  supplier: string;
  region: string;
  municipality: string;
  state: string;
  mappedAt: string;
  checkedAt: string;
  compliance: string;
  notes: string;
  mappedBy: string;
  car: string;
};

export const initialForm: FormState = {
  plotId: "",
  farm: "",
  producer: "",
  supplier: "",
  region: "",
  municipality: "",
  state: "",
  mappedAt: today,
  checkedAt: today,
  compliance: "",
  notes: "",
  mappedBy: "",
  car: "",
};

export const emptyMapbiomasCheck: MapbiomasCheck = {
  status: "idle" as const,
  areaHa: 0,
  checkedAt: "",
  message: "",
  verificationUrl: "",
  changes: [],
};

export type Municipality = {
  id: number;
  name: string;
  stateCode: string;
  stateName: string;
  region: string;
};

export type IbgeMunicipality = {
  "municipio-id"?: number;
  "municipio-nome"?: string;
  "UF-sigla"?: string;
  "UF-nome"?: string;
  "regiao-nome"?: string;
};

export type MapbiomasCheck = {
  status: "idle" | "loading" | "clear" | "attention" | "error";
  areaHa: number;
  checkedAt: string;
  message: string;
  verificationUrl: string;
  changes: Array<{
    fromYear: number;
    toYear: number;
    pixelValue: number;
    className: string;
    fromHa: number;
    toHa: number;
  }>;
};

// Configurações de upload
export const UPLOAD_CONFIG = {
  maxFileSizeMB: 50,
  acceptedFormats: [".geojson", ".json", ".kml", ".shp"],
};

// Configurações de cache do MapBiomas
export const MAPBIOMAS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Normaliza texto para comparação (remove acentos, lowercase)
 */
export function normalizedText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}
