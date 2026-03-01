/**
 * Return engine: XIRR, period returns (3M/6M/1Y/3Y/SI), benchmark/peer XIRR.
 * Realized vs unrealized gain. Uses shared xirr utility.
 */

import type { Holding, AllocationBucketId } from "@/lib/types";
import type { ReturnMetrics, PeriodReturn, BucketPeriodReturn } from "./types";
import { computeXIRR, aggregateCashflows } from "@/lib/calculations/xirr";
import { subMonths } from "date-fns";

const BUCKET_LABELS: Record<AllocationBucketId, string> = {
  DirectEquity: "Direct Equity",
  EquityMF: "Equity MF",
  DebtMF: "Debt MF",
  AlternativeFOF: "Alternative FOF",
  PMS: "PMS",
  AIF: "AIF",
  ETF: "ETF",
  IndexFund: "Index Fund",
};

function assetTypeToBucket(assetType: Holding["assetType"]): AllocationBucketId {
  const map: Record<string, AllocationBucketId> = {
    Equity: "DirectEquity",
    MutualFund: "EquityMF",
    DebtMF: "DebtMF",
    AIF: "AIF",
    PMS: "PMS",
    ETF: "ETF",
    IndexFund: "IndexFund",
  };
  return map[assetType] ?? "EquityMF";
}

export interface ReturnEngineInput {
  holdings: Holding[];
  dateRange: [Date, Date] | null;
  benchmarkSeries?: { date: string; value: number }[];
  peerSeries?: { date: string; value: number }[];
}

function periodReturnFromSeries(
  series: { date: string; value: number }[],
  asOf: Date,
  monthsBack: number
): number | null {
  if (!series.length) return null;
  const start = subMonths(asOf, monthsBack);
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const inRange = sorted.filter((p) => {
    const d = new Date(p.date);
    return d >= start && d <= asOf;
  });
  if (inRange.length < 2) return null;
  const first = inRange[0].value;
  const last = inRange[inRange.length - 1].value;
  if (first <= 0) return null;
  return ((last - first) / first) * 100;
}

export function getReturnMetrics(input: ReturnEngineInput): ReturnMetrics {
  const { holdings, dateRange, benchmarkSeries, peerSeries } = input;
  const rawCashflows = aggregateCashflows(holdings);
  const end = dateRange?.[1] ?? new Date();
  const totalMarketValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const cashflows = [
    ...rawCashflows.map((c) => ({ date: c.date, amount: c.amount, type: "nav" as const })),
    { date: toDateStr(end), amount: totalMarketValue, type: "nav" as const },
  ];
  const xirr = computeXIRR(cashflows, dateRange);
  const portfolioXIRRPct = xirr != null ? xirr * 100 : null;

  let benchmarkXIRRPct: number | null = null;
  if (benchmarkSeries?.length) {
    const bRate = benchmarkXIRRFromSeries(benchmarkSeries, dateRange);
    benchmarkXIRRPct = bRate != null ? bRate * 100 : null;
  }
  let peerXIRRPct: number | null = null;
  if (peerSeries?.length) {
    const pRate = benchmarkXIRRFromSeries(peerSeries, dateRange);
    peerXIRRPct = pRate != null ? pRate * 100 : null;
  }

  const totalCost = holdings.reduce((s, h) => s + (h.costValue ?? h.investedAmount), 0);
  const totalMarket = holdings.reduce((s, h) => s + h.currentValue, 0);
  const realizedGain = holdings.reduce((s, h) => {
    return s + (h.transactions.filter((t) => t.type === "sell").reduce((sum, t) => sum + (t.realizedGain ?? 0), 0));
  }, 0);
  const unrealizedGain = totalMarket - totalCost - realizedGain;

  return {
    portfolioXIRR: portfolioXIRRPct,
    benchmarkXIRR: benchmarkXIRRPct,
    peerXIRR: peerXIRRPct,
    realizedGain,
    unrealizedGain,
  };
}

