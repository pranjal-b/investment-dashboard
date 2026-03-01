/**
 * Zustand store for Investment Dashboard
 * Holds holdings and filters; selectors compute derived state
 */

import { create } from "zustand";
import { subYears } from "date-fns";
import type {
  Holding,
  PortfolioMetrics,
  AssetAllocation,
  SectorExposure,
  MarketCapExposure,
} from "@/lib/types";
import { computePortfolioMetrics } from "@/lib/calculations/metrics";
import {
  computeResidualAllocation,
  computeSectorExposure,
  computeMarketCapExposure,
} from "@/lib/calculations/exposure";

const defaultDateRange: [Date, Date] = [
  subYears(new Date(), 3),
  new Date(),
];

import type { DashboardFilters } from "@/lib/types";

const defaultFilters: DashboardFilters = {
  assetClasses: [],
  sectors: [],
  marketCaps: [],
  dateRange: defaultDateRange,
  valueMode: "absolute",
  gainFilter: "all",
  selectedSector: null,
};

function applyFilters(holdings: Holding[], filters: DashboardFilters): Holding[] {
  let result = [...holdings];

  if (filters.assetClasses.length > 0) {
    result = result.filter((h) => filters.assetClasses.includes(h.assetType));
  }
  if (filters.sectors.length > 0) {
    result = result.filter((h) => {
      if (h.sectorSplit) {
        return Object.keys(h.sectorSplit).some((s) =>
          filters.sectors.includes(s)
        );
      }
      return filters.sectors.includes(h.sector);
    });
  }
  if (filters.marketCaps.length > 0) {
    result = result.filter((h) => filters.marketCaps.includes(h.marketCap));
  }
  if (filters.selectedSector) {
    result = result.filter((h) => {
      if (h.sectorSplit && filters.selectedSector) {
        return filters.selectedSector in h.sectorSplit;
      }
      return h.sector === filters.selectedSector;
    });
  }
  if (filters.gainFilter === "gain") {
    result = result.filter((h) => h.currentValue > h.investedAmount);
  } else if (filters.gainFilter === "loss") {
    result = result.filter((h) => h.currentValue < h.investedAmount);
  }

  return result;
}

interface DashboardState {
  holdings: Holding[];
  filters: DashboardFilters;

  setHoldings: (holdings: Holding[]) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setSelectedSector: (sector: string | null) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  holdings: [],
  filters: defaultFilters,

  setHoldings: (holdings) => set({ holdings }),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  setSelectedSector: (sector) =>
    set((state) => ({
      filters: { ...state.filters, selectedSector: sector },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));

// Selectors - compute derived state from store
export function useFilteredHoldings(): Holding[] {
  const holdings = useDashboardStore((s) => s.holdings);
  const filters = useDashboardStore((s) => s.filters);
  return applyFilters(holdings, filters);
}

export function usePortfolioMetrics(): PortfolioMetrics {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  return computePortfolioMetrics(holdings, dateRange ?? undefined);
}

export function useAllocation(): AssetAllocation[] {
  const holdings = useFilteredHoldings();
  return computeResidualAllocation(holdings);
}

export function useSectorExposure(): SectorExposure[] {
  const holdings = useFilteredHoldings();
  return computeSectorExposure(holdings);
}

export function useMarketCapExposure(): MarketCapExposure[] {
  const holdings = useFilteredHoldings();
  return computeMarketCapExposure(holdings);
}
