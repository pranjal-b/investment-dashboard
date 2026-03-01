/**
 * Zustand store for Investment Dashboard (HNI Portfolio Intelligence).
 * State = raw holdings + benchmark/peer data + filters. No derived metrics in state.
 * Selectors call analytics engines with memoization; UI consumes engine outputs only.
 */

import { create } from "zustand";
import { useCallback, useMemo } from "react";
import type {
  Holding,
  PortfolioMetrics,
  AssetAllocation,
  AssetType,
  SectorExposure,
  MarketCapExposure,
  DashboardFilters,
  ReportingUnits,
} from "@/lib/types";
import { formatINRWithScale } from "@/lib/charts/chartTheme";
import {
  getPortfolioSnapshot,
  getAllocationBuckets,
  getMacroAllocation,
  getRebalanceInsight,
  getAllocationHealthScore,
  getTopHoldingsByDeviation,
  getReturnMetrics,
  getPeriodReturns,
  getBucketPeriodReturns,
  getRiskMetrics,
  getDebtRisk,
  getPolicyChecks,
  getFYPerformance,
  getFYPerformanceByCategory,
  getFYPerformanceByVehicle,
  getRollingPerformance,
  getHoldingPeriodReturns,
} from "@/lib/analytics";
import {
  computeSectorExposure,
  computeMarketCapExposure,
} from "@/lib/calculations/exposure";
import { getAssetTypesForCoreOption } from "@/lib/coreBuckets";
import { getCurrentFY } from "@/lib/performance/fyEngine";
import { runAggregationEngine } from "@/lib/performance/aggregationEngine";
import { runBenchmarkEngine } from "@/lib/performance/benchmarkEngine";
import type { PerformanceChartData, PerformanceSeries } from "@/lib/performance/types";

/** Clean FY 2025-26 sample data (indexed 100, realistic volatility) for demo when FY is 2025-26, MoM, portfolio view */
const FY_2025_26_SAMPLE = {
  xAxisPeriods: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  portfolioIndexed: [100, 102.4, 101.2, 104.8, 107.1, 105.6, 109.4, 112.2, 114.6, 111.8, 116.3, 119.7] as (number | null)[],
  benchmarkIndexed: [100, 101.8, 100.9, 103.6, 105.2, 104.3, 107.1, 109.8, 111.9, 110.2, 113.5, 115.4] as (number | null)[],
  portfolioReturnPct: [0, 2.4, -1.2, 3.6, 2.2, -1.4, 3.6, 2.6, 2.1, -2.4, 4.0, 2.9] as (number | null)[],
  benchmarkReturnPct: [0, 1.8, -0.9, 2.7, 1.5, -0.9, 2.7, 2.5, 1.9, -1.5, 3.0, 1.7] as (number | null)[],
  initialPortfolioValue: 12000000,
};

/** Indian FY = Apr–Mar. Returns April 1 of the current FY (based on system date). */
function getStartOfCurrentFY(): Date {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: Jan=0, Apr=3
  if (month >= 3) return new Date(year, 3, 1); // Apr 1 this year
  return new Date(year - 1, 3, 1); // Apr 1 last year
}

const defaultDateRange: [Date, Date] = [
  getStartOfCurrentFY(),
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
  scopeAssetClass: "all",
  vehicleFilter: "all",
  dateRangePreset: "custom",
  coreBucketSelection: [],
  coreSubCategorySelection: [],
  portfolioFilter: "all",
  fy: "2024-25",
  performanceFY: getCurrentFY(),
  performanceFrequency: "mom",
  performanceBenchmarks: ["nifty50"],
  performanceYAxisMode: "indexed",
  performanceViewBy: "portfolio",
  performanceMatrixScenario: "moderate",
  netCashFlowDays: 30,
  reportingCurrency: "INR",
  reportingUnits: "lac",
};

/** Scope bucket id → asset types (via coreBuckets) */
function getScopeAssetTypes(scope: string): AssetType[] {
  if (scope === "all") return [];
  return getAssetTypesForCoreOption(scope) ?? [];
}

