/**
 * Zustand store for Investment Dashboard (HNI Portfolio Intelligence).
 * State = raw holdings + benchmark/peer data + filters. No derived metrics in state.
 * Selectors call analytics engines with memoization; UI consumes engine outputs only.
 */

import { create } from "zustand";
import { useCallback, useMemo } from "react";
import { subYears } from "date-fns";
import type {
  Holding,
  PortfolioMetrics,
  AssetAllocation,
  AssetType,
  InrScale,
  SectorExposure,
  MarketCapExposure,
  DashboardFilters,
} from "@/lib/types";
import { formatINRWithScale } from "@/lib/charts/chartTheme";
import {
  getPortfolioSnapshot,
  getAllocationBuckets,
  getReturnMetrics,
  getPeriodReturns,
  getRiskMetrics,
  getDebtRisk,
  getPolicyChecks,
  getFYPerformance,
  getRollingPerformance,
  getHoldingPeriodReturns,
} from "@/lib/analytics";
import {
  computeSectorExposure,
  computeMarketCapExposure,
} from "@/lib/calculations/exposure";
import { getAssetTypesForCoreOption } from "@/lib/coreBuckets";

const defaultDateRange: [Date, Date] = [
  subYears(new Date(), 3),
  new Date(),
];

const defaultFilters: DashboardFilters = {
  assetClasses: [],
  sectors: [],
  marketCaps: [],
  dateRange: defaultDateRange,
  valueMode: "absolute",
  gainFilter: "all",
  selectedSector: null,
  coreBucketSelection: [],
  coreSubCategorySelection: [],
  portfolioFilter: "all",
  fy: "2024-25",
  netCashFlowDays: 30,
  inrScale: "lac",
};

function applyFilters(holdings: Holding[], filters: DashboardFilters): Holding[] {
  let result = [...holdings];

  const bucketSelection = filters.coreBucketSelection ?? [];
  const subSelection = filters.coreSubCategorySelection ?? [];
  if (subSelection.length > 0) {
    const allowedTypes = new Set<import("@/lib/types").AssetType>();
    for (const v of subSelection) {
      for (const t of getAssetTypesForCoreOption(v)) allowedTypes.add(t);
    }
    if (allowedTypes.size > 0) {
      result = result.filter((h) => allowedTypes.has(h.assetType));
    } else {
      result = [];
    }
  } else if (bucketSelection.length > 0) {
    const allowedTypes = new Set<import("@/lib/types").AssetType>();
    for (const b of bucketSelection) {
      for (const t of getAssetTypesForCoreOption(b)) allowedTypes.add(t);
    }
    if (allowedTypes.size > 0) {
      result = result.filter((h) => allowedTypes.has(h.assetType));
    } else {
      result = [];
    }
  }
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

  const portfolioFilter = filters.portfolioFilter ?? "all";
  if (portfolioFilter !== "all") {
    result = result.filter((h) => (h.portfolioType ?? "Core") === portfolioFilter);
  }

  return result;
}

type BenchmarkPoint = { date: string; value: number };

interface DashboardState {
  holdings: Holding[];
  filters: DashboardFilters;
  benchmarkSeries: BenchmarkPoint[] | null;
  peerSeries: BenchmarkPoint[] | null;

  setHoldings: (holdings: Holding[]) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setSelectedSector: (sector: string | null) => void;
  setBenchmarkSeries: (series: BenchmarkPoint[] | null) => void;
  setPeerSeries: (series: BenchmarkPoint[] | null) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  holdings: [],
  filters: defaultFilters,
  benchmarkSeries: null,
  peerSeries: null,

  setHoldings: (holdings) => set({ holdings }),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  setSelectedSector: (sector) =>
    set((state) => ({
      filters: { ...state.filters, selectedSector: sector },
    })),

  setBenchmarkSeries: (series) => set({ benchmarkSeries: series }),
  setPeerSeries: (series) => set({ peerSeries: series }),

  resetFilters: () => set({ filters: defaultFilters }),
}));

// Base: filtered holdings (memoized)
export function useFilteredHoldings(): Holding[] {
  const holdings = useDashboardStore((s) => s.holdings);
  const filters = useDashboardStore((s) => s.filters);
  return useMemo(
    () => applyFilters(holdings, filters),
    [holdings, filters]
  );
}

// Engine-backed selectors (memoized by inputs)
export function usePortfolioSnapshot() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const netCashFlowDays = useDashboardStore((s) => s.filters.netCashFlowDays);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const peerSeries = useDashboardStore((s) => s.peerSeries);
  return useMemo(
    () =>
      getPortfolioSnapshot({
        holdings,
        dateRange,
        netCashFlowDays,
        benchmarkSeries: benchmarkSeries ?? undefined,
        peerSeries: peerSeries ?? undefined,
      }),
    [holdings, dateRange, netCashFlowDays, benchmarkSeries, peerSeries]
  );
}

