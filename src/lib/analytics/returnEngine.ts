/**
 * Return engine: XIRR, period returns (3M/6M/1Y/3Y/SI), benchmark/peer XIRR.
 * Realized vs unrealized gain. Uses shared xirr utility.
 */

import type { Holding } from "@/lib/types";
import {
  getInvestmentPolicyPath,
  labelForPolicySegment,
  policyPathKey,
} from "@/lib/classification/investmentPolicyCategory";
import type { ReturnMetrics, PeriodReturn, PerformanceMatrixTreeNode } from "./types";
import { holdingsUnderPrefix, sortChildIds } from "./policyAllocationTree";
import { computeXIRR, aggregateCashflows } from "@/lib/calculations/xirr";
import { subMonths } from "date-fns";

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

function computePeriodReturnsForHoldings(
  bucketHoldings: Holding[],
  asOf: Date,
  asOfStr: string,
  dateRange: [Date, Date] | null
): { periodReturns: Record<string, number | null>; xirrPct: number | null } {
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
  return { periodReturns, xirrPct: xirr != null ? xirr * 100 : null };
}

/** Same policy path hierarchy as Allocation Overview, with period returns at each node. */
export function getPerformanceMatrixTree(input: ReturnEngineInput): PerformanceMatrixTreeNode[] {
  const { holdings, dateRange } = input;
  const asOf = dateRange?.[1] ?? new Date();
  const asOfStr = toDateStr(asOf);

  const byLeaf = new Map<string, Holding[]>();
  for (const h of holdings) {
    const path = getInvestmentPolicyPath(h);
    const key = policyPathKey(path);
    if (!byLeaf.has(key)) byLeaf.set(key, []);
    byLeaf.get(key)!.push(h);
  }

  function buildNode(pathKey: string): PerformanceMatrixTreeNode | null {
    const hh = holdingsUnderPrefix(pathKey, byLeaf);
    const mv = hh.reduce((s, h) => s + h.currentValue, 0);
    if (mv <= 0) return null;

    const { periodReturns, xirrPct } = computePeriodReturnsForHoldings(hh, asOf, asOfStr, dateRange);
    const parts = pathKey.split("|");
    const segmentId = parts[parts.length - 1]!;
    const depth = parts.length - 1;

    const childIds = new Set<string>();
    const prefixWithPipe = `${pathKey}|`;
    for (const k of byLeaf.keys()) {
      if (!k.startsWith(prefixWithPipe)) continue;
      const rest = k.slice(prefixWithPipe.length);
      const nextSeg = rest.split("|")[0];
      if (nextSeg) childIds.add(nextSeg);
    }
    const sortedChildSegments = sortChildIds(pathKey, Array.from(childIds));
    const children = sortedChildSegments
      .map((seg) => buildNode(`${pathKey}|${seg}`))
      .filter((n): n is PerformanceMatrixTreeNode => n != null);

    return {
      pathKey,
      depth,
      label: labelForPolicySegment(segmentId),
      periodReturns,
      xirrPct,
      children,
    };
  }

  const rootSegments = sortChildIds(
    "",
    Array.from(new Set([...byLeaf.keys()].map((k) => k.split("|")[0]!).filter(Boolean)))
  );

  return rootSegments
    .map((seg) => buildNode(seg))
    .filter((n): n is PerformanceMatrixTreeNode => n != null);
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
