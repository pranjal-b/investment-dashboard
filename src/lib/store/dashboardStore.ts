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
  AllocationSleeve,
  SectorExposure,
  MarketCapExposure,
  DashboardFilters,
  ReportingUnits,
} from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";
import { getInvestmentPolicyPath, POLICY_LABELS } from "@/lib/classification/investmentPolicyCategory";
import { formatINRWithScale } from "@/lib/charts/chartTheme";
import {
  getPortfolioSnapshot,
  getAllocationBuckets,
  getMacroAllocation,
  getAllocationSleeveBreakdown,
  getPolicyAllocationTree,
  getRebalanceInsight,
  getAllocationHealthScore,
  getTopHoldingsByDeviation,
  getReturnMetrics,
  getPeriodReturns,
  getPerformanceMatrixTree,
  getRiskMetrics,
  getDebtRisk,
  getPolicyChecks,
  getFYPerformance,
  getFYPerformanceByPolicyCategory,
  getFYPerformanceByPolicySubcategory,
  getFYPerformanceBySector,
  getFYPerformanceByMarketCap,
  getRollingPerformance,
  getBondTreasuryDiagnostics,
  getHoldingPeriodReturns,
  filterLiquidEquivalentHoldings,
  getLEReturnsSplit,
  buildLiquidEquivalentsAnalyticsBase,
  normalizeIdealBuckets,
  DEFAULT_IDEAL_LIQUIDITY_BUCKETS,
  type IdealLiquidityBucketINR,
  type LiquidEquivalentsAnalytics,
} from "@/lib/analytics";
import {
  computeSectorExposure,
  computeMarketCapExposure,
} from "@/lib/calculations/exposure";
import { getAssetTypesForCoreOption, holdingMatchesCoreOption } from "@/lib/coreBuckets";
import { getCurrentFY } from "@/lib/performance/fyEngine";
import { runAggregationEngine } from "@/lib/performance/aggregationEngine";
import {
  buildIndexedFromPeriodReturns,
  runBenchmarkEngine,
} from "@/lib/performance/benchmarkEngine";
import {
  applyPitchSyntheticMomFills,
  fillNullBenchmarkPeriodReturns,
  shouldApplyPitchSyntheticMomFill,
} from "@/lib/performance/pitchSampleMoM";
import type { PerformanceChartData, PerformanceSeries } from "@/lib/performance/types";
import { getDemoHoldings } from "@/lib/data/demoPortfolioHoldings";
import nifty50History from "@/data/nifty50History.json";

const LIQUIDITY_STORAGE_KEY_V1 = "investment-dashboard-liquidity-v1";
const LIQUIDITY_STORAGE_KEY_V2 = "investment-dashboard-liquidity-v2";

export interface LiquiditySettingsState {
  /** Target INR per liquidity tenor bucket (L&E dashboard). */
  idealBucketINR: IdealLiquidityBucketINR;
  /** Default annual % for FD premature withdrawal in the scenario calculator. */
  defaultPrematurePenaltyAnnualPct: number;
}

const defaultLiquiditySettings: LiquiditySettingsState = {
  idealBucketINR: { ...DEFAULT_IDEAL_LIQUIDITY_BUCKETS },
  defaultPrematurePenaltyAnnualPct: 1,
};

function parseIdealBucketINRFromStorage(raw: unknown): IdealLiquidityBucketINR | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  return normalizeIdealBuckets({
    d0_1: o.d0_1,
    d1_3: o.d1_3,
    d3_5: o.d3_5,
    d5p: o.d5p,
  });
}

function readLiquidityPayload(raw: string): Partial<LiquiditySettingsState> | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<LiquiditySettingsState> = {};
    const idealRaw = o.idealBucketINR ?? o.idealLiquidityBucketINR;
    const ideal = parseIdealBucketINRFromStorage(idealRaw);
    if (ideal) out.idealBucketINR = ideal;
    if ("defaultPrematurePenaltyAnnualPct" in o) {
      const n = Number(o.defaultPrematurePenaltyAnnualPct);
      if (Number.isFinite(n) && n >= 0) out.defaultPrematurePenaltyAnnualPct = n;
    }
    return out;
  } catch {
    return null;
  }
}

function readLiquidityFromStorage(): Partial<LiquiditySettingsState> | null {
  if (typeof window === "undefined") return null;
  const v2 = localStorage.getItem(LIQUIDITY_STORAGE_KEY_V2);
  if (v2) return readLiquidityPayload(v2);
  const v1 = localStorage.getItem(LIQUIDITY_STORAGE_KEY_V1);
  if (!v1) return null;
  const parsed = readLiquidityPayload(v1);
  if (parsed) {
    const migrated: LiquiditySettingsState = {
      ...defaultLiquiditySettings,
      ...parsed,
      idealBucketINR: {
        ...DEFAULT_IDEAL_LIQUIDITY_BUCKETS,
        ...parsed.idealBucketINR,
      },
    };
    writeLiquidityToStorage(migrated);
  }
  return parsed;
}

