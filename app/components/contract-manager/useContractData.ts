import { useState, useEffect } from "react";
import type { ContractRecord } from "@/app/lib/contractStore";
import type { PlotMasterRecord } from "@/app/lib/plotMasterData";

/**
 * Hook para gerenciar os dados de contratos e plots mestres
 */
export function useContractData() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [plotMasterList, setPlotMasterList] = useState<PlotMasterRecord[]>([]);

  const loadContractsAndPlots = async () => {
    try {
      const resContracts = await fetch("/api/r2/copy-contract");
      if (resContracts.ok) {
        const dataContracts = await resContracts.json();
        if (dataContracts.contracts) setContracts(dataContracts.contracts);
      }

      const resPlots = await fetch("/api/plot-lookup");
      if (resPlots.ok) {
        const dataPlots = await resPlots.json();
        if (dataPlots.plots && dataPlots.plots.length > 0) {
          setPlotMasterList(dataPlots.plots);
        }
      }
    } catch {
      // Ignorar falhas silenciosas
    }
  };

  useEffect(() => {
    // Load initial data from API on mount
    loadContractsAndPlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    contracts,
    setContracts,
    plotMasterList,
    loadContractsAndPlots,
  };
}
