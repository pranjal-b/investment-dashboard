/**
 * Portfolio engine: single entry that aggregates all engine outputs for current filters/date.
 * Produces PortfolioSnapshot (market value, cost, gains, cashflows, counts, structure).
 */

import type { Holding } from "@/lib/types";
import type { PortfolioSnapshot } from "./types";
import { aggregateCashflows } from "@/lib/calculations/xirr";
import { computeXIRR } from "@/lib/calculations/xirr";
import { subDays } from "date-fns";

export interface PortfolioEngineInput {
  holdings: Holding[];
  dateRange: [Date, Date] | null;
  /** Net cash flow window: last N days (e.g. 30) */
  netCashFlowDays?: number;
  benchmarkSeries?: { date: string; value: number }[];
  peerSeries?: { date: string; value: number }[];
}

function computeBenchmarkXIRR(
  series: { date: string; value: number }[],
  dateRange: [Date, Date] | null
): number | null {
  if (!series.length || series.length < 2) return null;
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const start = dateRange?.[0]
    ? dateRange[0]
    : new Date(sorted[0].date);
  const end = dateRange?.[1] ? dateRange[1] : new Date(sorted[sorted.length - 1].date);
  const inRange = sorted.filter((p) => {
    const d = new Date(p.date);
    return d >= start && d <= end;
  });
  if (inRange.length < 2) return null;
  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  if (first.value <= 0) return null;
  const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 0) return null;
  const cagr = Math.pow(last.value / first.value, 1 / years) - 1;
  return cagr;
}

/**
 * Build portfolio snapshot from filtered holdings and options.
 */
export function getPortfolioSnapshot(input: PortfolioEngineInput): PortfolioSnapshot {
  const { holdings, dateRange, netCashFlowDays = 30 } = input;
  const totalMarketValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = holdings.reduce(
    (s, h) => s + (h.costValue ?? h.investedAmount),
    0
  );
  const absoluteGainRs = totalMarketValue - totalCost;
  const absoluteGainPct = totalCost > 0 ? (absoluteGainRs / totalCost) * 100 : 0;

  const realizedGain = holdings.reduce((s, h) => {
    const sells = h.transactions.filter((t) => t.type === "sell");
    return s + sells.reduce((sum, t) => sum + (t.realizedGain ?? 0), 0);
  }, 0);
  const unrealizedGain = absoluteGainRs - realizedGain;

  const cashflows = aggregateCashflows(holdings).map((c) => ({
    date: c.date,
    amount: c.amount,
    type: "nav" as const,
  }));
  const portfolioXIRR = computeXIRR(cashflows, dateRange);
  const portfolioXIRRPct = portfolioXIRR != null ? portfolioXIRR * 100 : null;
  const benchmarkXIRR = input.benchmarkSeries
    ? computeBenchmarkXIRR(input.benchmarkSeries, dateRange)
    : null;
  const benchmarkXIRRPct = benchmarkXIRR != null ? benchmarkXIRR * 100 : null;
  const peerXIRR = input.peerSeries
    ? computeBenchmarkXIRR(input.peerSeries, dateRange)
    : null;
  const peerXIRRPct = peerXIRR != null ? peerXIRR * 100 : null;

  const now = new Date();
  const windowStart = subDays(now, netCashFlowDays);
  const netCashFlowLastMonth = cashflows
    .filter((c) => {
      const d = new Date(c.date);
      return d >= windowStart && d <= now;
    })
    .reduce((s, c) => s + c.amount, 0);

  const portfolioIds = new Set(
    holdings.map((h) => h.portfolioType ?? "Core")
  );
  const schemeIds = new Set(holdings.map((h) => h.id));
  const wealthManagerIds = new Set(
    holdings.map((h) => h.wealthManagerId).filter(Boolean) as string[]
  );
  const terWeighted = totalMarketValue > 0
    ? holdings.reduce((s, h) => s + (h.ter ?? 0) * h.currentValue, 0) / totalMarketValue
    : 0;
  const lockInWeighted = totalMarketValue > 0
    ? holdings.reduce((s, h) => s + (h.lockInPct ?? 0) * h.currentValue, 0) / totalMarketValue
    : 0;
  const directValue = holdings
    .filter((h) => h.isDirect === true)
    .reduce((s, h) => s + h.currentValue, 0);
  const indexedValue = holdings
    .filter((h) => h.isIndexed === true)
    .reduce((s, h) => s + h.currentValue, 0);
  const activeValue = holdings
    .filter((h) => h.isActive !== false)
    .reduce((s, h) => s + h.currentValue, 0);
  const alternativeValue = holdings
    .filter((h) => h.assetType === "AIF")
    .reduce((s, h) => s + h.currentValue, 0);
  const pctDirect = totalMarketValue > 0 ? (directValue / totalMarketValue) * 100 : 0;
  const pctIndexed = totalMarketValue > 0 ? (indexedValue / totalMarketValue) * 100 : 0;
  const pctActive = totalMarketValue > 0 ? (activeValue / totalMarketValue) * 100 : 0;
  const pctAlternative = totalMarketValue > 0 ? (alternativeValue / totalMarketValue) * 100 : 0;

  return {
    portfolioMarketValue: totalMarketValue,
    totalCostValue: totalCost,
    absoluteGainRs,
    absoluteGainPct,
    unrealizedGain,
    realizedGain,
    netCashFlowLastMonth,
    portfolioXIRR: portfolioXIRRPct,
    benchmarkXIRR: benchmarkXIRRPct,
    peerXIRR: peerXIRRPct,
    numberOfPortfolios: portfolioIds.size,
    numberOfSchemes: schemeIds.size,
    numberOfWealthManagers: wealthManagerIds.size,
    portfolioTER: terWeighted,
    pctLockIn: lockInWeighted,
    pctDirect,
    pctIndexed,
    pctActive,
    pctAlternative,
  };
}