function writeLiquidityToStorage(s: LiquiditySettingsState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIQUIDITY_STORAGE_KEY_V2, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Default reporting window; null = components use sensible fallbacks (e.g. as-of today). */
const defaultDateRange: [Date, Date] | null = null;

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
  policyCategory1: "all",
  policyCategory2: "all",
  dateRangePreset: "custom",
  coreBucketSelection: [],
  coreSubCategorySelection: [],
  fy: "2024-25",
  performanceFY: getCurrentFY(),
  performanceFrequency: "mom",
  performanceBenchmarks: ["nifty50"],
  performanceYAxisMode: "indexed",
  performanceViewBy: "category",
  performanceMatrixScenario: "moderate",
  performancePitchSample: undefined,
  netCashFlowDays: 30,
  reportingCurrency: "INR",
  reportingUnits: "cr",
};

function buildDefaultFilters(): DashboardFilters {
  return structuredClone(defaultFilters);
}

function applyFilters(holdings: Holding[], filters: DashboardFilters): Holding[] {
  let result = [...holdings];

  const cat1 = filters.policyCategory1 ?? "all";
  const cat2 = filters.policyCategory2 ?? "all";
  if (cat1 !== "all") {
    result = result.filter((h) => {
      const path = getInvestmentPolicyPath(h);
      if (path[0] !== cat1) return false;
      if (cat2 !== "all") {
        if (path[1] !== cat2) return false;
      }
      return true;
    });
  }

  const bucketSelection = filters.coreBucketSelection ?? [];
  const subSelection = filters.coreSubCategorySelection ?? [];
  if (subSelection.length > 0) {
    result = result.filter((h) =>
      subSelection.some((opt) => holdingMatchesCoreOption(h, opt))
    );
  } else if (bucketSelection.length > 0) {
    result = result.filter((h) =>
      bucketSelection.some((bid) => holdingMatchesCoreOption(h, bid))
    );
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

  return result;
}

type BenchmarkPoint = { date: string; value: number };

const DEFAULT_NIFTY_SERIES: BenchmarkPoint[] = (nifty50History.series ??
  []) as BenchmarkPoint[];

/** Map of benchmark key → time series (for multi-benchmark performance chart) */
export type BenchmarkSeriesByKey = Record<string, BenchmarkPoint[]>;

interface DashboardState {
  holdings: Holding[];
  filters: DashboardFilters;
  benchmarkSeries: BenchmarkPoint[] | null;
  /** Multi-benchmark: key (e.g. nifty50) → series; used by FY Performance chart */
  benchmarkSeriesByKey: BenchmarkSeriesByKey;
  peerSeries: BenchmarkPoint[] | null;
  liquiditySettings: LiquiditySettingsState;

  setHoldings: (holdings: Holding[]) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setSelectedSector: (sector: string | null) => void;
  setBenchmarkSeries: (series: BenchmarkPoint[] | null) => void;
  setBenchmarkSeriesByKey: (key: string, series: BenchmarkPoint[] | null) => void;
  setPeerSeries: (series: BenchmarkPoint[] | null) => void;
  resetFilters: () => void;
  setLiquiditySettings: (partial: Partial<LiquiditySettingsState>) => void;
  hydrateLiquidityFromStorage: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  holdings: getDemoHoldings(),
  filters: buildDefaultFilters(),
  benchmarkSeries: DEFAULT_NIFTY_SERIES,
  benchmarkSeriesByKey: { nifty50: DEFAULT_NIFTY_SERIES },
  peerSeries: null,
  liquiditySettings: { ...defaultLiquiditySettings },

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

  resetFilters: () => set({ filters: buildDefaultFilters() }),

  setLiquiditySettings: (partial) =>
    set((state) => {
      const liquiditySettings = { ...state.liquiditySettings, ...partial };
      writeLiquidityToStorage(liquiditySettings);
      return { liquiditySettings };
    }),

  hydrateLiquidityFromStorage: () => {
    const parsed = readLiquidityFromStorage();
    if (!parsed) return;
    set((state) => ({
      liquiditySettings: {
        ...state.liquiditySettings,
        ...parsed,
        idealBucketINR: {
          ...DEFAULT_IDEAL_LIQUIDITY_BUCKETS,
          ...state.liquiditySettings.idealBucketINR,
          ...parsed.idealBucketINR,
        },
      },
    }));
  },
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

export function useAllocationSleeveBreakdown() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  return useMemo(
    () => getAllocationSleeveBreakdown({ holdings, dateRange }),
    [holdings, dateRange]
  );
}

export function usePolicyAllocationTree() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  return useMemo(
    () => getPolicyAllocationTree({ holdings, dateRange }),
    [holdings, dateRange]
  );
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
  matrixTree: import("@/lib/analytics/types").PerformanceMatrixTreeNode[];
  benchmarkByPeriod: Record<string, number | null>;
  portfolioByPeriod: Record<string, number | null>;
  portfolioXIRR: number | null;
  benchmarkXIRR: number | null;
}

