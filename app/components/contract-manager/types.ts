/** Tipos para o ContractManagerView */

export interface DraftPlotItem {
  plotId: string;
  producer: string;
  supplier: string;
  farm: string;
  hectares: number;
}

export interface DraftLotItem {
  lotNumber: string;
  region: string;
  plots: DraftPlotItem[];
  isCollapsed?: boolean;
}

export interface ContractManagerViewProps {
  onOpenLanding: () => void;
  onOpenDashboard?: () => void;
  loggedUserKey?: string;
}

/** Estado inicial de um lote vazio */
export const EMPTY_LOT: DraftLotItem = {
  lotNumber: "LOTE 01",
  region: "",
  plots: [{ plotId: "", producer: "", supplier: "", farm: "", hectares: 0 }],
  isCollapsed: false,
};

/** Cria um novo lote vazio com número sequencial */
export function createEmptyLot(lotNumber: number): DraftLotItem {
  return {
    lotNumber: `LOTE ${String(lotNumber).padStart(2, "0")}`,
    region: "",
    plots: [{ plotId: "", producer: "", supplier: "", farm: "", hectares: 0 }],
    isCollapsed: false,
  };
}
