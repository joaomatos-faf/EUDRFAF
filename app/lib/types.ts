export interface UserProfile {
  pass?: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
}

export interface MapbiomasCheckResponse {
  status: "conforme" | "alerta" | "erro";
  hasDeforestationPost2020: boolean;
  alertCount: number;
  message: string;
  alerts?: Array<{
    id: string;
    year: number;
    areaHa: number;
    biome?: string;
  }>;
  geometryHash?: string;
  fromCache?: boolean;
}

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

export type ActiveView = "landing" | "app" | "portal" | "contratos" | "dashboard";

export const EMPTY_MAPBIOMAS_CHECK: MapbiomasCheck = {
  status: "idle",
  areaHa: 0,
  checkedAt: "",
  message: "",
  verificationUrl: "",
  changes: [],
};

export const today = (): string => new Date().toISOString().slice(0, 10);

export const SHAPEFILE_DETAIL_FIELDS = new Set<keyof FormState>([
  "plotId", "farm", "producer", "supplier", "region", "municipality", "state",
  "mappedAt", "mappedBy", "car",
]);

export const INITIAL_FORM: FormState = {
  plotId: "",
  farm: "",
  producer: "",
  supplier: "",
  region: "",
  municipality: "",
  state: "",
  mappedAt: today(),
  checkedAt: today(),
  compliance: "",
  notes: "",
  mappedBy: "",
  car: "",
};

/** Normaliza texto para busca (remove acentos, lowercase) */
export function normalizedText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