function benchmarkXIRRFromSeries(
  series: { date: string; value: number }[],
  dateRange: [Date, Date] | null
): number | null {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const start = dateRange?.[0] ?? new Date(sorted[0].date);
  const end = dateRange?.[1] ?? new Date(sorted[sorted.length - 1].date);
  const inRange = sorted.filter((p) => {
    const d = new Date(p.date);
    return d >= start && d <= end;
  });
  if (inRange.length < 2 || inRange[0].value <= 0) return null;
  const years = (new Date(inRange[inRange.length - 1].date).getTime() - new Date(inRange[0].date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 0) return null;
  return Math.pow(inRange[inRange.length - 1].value / inRange[0].value, 1 / years) - 1;
}

const PERIOD_MONTHS: { period: string; months: number }[] = [
  { period: "3M", months: 3 },
  { period: "6M", months: 6 },
  { period: "1Y", months: 12 },
  { period: "3Y", months: 36 },
  { period: "SI", months: 120 },
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getPeriodReturns(input: ReturnEngineInput): PeriodReturn[] {
  const { holdings, dateRange, benchmarkSeries, peerSeries } = input;
  const asOf = dateRange?.[1] ?? new Date();
  const rawCashflows = aggregateCashflows(holdings);
  const totalMarketValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const cashflowsWithTerminal = [
    ...rawCashflows.map((c) => ({ date: c.date, amount: c.amount, type: "nav" as const })),
    { date: toDateStr(asOf), amount: totalMarketValue, type: "nav" as const },
  ];

  return PERIOD_MONTHS.map(({ period, months }) => {
    const start = subMonths(asOf, months);
    const range: [Date, Date] = [start, asOf];
    const pXirr = computeXIRR(cashflowsWithTerminal, range);
    const portfolio = pXirr != null ? pXirr * 100 : null;
    const benchmark = benchmarkSeries?.length
      ? periodReturnFromSeries(benchmarkSeries, asOf, months)
      : null;
    const peer = peerSeries?.length
      ? periodReturnFromSeries(peerSeries, asOf, months)
      : null;
    return {
      period,
      portfolio,
      benchmark,
      peer,
      equity: null,
      debt: null,
      alternatives: null,
    };
  });
}

/** Period column order for Performance Matrix (horizontal headers) */
export const PERFORMANCE_MATRIX_PERIODS = ["3M", "6M", "1Y", "3Y", "SI"] as const;

export function getBucketPeriodReturns(input: ReturnEngineInput): BucketPeriodReturn[] {
  const { holdings, dateRange } = input;
  const asOf = dateRange?.[1] ?? new Date();

  const byBucket = new Map<AllocationBucketId, Holding[]>();
  for (const h of holdings) {
    const bucketId = assetTypeToBucket(h.assetType);
    if (!byBucket.has(bucketId)) byBucket.set(bucketId, []);
    byBucket.get(bucketId)!.push(h);
  }

  const asOfStr = toDateStr(asOf);
  const result: BucketPeriodReturn[] = [];
  for (const [bucketId, bucketHoldings] of byBucket) {
    if (bucketHoldings.length === 0) continue;
    const rawCashflows = aggregateCashflows(bucketHoldings);
    const bucketMarketValue = bucketHoldings.reduce((s, h) => s + h.currentValue, 0);
    const cashflowsWithTerminal = [
      ...rawCashflows.map((c) => ({ date: c.date, amount: c.amount, type: "nav" as const })),
      { date: asOfStr, amount: bucketMarketValue, type: "nav" as const },
    ];
    const periodReturns: Record<string, number | null> = {};
    for (const { period, months } of PERIOD_MONTHS) {
      const start = subMonths(asOf, months);
      const range: [Date, Date] = [start, asOf];
      const r = computeXIRR(cashflowsWithTerminal, range);
      periodReturns[period] = r != null ? r * 100 : null;
    }
    const xirr = computeXIRR(cashflowsWithTerminal, dateRange);
    result.push({
      bucketId,
      label: BUCKET_LABELS[bucketId],
      periodReturns,
      xirrPct: xirr != null ? xirr * 100 : null,
    });
  }

  const order = (["DirectEquity", "EquityMF", "DebtMF", "AlternativeFOF", "PMS", "AIF", "ETF", "IndexFund"] as AllocationBucketId[]);
  return result.sort((a, b) => order.indexOf(a.bucketId) - order.indexOf(b.bucketId));
}

export interface HoldingPeriodReturn {
  holdingId: string;
  assetName: string;
  assetType: string;
  periodReturns: { period: string; returnPct: number | null }[];
  xirrPct: number | null;
}

export function getHoldingPeriodReturns(input: ReturnEngineInput): HoldingPeriodReturn[] {
  const { holdings, dateRange } = input;
  const asOf = dateRange?.[1] ?? new Date();
  return holdings.map((h) => {
    const cashflows = h.transactions.map((t) => ({ date: t.date, amount: t.amount, type: t.type }));
    const xirr = computeXIRR(cashflows, dateRange);
    const xirrPct = xirr != null ? xirr * 100 : null;
    const periodReturns = PERIOD_MONTHS.map(({ period, months }) => {
      const start = subMonths(asOf, months);
      const range: [Date, Date] = [start, asOf];
      const r = computeXIRR(cashflows, range);
      return { period, returnPct: r != null ? r * 100 : null };
    });
    return {
      holdingId: h.id,
      assetName: h.assetName,
      assetType: h.assetType,
      periodReturns,
      xirrPct,
    };
  });
}
