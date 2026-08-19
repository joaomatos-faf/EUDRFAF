import { useState, useRef, useMemo } from "react";
import type { PlotMasterRecord } from "@/app/lib/plotMasterData";
import type { DraftLotItem } from "./types";
import { EMPTY_LOT } from "./types";

/**
 * Hook para gerenciar os lotes do contrato
 */
export function useContractLots(
  plotMasterList: PlotMasterRecord[],
  initialLots: DraftLotItem[] = [EMPTY_LOT]
) {
  const [lots, setLots] = useState<DraftLotItem[]>(initialLots);
  const lotsContainerRef = useRef<HTMLDivElement>(null);

  const grandTotalHectares = useMemo(() => {
    return lots.reduce((total, lot) => {
      const lotSum = lot.plots.reduce(
        (sum, p) => sum + (Number(p.hectares) || 0),
        0
      );
      return total + lotSum;
    }, 0);
  }, [lots]);

  const totalPlotsCount = useMemo(() => {
    return lots.reduce((total, lot) => total + lot.plots.length, 0);
  }, [lots]);

  const handleAddLot = () => {
    const nextLotNum = `LOTE ${String(lots.length + 1).padStart(2, "0")}`;
    const collapsedPreviousLots = lots.map((lot) => ({
      ...lot,
      isCollapsed: true,
    }));

    setLots([
      ...collapsedPreviousLots,
      {
        lotNumber: nextLotNum,
        region: "",
        plots: [
          { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 },
        ],
        isCollapsed: false,
      },
    ]);

    setTimeout(() => {
      if (lotsContainerRef.current) {
        lotsContainerRef.current.scrollTo({
          top: lotsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 120);
  };

  const handleToggleCollapseLot = (index: number) => {
    setLots((prev) =>
      prev.map((lot, i) =>
        i === index ? { ...lot, isCollapsed: !lot.isCollapsed } : lot
      )
    );
  };

  const handleRemoveLot = (index: number) => {
    setLots((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleLotChange = (
    index: number,
    field: keyof Omit<DraftLotItem, "plots" | "isCollapsed">,
    value: string
  ) => {
    setLots((prev) =>
      prev.map((lot, i) => (i === index ? { ...lot, [field]: value } : lot))
    );
  };

  const handleAddPlotToLot = (lotIndex: number) => {
    setLots((prev) =>
      prev.map((lot, i) =>
        i === lotIndex
          ? {
              ...lot,
              plots: [
                ...lot.plots,
                { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 },
              ],
            }
          : lot
      )
    );
  };

  const handleRemovePlotFromLot = (lotIndex: number, plotIndex: number) => {
    setLots((prev) =>
      prev.map((lot, i) =>
        i === lotIndex && lot.plots.length > 1
          ? { ...lot, plots: lot.plots.filter((_, pi) => pi !== plotIndex) }
          : lot
      )
    );
  };

  const handlePlotIdInputChange = (
    lotIndex: number,
    plotIndex: number,
    rawValue: string
  ) => {
    const cleanId = rawValue.toUpperCase().trim();
    const normId = cleanId.replace(/[^A-Z0-9]/g, "");

    setLots((prev) =>
      prev.map((lot, li) => {
        if (li !== lotIndex) return lot;

        if (!cleanId) {
          const plots = lot.plots.map((p, pi) =>
            pi === plotIndex
              ? { plotId: "", producer: "", supplier: "", farm: "", hectares: 0 }
              : p
          );
          return { ...lot, plots };
        }

        const matched = plotMasterList.find(
          (p) =>
            p.plotId.toUpperCase().trim() === cleanId ||
            p.plotId.replace(/[^A-Z0-9]/g, "") === normId
        );

        const plots = lot.plots.map((p, pi) => {
          if (pi !== plotIndex) return p;
          if (matched) {
            return {
              plotId: matched.plotId || cleanId,
              producer: matched.producer,
              supplier: matched.supplier,
              farm: matched.farm,
              hectares: matched.hectares,
            };
          }
          return { ...p, plotId: cleanId };
        });

        const region =
          matched?.region && !lot.region
            ? matched.region.toUpperCase()
            : lot.region;

        return { ...lot, plots, region };
      })
    );
  };

  const handleSelectPlotMaster = (
    lotIndex: number,
    plotIndex: number,
    plot: PlotMasterRecord
  ) => {
    setLots((prev) =>
      prev.map((lot, li) => {
        if (li !== lotIndex) return lot;
        const plots = lot.plots.map((p, pi) =>
          pi === plotIndex
            ? {
                plotId: plot.plotId,
                producer: plot.producer,
                supplier: plot.supplier,
                farm: plot.farm,
                hectares: plot.hectares,
              }
            : p
        );
        const region =
          plot.region && !lot.region ? plot.region.toUpperCase() : lot.region;
        return { ...lot, plots, region };
      })
    );
  };

  const handlePlotFieldChange = (
    lotIndex: number,
    plotIndex: number,
    field: "producer" | "supplier" | "farm" | "hectares",
    value: string | number
  ) => {
    setLots((prev) =>
      prev.map((lot, li) => {
        if (li !== lotIndex) return lot;
        const plots = lot.plots.map((p, pi) =>
          pi === plotIndex
            ? {
                ...p,
                [field]:
                  field === "hectares"
                    ? parseFloat(String(value)) || 0
                    : String(value),
              }
            : p
        );
        return { ...lot, plots };
      })
    );
  };

  const handleAddMultiplePlotsToLot = (
    lotIdx: number,
    plotsToAdd: PlotMasterRecord[]
  ) => {
    setLots((prevLots) => {
      const newLots = [...prevLots];
      const targetLot = { ...newLots[lotIdx] };
      const newPlots = [...targetLot.plots];

      const lastPlot = newPlots[newPlots.length - 1];
      if (
        lastPlot &&
        !lastPlot.plotId.trim() &&
        (!lastPlot.hectares || lastPlot.hectares === 0)
      ) {
        newPlots.pop();
      }

      const existingIds = new Set(newPlots.map((p) => p.plotId.toUpperCase()));
      plotsToAdd.forEach((p) => {
        if (!existingIds.has(p.plotId.toUpperCase())) {
          newPlots.push({
            plotId: p.plotId,
            producer: p.producer,
            supplier: p.supplier,
            farm: p.farm,
            hectares: p.hectares,
          });
          if (p.region && !targetLot.region) {
            targetLot.region = p.region.toUpperCase();
          }
        }
      });

      targetLot.plots = newPlots;
      newLots[lotIdx] = targetLot;
      return newLots;
    });
  };

  const resetLots = (newLots?: DraftLotItem[]) => {
    setLots(newLots ?? [EMPTY_LOT]);
  };

  return {
    lots,
    setLots,
    lotsContainerRef,
    grandTotalHectares,
    totalPlotsCount,
    handleAddLot,
    handleToggleCollapseLot,
    handleRemoveLot,
    handleLotChange,
    handleAddPlotToLot,
    handleRemovePlotFromLot,
    handlePlotIdInputChange,
    handleSelectPlotMaster,
    handlePlotFieldChange,
    handleAddMultiplePlotsToLot,
    resetLots,
  };
}