/** Vehicle → asset types */
const VEHICLE_ASSET_TYPES: Record<string, AssetType[]> = {
  direct: ["Equity"],
  mf: ["MutualFund", "DebtMF"],
  pms: ["PMS"],
  aif: ["AIF"],
  etf: ["ETF"],
  index: ["IndexFund"],
  fof: ["MutualFund", "AIF"], // FOF can be MF or AIF
};

function applyFilters(holdings: Holding[], filters: DashboardFilters): Holding[] {
  let result = [...holdings];

  const scope = filters.scopeAssetClass ?? "all";
  const vehicle = filters.vehicleFilter ?? "all";
  const scopeTypes = getScopeAssetTypes(scope);
  const vehicleTypes = vehicle === "all" ? [] : (VEHICLE_ASSET_TYPES[vehicle] ?? []);

  if (scopeTypes.length > 0 || vehicleTypes.length > 0) {
    const allowed = new Set<AssetType>();
    if (scopeTypes.length > 0 && vehicleTypes.length > 0) {
      for (const t of scopeTypes) {
        if (vehicleTypes.includes(t)) allowed.add(t);
      }
    } else if (scopeTypes.length > 0) {
      scopeTypes.forEach((t) => allowed.add(t));
    } else {
      vehicleTypes.forEach((t) => allowed.add(t));
    }
    if (allowed.size > 0) {
      result = result.filter((h) => allowed.has(h.assetType));
    } else {
      result = [];
    }
  } else {
    const bucketSelection = filters.coreBucketSelection ?? [];
    const subSelection = filters.coreSubCategorySelection ?? [];
    if (subSelection.length > 0) {
      const allowedTypes = new Set<AssetType>();
      for (const v of subSelection) {
        for (const t of getAssetTypesForCoreOption(v)) allowedTypes.add(t);
      }
      if (allowedTypes.size > 0) {
        result = result.filter((h) => allowedTypes.has(h.assetType));
      } else {
        result = [];
      }
    } else if (bucketSelection.length > 0) {
      const allowedTypes = new Set<AssetType>();
      for (const b of bucketSelection) {
        for (const t of getAssetTypesForCoreOption(b)) allowedTypes.add(t);
      }
      if (allowedTypes.size > 0) {
        result = result.filter((h) => allowedTypes.has(h.assetType));
      } else {
        result = [];
      }
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

/** Map of benchmark key → time series (for multi-benchmark performance chart) */
export type BenchmarkSeriesByKey = Record<string, BenchmarkPoint[]>;

interface DashboardState {
  holdings: Holding[];
  filters: DashboardFilters;
  benchmarkSeries: BenchmarkPoint[] | null;
  /** Multi-benchmark: key (e.g. nifty50) → series; used by FY Performance chart */
  benchmarkSeriesByKey: BenchmarkSeriesByKey;
  peerSeries: BenchmarkPoint[] | null;

  setHoldings: (holdings: Holding[]) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setSelectedSector: (sector: string | null) => void;
  setBenchmarkSeries: (series: BenchmarkPoint[] | null) => void;
  setBenchmarkSeriesByKey: (key: string, series: BenchmarkPoint[] | null) => void;
  setPeerSeries: (series: BenchmarkPoint[] | null) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  holdings: [],
  filters: defaultFilters,
  benchmarkSeries: null,
  benchmarkSeriesByKey: {},
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

  setBenchmarkSeries: (series) =>
    set((state) => ({
      benchmarkSeries: series,
      benchmarkSeriesByKey: {
        ...state.benchmarkSeriesByKey,
        ...(series ? { nifty50: series } : {}),
      },
    })),
  setBenchmarkSeriesByKey: (key, series) =>
    set((state) => ({
      benchmarkSeriesByKey: {
        ...state.benchmarkSeriesByKey,
        ...(series ? { [key]: series } : { [key]: [] }),
      },
    })),
  setPeerSeries: (series) => set({ peerSeries: series }),

  resetFilters: () => set({ filters: defaultFilters }),
}));

// Base: filtered holdings (memoized). Recomputes whenever holdings or any filter changes.
export function useFilteredHoldings(): Holding[] {
  const holdings = useDashboardStore((s) => s.holdings);
  const filters = useDashboardStore((s) => s.filters);
  return useMemo(() => applyFilters(holdings, filters), [holdings, filters]);
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

export interface PerformanceMatrixData {
  bucketRows: import("@/lib/analytics/types").BucketPeriodReturn[];
  benchmarkByPeriod: Record<string, number | null>;
  portfolioXIRR: number | null;
  benchmarkXIRR: number | null;
}

export function usePerformanceMatrixData(): PerformanceMatrixData {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const periodReturns = usePeriodReturns();
  const returnMetrics = useReturnMetrics();

  const bucketRows = useMemo(
    () =>
      getBucketPeriodReturns({
        holdings,
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
      }),
    [holdings, dateRange, benchmarkSeries]
  );

  const benchmarkByPeriod = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const row of periodReturns) {
      out[row.period] = row.benchmark;
    }
    return out;
  }, [periodReturns]);

  return useMemo(
    () => ({
      bucketRows,
      benchmarkByPeriod,
      portfolioXIRR: returnMetrics.portfolioXIRR,
      benchmarkXIRR: returnMetrics.benchmarkXIRR,
    }),
    [bucketRows, benchmarkByPeriod, returnMetrics.portfolioXIRR, returnMetrics.benchmarkXIRR]
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
  const performanceFY = useDashboardStore((s) => s.filters.performanceFY);
  const fyLegacy = useDashboardStore((s) => s.filters.fy);
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const fy = performanceFY ?? fyLegacy ?? getCurrentFY();
  return useMemo(
    () =>
      getFYPerformance({
        holdings,
        fy,
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
      }),
    [holdings, fy, dateRange, benchmarkSeries]
  );
}