export function usePerformanceMatrixData(): PerformanceMatrixData {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const periodReturns = usePeriodReturns();
  const returnMetrics = useReturnMetrics();

  const matrixTree = useMemo(
    () =>
      getPerformanceMatrixTree({
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

  const portfolioByPeriod = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const row of periodReturns) {
      out[row.period] = row.portfolio;
    }
    return out;
  }, [periodReturns]);

  return useMemo(
    () => ({
      matrixTree,
      benchmarkByPeriod,
      portfolioByPeriod,
      portfolioXIRR: returnMetrics.portfolioXIRR,
      benchmarkXIRR: returnMetrics.benchmarkXIRR,
    }),
    [matrixTree, benchmarkByPeriod, portfolioByPeriod, returnMetrics.portfolioXIRR, returnMetrics.benchmarkXIRR]
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

export function useBondTreasuryDiagnostics() {
  const holdings = useFilteredHoldings();
  return useMemo(() => getBondTreasuryDiagnostics({ holdings }), [holdings]);
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

export function normalizePerformanceViewBy(
  v: string | undefined
): NonNullable<DashboardFilters["performanceViewBy"]> {
  if (v === "category" || v === "subcategory" || v === "sector" || v === "marketCap") return v;
  return "category";
}

/** FY Performance chart: precomputed series from aggregation + benchmark engines (no business logic in chart). */
export function usePerformanceChartData(): PerformanceChartData | null {
  const holdings = useFilteredHoldings();
  const performanceFY = useDashboardStore((s) => s.filters.performanceFY);
  const fyLegacy = useDashboardStore((s) => s.filters.fy);
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const performanceFrequency = useDashboardStore((s) => s.filters.performanceFrequency ?? "mom");
  const performanceBenchmarks = useDashboardStore((s) => s.filters.performanceBenchmarks);
  const performanceYAxisMode = useDashboardStore((s) => s.filters.performanceYAxisMode ?? "indexed");
  const rawPerformanceViewBy = useDashboardStore((s) => s.filters.performanceViewBy);
  const performanceViewBy = normalizePerformanceViewBy(rawPerformanceViewBy);
  const performancePitchSample = useDashboardStore((s) => s.filters.performancePitchSample);
  const benchmarkSeriesByKey = useDashboardStore((s) => s.benchmarkSeriesByKey);

  return useMemo(() => {
    const fy = performanceFY ?? fyLegacy ?? getCurrentFY();
    const mode = performanceYAxisMode;
    const usePitchFill = shouldApplyPitchSyntheticMomFill({
      fy,
      performancePitchSample,
      performanceFrequency,
    });

    const segmentInput = { holdings, fy, dateRange };
    let keyed =
      performanceViewBy === "category"
        ? getFYPerformanceByPolicyCategory(segmentInput)
        : performanceViewBy === "subcategory"
          ? getFYPerformanceByPolicySubcategory(segmentInput)
          : performanceViewBy === "sector"
            ? getFYPerformanceBySector(segmentInput)
            : getFYPerformanceByMarketCap(segmentInput);

    if (keyed.monthOnMonth.length > 0 && usePitchFill) {
      keyed = {
        ...keyed,
        monthOnMonth: applyPitchSyntheticMomFills(keyed.monthOnMonth),
      };
    }

    if (keyed.monthOnMonth.length > 0) {
      const xAxisPeriods = keyed.monthOnMonth.map((m) => m.month);
      const dimKeys = new Set<string>();
      for (const row of keyed.monthOnMonth) {
        Object.keys(row.returns).forEach((k) => dimKeys.add(k));
      }
      const labelForKey =
        performanceViewBy === "category" || performanceViewBy === "subcategory"
          ? (k: string) => POLICY_LABELS[k] ?? k
          : (k: string) => k;
      const sortedKeys = Array.from(dimKeys).sort((a, b) =>
        labelForKey(a).localeCompare(labelForKey(b), undefined, { sensitivity: "base" })
      );
      const segmentSeries: PerformanceSeries[] = sortedKeys.map((key) => {
        const returns = keyed.monthOnMonth.map((m) => m.returns[key] ?? null);
        return {
          id: key,
          name: labelForKey(key),
          values: mode === "return" ? returns : returnsToIndexed(returns),
          periodReturnsPct: returns,
        };
      });
      if (segmentSeries.length > 0) {
        const benchKeys = performanceBenchmarks?.length
          ? performanceBenchmarks
          : ["nifty50"];
        const benchResults = runBenchmarkEngine({
          benchmarkKeys: benchKeys,
          benchmarkSeriesByKey,
          fy,
          frequency: performanceFrequency,
        });
        const n = xAxisPeriods.length;
        const benchmarks: PerformanceSeries[] = benchResults.map((b) => {
          let periodReturns = b.periodReturns;
          if (periodReturns.length !== n) {
            periodReturns =
              periodReturns.length > n
                ? periodReturns.slice(0, n)
                : [...periodReturns, ...Array(n - periodReturns.length).fill(null)];
          }
          if (usePitchFill) {
            periodReturns = fillNullBenchmarkPeriodReturns(periodReturns, b.benchmarkId);
          }
          const values =
            mode === "return" ? periodReturns : returnsToIndexed(periodReturns);
          return {
            id: b.benchmarkId,
            name: b.label,
            values,
            periodReturnsPct: periodReturns,
          };
        });
        return {
          xAxisPeriods,
          portfolio: segmentSeries[0]!,
          benchmarks,
          segmentSeries,
          yAxisMode: mode === "value" ? "return" : mode,
        };
      }
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
      const n = xAxisPeriods.length;
      let periodReturns = b.periodReturns;
      if (periodReturns.length !== n) {
        periodReturns =
          periodReturns.length > n
            ? periodReturns.slice(0, n)
            : [...periodReturns, ...Array(n - periodReturns.length).fill(null)];
      }
      if (usePitchFill) {
        periodReturns = fillNullBenchmarkPeriodReturns(periodReturns, b.benchmarkId);
      }
      const indexedSeries = buildIndexedFromPeriodReturns(periodReturns);
      let values: (number | null)[];
      if (mode === "value")
        values = indexedSeries.map((v) =>
          v != null ? (agg.initialPortfolioValue * v) / 100 : null
        );
      else if (mode === "return") values = periodReturns;
      else values = indexedSeries;
      return {
        id: b.benchmarkId,
        name: b.label,
        values,
        periodReturnsPct: periodReturns,
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
    performancePitchSample,
    performanceBenchmarks,
    performanceYAxisMode,
    performanceViewBy,
    benchmarkSeriesByKey,
    fyLegacy,
    dateRange,
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
  const holdings = useFilteredHoldings();
  return useMemo(() => getMacroAllocation(holdings), [holdings]);
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
  const holdings = useFilteredHoldings();
  const totalMarketValue = useMemo(
    () => holdings.reduce((s, h) => s + h.currentValue, 0),
    [holdings]
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
  const totalMarketValue = useMemo(
    () => holdings.reduce((s, h) => s + h.currentValue, 0),
    [holdings]
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
    (s) => s.filters.reportingUnits ?? s.filters.inrScale ?? "cr"
  ) as ReportingUnits;
  return useCallback(
    (value: number) => formatINRWithScale(value, reportingUnits),
    [reportingUnits]
  );
}

/** Full book + `filters.dateRange` for bucket/return as-of; joins L&E subset XIRR via return engine. */
export function useLiquidEquivalentsAnalytics(): LiquidEquivalentsAnalytics {
  const holdings = useDashboardStore((s) => s.holdings);
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const liquiditySettings = useDashboardStore((s) => s.liquiditySettings);
  const benchmarkSeries = useDashboardStore((s) => s.benchmarkSeries);
  const peerSeries = useDashboardStore((s) => s.peerSeries);

  return useMemo(() => {
    const leHoldings = filterLiquidEquivalentHoldings(holdings);
    const holdingReturns = getHoldingPeriodReturns({
      holdings: leHoldings,
      dateRange,
      benchmarkSeries: benchmarkSeries ?? undefined,
      peerSeries: peerSeries ?? undefined,
    });
    const base = buildLiquidEquivalentsAnalyticsBase({
      holdings,
      dateRange,
      idealBucketINR: liquiditySettings.idealBucketINR ?? DEFAULT_IDEAL_LIQUIDITY_BUCKETS,
    });
    const leReturnsSplit = getLEReturnsSplit(holdings, holdingReturns);
    return { ...base, leReturnsSplit };
  }, [holdings, dateRange, liquiditySettings, benchmarkSeries, peerSeries]);
}