export function useAllocationBuckets() {
  const holdings = useFilteredHoldings();
  return useMemo(() => getAllocationBuckets({ holdings }), [holdings]);
}

export function useReturnMetrics() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const peerSeries = useDashboardStore((s) => s.peerSeries);
  return useMemo(
    () =>
      getReturnMetrics({
        holdings,
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
        peerSeries: peerSeries ?? undefined,
      }),
    [holdings, dateRange, benchmarkSeries, peerSeries]
  );
}

export function usePeriodReturns() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const peerSeries = useDashboardStore((s) => s.peerSeries);
  return useMemo(
    () =>
      getPeriodReturns({
        holdings,
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
        peerSeries: peerSeries ?? undefined,
      }),
    [holdings, dateRange, benchmarkSeries, peerSeries]
  );
}

export function useRiskMetrics() {
  const holdings = useFilteredHoldings();
  return useMemo(() => getRiskMetrics({ holdings }), [holdings]);
}

export function useDebtRisk() {
  const holdings = useFilteredHoldings();
  return useMemo(() => getDebtRisk({ holdings }), [holdings]);
}

export function usePolicyChecks() {
  const holdings = useFilteredHoldings();
  return useMemo(() => getPolicyChecks({ holdings }), [holdings]);
}

export function useFYPerformance() {
  const holdings = useFilteredHoldings();
  const fy = useDashboardStore((s) => s.filters.fy);
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  return useMemo(
    () =>
      getFYPerformance({
        holdings,
        fy: fy ?? "2024-25",
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
      }),
    [holdings, fy, dateRange, benchmarkSeries]
  );
}

export function useRollingPerformance() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const fy = useDashboardStore((s) => s.filters.fy);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  return useMemo(
    () =>
      getRollingPerformance({
        holdings,
        fy: fy ?? "2024-25",
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
      }),
    [holdings, dateRange, fy, benchmarkSeries]
  );
}

export function useHoldingPeriodReturns() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  return useMemo(
    () =>
      getHoldingPeriodReturns({
        holdings,
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
      }),
    [holdings, dateRange, benchmarkSeries]
  );
}

// Legacy selectors: derive from engines for backward compatibility
export function usePortfolioMetrics(): PortfolioMetrics {
  const snapshot = usePortfolioSnapshot();
  const buckets = useAllocationBuckets();
  const allocationDeviation = useMemo(
    () => buckets.reduce((s, b) => s + Math.abs(b.residualPct), 0),
    [buckets]
  );
  return useMemo(
    () => ({
      totalInvested: snapshot.totalCostValue,
      currentValue: snapshot.portfolioMarketValue,
      absoluteGain: snapshot.absoluteGainRs,
      gainPercent: snapshot.absoluteGainPct,
      portfolioXIRR: snapshot.portfolioXIRR,
      allocationDeviation,
    }),
    [snapshot, allocationDeviation]
  );
}

const bucketToAssetType: Record<string, AssetType> = {
  DirectEquity: "Equity",
  EquityMF: "MutualFund",
  DebtMF: "DebtMF",
  AlternativeFOF: "AIF",
  PMS: "PMS",
  AIF: "AIF",
  ETF: "ETF",
  IndexFund: "IndexFund",
};

export function useAllocation(): AssetAllocation[] {
  const buckets = useAllocationBuckets();
  return useMemo(
    () =>
      buckets.map((b) => ({
        assetType: bucketToAssetType[b.bucketId] ?? "MutualFund",
        actualPct: b.allocationPct,
        targetPct: b.targetPct,
        value: b.marketValue,
        residualPct: b.residualPct,
      })),
    [buckets]
  );
}

export function useSectorExposure(): SectorExposure[] {
  const holdings = useFilteredHoldings();
  return useMemo(() => computeSectorExposure(holdings), [holdings]);
}

export function useMarketCapExposure(): MarketCapExposure[] {
  const holdings = useFilteredHoldings();
  return useMemo(() => computeMarketCapExposure(holdings), [holdings]);
}

/** Format INR using current filter scale (absolute / lac / cr) */
export function useFormatINR(): (value: number) => string {
  const inrScale = useDashboardStore((s) => s.filters.inrScale ?? "lac");
  return useCallback(
    (value: number) => formatINRWithScale(value, inrScale as InrScale),
    [inrScale]
  );
}