export function useFYPerformanceByCategory() {
  const holdings = useFilteredHoldings();
  const performanceFY = useDashboardStore((s) => s.filters.performanceFY);
  const fyLegacy = useDashboardStore((s) => s.filters.fy);
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const fy = performanceFY ?? fyLegacy ?? getCurrentFY();
  return useMemo(
    () =>
      getFYPerformanceByCategory({
        holdings,
        fy,
        dateRange,
        benchmarkSeries: benchmarkSeries ?? undefined,
      }),
    [holdings, fy, dateRange, benchmarkSeries]
  );
}

export function useFYPerformanceByVehicle() {
  const holdings = useFilteredHoldings();
  const performanceFY = useDashboardStore((s) => s.filters.performanceFY);
  const fyLegacy = useDashboardStore((s) => s.filters.fy);
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const fy = performanceFY ?? fyLegacy ?? getCurrentFY();
  return useMemo(
    () =>
      getFYPerformanceByVehicle({
        holdings,
        fy,
        dateRange,
      }),
    [holdings, fy, dateRange]
  );
}

/** Turn period return % into indexed 100 series (null keeps previous or 100). */
function returnsToIndexed(returns: (number | null)[]): (number | null)[] {
  const out: (number | null)[] = [];
  let prev = 100;
  for (const r of returns) {
    if (r == null) {
      out.push(prev);
    } else {
      prev = prev * (1 + r / 100);
      out.push(prev);
    }
  }
  return out;
}

const VEHICLE_LABELS: Record<string, string> = {
  Equity: "Equity",
  MutualFund: "Mutual Fund",
  DebtMF: "Debt MF",
  PMS: "PMS",
  AIF: "AIF",
  ETF: "ETF",
  IndexFund: "Index Fund",
};

