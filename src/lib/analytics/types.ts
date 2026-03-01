/**
 * Analytics engine output types.
 * All UI consumes these only; no financial logic in components.
 */

import type { AllocationBucketId } from "@/lib/types";

export interface PortfolioSnapshot {
  portfolioMarketValue: number;
  totalCostValue: number;
  absoluteGainRs: number;
  absoluteGainPct: number;
  unrealizedGain: number;
  realizedGain: number;
  netCashFlowLastMonth: number;
  portfolioXIRR: number | null;
  benchmarkXIRR: number | null;
  peerXIRR: number | null;
  numberOfSchemes: number;
  numberOfWealthManagers: number;
  portfolioTER: number;
  pctLockIn: number;
  pctDirect: number;
  pctIndexed: number;
  pctActive: number;
  pctAlternative: number;
}

export interface AllocationBucket {
  bucketId: AllocationBucketId;
  label: string;
  invested: number;
  marketValue: number;
  allocationPct: number;
  targetPct: number;
  residualPct: number;
  pnl: number;
  roi: number;
  unrealizedST: number;
  unrealizedLT: number;
}

export interface ReturnMetrics {
  portfolioXIRR: number | null;
  benchmarkXIRR: number | null;
  peerXIRR: number | null;
  realizedGain: number;
  unrealizedGain: number;
}

export interface PeriodReturn {
  period: string; // "3M" | "6M" | "1Y" | "3Y" | "SI"
  portfolio: number | null;
  benchmark: number | null;
  peer: number | null;
  equity: number | null;
  debt: number | null;
  alternatives: number | null;
}

export interface RiskMetrics {
  herfindahl: number;
  top5ConcentrationPct: number;
  pctOverconcentration: number;
  pctLowLiquidity: number;
  pctLockIn: number;
  expenseDrag: number;
}

export interface DebtRisk {
  aaaPct: number;
  aaPct: number;
  belowAAPct: number;
  modifiedDuration: number;
  yieldToMaturity: number;
}

export type PolicyStatus = "green" | "amber" | "red";

export interface PolicyCheck {
  policy: string;
  threshold: string;
  actual: number;
  actualLabel: string;
  status: PolicyStatus;
}

export interface MonthReturn {
  month: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
}

export interface QuarterlyReturn {
  period: string; // "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "Full Year"
  irr: number | null;
  absolutePct: number | null;
}

export interface FYPerformance {
  fy: string; // e.g. "2024-25"
  monthOnMonth: MonthReturn[];
  quarterly: QuarterlyReturn[];
}

export interface RollingPerformancePoint {
  date: string;
  rolling1YXIRR: number | null;
  rolling3YIRR: number | null;
  excessReturn: number | null;
}

