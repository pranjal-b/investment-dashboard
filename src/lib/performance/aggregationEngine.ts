/**
 * FY Performance aggregation: MoM / QoQ / YoY period returns,
 * indexed base 100, and derived portfolio value. Pure functions; no UI.
 */

import type { Holding } from "@/lib/types";
import type { PeriodPoint, PerformanceFrequency } from "./types";
import { getFYStartEnd } from "./fyEngine";
import { computeXIRR, aggregateCashflows, periodReturnPctFromXIRR } from "@/lib/calculations/xirr";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface AggregationEngineInput {
  holdings: Holding[];
  fy: string;
  frequency: PerformanceFrequency;
}

/**
 * Portfolio value at FY start: used to derive value series from indexed 100.
 * When historical NAV is not available, we use net cashflows up to FY start as proxy
 * (capital deployed by that date). Callers can pass a different value from a snapshot if available.
 */
function getInitialPortfolioValue(
  holdings: Holding[],
  fyStart: Date
): number {
  const raw = aggregateCashflows(holdings);
  let sum = 0;
  for (const c of raw) {
    const d = new Date(c.date);
    if (d <= fyStart) sum += c.amount;
  }
  return Math.max(0, sum);
}

/** Period return for date range as percentage (from XIRR, converted from annualized); null if insufficient data */
function periodReturnPct(
  cashflows: { date: string; amount: number }[],
  start: Date,
  end: Date
): number | null {
  const range: [Date, Date] = [start, end];
  const irr = computeXIRR(
    cashflows.map((c) => ({ ...c, type: "nav" as const })),
    range
  );
  if (irr == null) return null;
  return periodReturnPctFromXIRR(irr, range);
}

/** MoM: one point per month Apr … Mar */
function aggregateMoM(
  cashflows: { date: string; amount: number }[],
  fyStart: Date,
  fyEnd: Date
): PeriodPoint[] {
  const points: PeriodPoint[] = [];
  const cursor = new Date(fyStart);
  while (cursor <= fyEnd) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const r = periodReturnPct(cashflows, monthStart, monthEnd);
    points.push({
      periodLabel: format(monthStart, "MMM"),
      date: new Date(monthStart),
      portfolioReturnPct: r,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

/** QoQ: Q1 (Apr–Jun), Q2 (Jul–Sep), Q3 (Oct–Dec), Q4 (Jan–Mar) */
function aggregateQoQ(
  cashflows: { date: string; amount: number }[],
  fyStart: Date,
  fyEnd: Date
): PeriodPoint[] {
  const y = fyStart.getFullYear();
  const quarters: { label: string; start: Date; end: Date }[] = [
    { label: "Q1", start: new Date(y, 3, 1), end: new Date(y, 5, 30) },
    { label: "Q2", start: new Date(y, 6, 1), end: new Date(y, 8, 30) },
    { label: "Q3", start: new Date(y, 9, 1), end: new Date(y, 11, 31) },
    { label: "Q4", start: new Date(y + 1, 0, 1), end: new Date(y + 1, 2, 31) },
  ];
  const points: PeriodPoint[] = [];
  for (const q of quarters) {
    if (q.end > fyEnd) break;
    const r = periodReturnPct(cashflows, q.start, q.end);
    points.push({
      periodLabel: q.label,
      date: new Date(q.start),
      portfolioReturnPct: r,
    });
  }
  return points;
}

/**
 * YoY: same calendar month across consecutive FYs.
 * For a single FY we have one year only, so we output months Apr…Mar as "Apr FY24", "May FY24", ...
 * (same as MoM labels but with FY suffix for clarity when needed). Plan says "same month across years"
 * so YoY could mean comparing Apr in FY24 vs Apr in FY25; for a single-FY view we show the FY's months.
 */
function aggregateYoY(
  cashflows: { date: string; amount: number }[],
  fyStart: Date,
  fyEnd: Date,
  fy: string
): PeriodPoint[] {
  const points: PeriodPoint[] = [];
  const cursor = new Date(fyStart);
  const fyShort = fy.replace("-", "–"); // e.g. 2024–25
  while (cursor <= fyEnd) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const r = periodReturnPct(cashflows, monthStart, monthEnd);
    points.push({
      periodLabel: `${format(monthStart, "MMM")} FY${fyShort.slice(-2)}`,
      date: new Date(monthStart),
      portfolioReturnPct: r,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

/**
 * Build indexed series (base 100 at FY start) from period returns.
 * indexed[i] = 100 * product(1 + r_j/100) for j = 0..i (r_0 = 0 for first period).
 */
function buildIndexedSeries(points: PeriodPoint[]): (number | null)[] {
  const out: (number | null)[] = [];
  let cum = 100;
  for (const p of points) {
    out.push(cum);
    const r = p.portfolioReturnPct;
    if (r != null) cum = cum * (1 + r / 100);
    else cum = cum; // hold previous
  }
  return out;
}

/**
 * Build portfolio value series from indexed and initial value.
 * value[i] = initialPortfolioValue * (indexed[i] / 100).
 */
function buildValueSeries(
  indexed: (number | null)[],
  initialPortfolioValue: number
): (number | null)[] {
  return indexed.map((v) =>
    v != null ? (initialPortfolioValue * v) / 100 : null
  );
}

export interface AggregationEngineResult {
  points: PeriodPoint[];
  periodLabels: string[];
  portfolioReturnPct: (number | null)[];
  portfolioIndexed: (number | null)[];
  portfolioValue: (number | null)[];
  initialPortfolioValue: number;
}

export function runAggregationEngine(
  input: AggregationEngineInput
): AggregationEngineResult {
  const { holdings, fy, frequency } = input;
  const { start: fyStart, end: fyEnd } = getFYStartEnd(fy);
  const rawCashflows = aggregateCashflows(holdings);
  const cashflows = rawCashflows.map((c) => ({
    date: c.date,
    amount: c.amount,
  }));

  let points: PeriodPoint[];
  switch (frequency) {
    case "mom":
      points = aggregateMoM(cashflows, fyStart, fyEnd);
      break;
    case "qoq":
      points = aggregateQoQ(cashflows, fyStart, fyEnd);
      break;
    case "yoy":
      points = aggregateYoY(cashflows, fyStart, fyEnd, fy);
      break;
    default:
      points = aggregateMoM(cashflows, fyStart, fyEnd);
  }

  const periodLabels = points.map((p) => p.periodLabel);
  const portfolioReturnPct = points.map((p) => p.portfolioReturnPct);
  const portfolioIndexed = buildIndexedSeries(points);
  const initialPortfolioValue = getInitialPortfolioValue(holdings, fyStart);
  const portfolioValue = buildValueSeries(portfolioIndexed, initialPortfolioValue);

  return {
    points,
    periodLabels,
    portfolioReturnPct,
    portfolioIndexed,
    portfolioValue,
    initialPortfolioValue,
  };
}