/** FY Performance chart: precomputed series from aggregation + benchmark engines (no business logic in chart). */
export function usePerformanceChartData(): PerformanceChartData | null {
  const holdings = useFilteredHoldings();
  const performanceFY = useDashboardStore((s) => s.filters.performanceFY);
  const performanceFrequency = useDashboardStore((s) => s.filters.performanceFrequency ?? "mom");
  const performanceBenchmarks = useDashboardStore((s) => s.filters.performanceBenchmarks);
  const performanceYAxisMode = useDashboardStore((s) => s.filters.performanceYAxisMode ?? "indexed");
  const performanceViewBy = useDashboardStore((s) => s.filters.performanceViewBy ?? "portfolio");
  const benchmarkSeriesByKey = useDashboardStore((s) => s.benchmarkSeriesByKey);
  const categoryData = useFYPerformanceByCategory();
  const vehicleData = useFYPerformanceByVehicle();

  return useMemo(() => {
    const fy = performanceFY ?? getCurrentFY();
    const mode = performanceYAxisMode;

    if (fy === "2025-26" && performanceFrequency === "mom" && performanceViewBy === "portfolio") {
      const s = FY_2025_26_SAMPLE;
      let portfolioValues: (number | null)[];
      let benchmarkValues: (number | null)[];
      if (mode === "value") {
        portfolioValues = s.portfolioIndexed.map((v) => (v != null ? (s.initialPortfolioValue * v) / 100 : null));
        benchmarkValues = s.benchmarkIndexed.map((v) => (v != null ? (s.initialPortfolioValue * v) / 100 : null));
      } else if (mode === "return") {
        portfolioValues = s.portfolioReturnPct;
        benchmarkValues = s.benchmarkReturnPct;
      } else {
        portfolioValues = s.portfolioIndexed;
        benchmarkValues = s.benchmarkIndexed;
      }
      return {
        xAxisPeriods: s.xAxisPeriods,
        portfolio: {
          id: "portfolio",
          name: "Portfolio",
          values: portfolioValues,
          periodReturnsPct: s.portfolioReturnPct,
        },
        benchmarks: [
          {
            id: "nifty50",
            name: "Nifty 50",
            values: benchmarkValues,
            periodReturnsPct: s.benchmarkReturnPct,
          },
        ],
        initialPortfolioValue: s.initialPortfolioValue,
        yAxisMode: mode,
      };
    }

    if (performanceViewBy === "assetClass" && categoryData.monthOnMonth.length > 0) {
      const xAxisPeriods = categoryData.monthOnMonth.map((m) => m.month);
      const equityReturns = categoryData.monthOnMonth.map((m) => m.equity);
      const debtReturns = categoryData.monthOnMonth.map((m) => m.debt);
      const altReturns = categoryData.monthOnMonth.map((m) => m.alternatives);
      const segmentSeries: PerformanceSeries[] = [
        {
          id: "equity",
          name: "Equity",
          values: mode === "return" ? equityReturns : returnsToIndexed(equityReturns),
          periodReturnsPct: equityReturns,
        },
        {
          id: "debt",
          name: "Debt",
          values: mode === "return" ? debtReturns : returnsToIndexed(debtReturns),
          periodReturnsPct: debtReturns,
        },
        {
          id: "alternatives",
          name: "Alternatives",
          values: mode === "return" ? altReturns : returnsToIndexed(altReturns),
          periodReturnsPct: altReturns,
        },
      ];
      return {
        xAxisPeriods,
        portfolio: segmentSeries[0]!,
        benchmarks: [],
        segmentSeries,
        yAxisMode: mode === "value" ? "return" : mode,
      };
    }

    if (performanceViewBy === "vehicle" && vehicleData.monthOnMonth.length > 0) {
      const xAxisPeriods = vehicleData.monthOnMonth.map((m) => m.month);
      const vehicleKeys = new Set<string>();
      for (const row of vehicleData.monthOnMonth) {
        Object.keys(row.returns).forEach((k) => vehicleKeys.add(k));
      }
      const segmentSeries: PerformanceSeries[] = Array.from(vehicleKeys).map((key) => {
        const returns = vehicleData.monthOnMonth.map((m) => m.returns[key] ?? null);
        return {
          id: key,
          name: VEHICLE_LABELS[key] ?? key,
          values: mode === "return" ? returns : returnsToIndexed(returns),
          periodReturnsPct: returns,
        };
      });
      return {
        xAxisPeriods,
        portfolio: segmentSeries[0]!,
        benchmarks: [],
        segmentSeries,
        yAxisMode: mode === "value" ? "return" : mode,
      };
    }

    const benchKeys = performanceBenchmarks?.length
      ? performanceBenchmarks
      : ["nifty50"];
    const agg = runAggregationEngine({
      holdings,
      fy,
      frequency: performanceFrequency,
    });
    const benchResults = runBenchmarkEngine({
      benchmarkKeys: benchKeys,
      benchmarkSeriesByKey,
      fy,
      frequency: performanceFrequency,
    });

    const xAxisPeriods = agg.periodLabels;

    let portfolioValues: (number | null)[];
    if (mode === "value") portfolioValues = agg.portfolioValue;
    else if (mode === "return") portfolioValues = agg.portfolioReturnPct;
    else portfolioValues = agg.portfolioIndexed;

    const portfolio: PerformanceSeries = {
      id: "portfolio",
      name: "Portfolio",
      values: portfolioValues,
      periodReturnsPct: agg.portfolioReturnPct,
    };

    const benchmarks: PerformanceSeries[] = benchResults.map((b) => {
      let values: (number | null)[];
      if (mode === "value") values = b.indexedSeries.map((v) => (v != null ? (agg.initialPortfolioValue * v) / 100 : null));
      else if (mode === "return") values = b.periodReturns;
      else values = b.indexedSeries;
      return {
        id: b.benchmarkId,
        name: b.label,
        values,
        periodReturnsPct: b.periodReturns,
      };
    });

    return {
      xAxisPeriods,
      portfolio,
      benchmarks,
      initialPortfolioValue: agg.initialPortfolioValue,
      yAxisMode: mode,
    };
  }, [
    holdings,
    performanceFY,
    performanceFrequency,
    performanceBenchmarks,
    performanceYAxisMode,
    performanceViewBy,
    benchmarkSeriesByKey,
    categoryData,
    vehicleData,
  ]);
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

export function useMacroAllocation() {
  const buckets = useAllocationBuckets();
  return useMemo(() => {
    const total = buckets.reduce((s, b) => s + b.marketValue, 0);
    return getMacroAllocation(buckets, total);
  }, [buckets]);
}

export function useAllocationDeviation(): number {
  const buckets = useAllocationBuckets();
  return useMemo(
    () => buckets.reduce((s, b) => s + Math.abs(b.residualPct), 0),
    [buckets]
  );
}

export function useRebalanceInsight() {
  const macro = useMacroAllocation();
  const buckets = useAllocationBuckets();
  const totalMarketValue = useMemo(
    () => buckets.reduce((s, b) => s + b.marketValue, 0),
    [buckets]
  );
  return useMemo(
    () => getRebalanceInsight(macro, totalMarketValue),
    [macro, totalMarketValue]
  );
}

export function useAllocationHealthScore(): number {
  const deviation = useAllocationDeviation();
  const risk = useRiskMetrics();
  return useMemo(
    () => getAllocationHealthScore(deviation, risk.top5ConcentrationPct),
    [deviation, risk.top5ConcentrationPct]
  );
}

export function useTopHoldingsByDeviation(limit: number = 10) {
  const holdings = useFilteredHoldings();
  const buckets = useAllocationBuckets();
  const totalMarketValue = useMemo(
    () => buckets.reduce((s, b) => s + b.marketValue, 0),
    [buckets]
  );
  return useMemo(
    () => getTopHoldingsByDeviation(holdings, totalMarketValue, limit),
    [holdings, totalMarketValue, limit]
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

/** Format value using current reporting units (absolute / lac / cr / million / billion) */
export function useFormatINR(): (value: number) => string {
  const reportingUnits = useDashboardStore(
    (s) => s.filters.reportingUnits ?? s.filters.inrScale ?? "lac"
  ) as ReportingUnits;
  return useCallback(
    (value: number) => formatINRWithScale(value, reportingUnits),
    [reportingUnits]
  );
}
