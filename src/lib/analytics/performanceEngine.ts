/**
 * Performance engine: period-on-period (MoM, Q1–Q4, H1, FY), benchmark-relative, alpha.
 * Rolling 1Y/3Y XIRR and excess.
 */

import type { Holding } from "@/lib/types";
import type { FYPerformance, MonthReturn, QuarterlyReturn, RollingPerformancePoint } from "./types";
import { computeXIRR, aggregateCashflows } from "@/lib/calculations/xirr";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface PerformanceEngineInput {
  holdings: Holding[];
  fy: string; // "2024-25" => Apr 2024 - Mar 2025
  dateRange: [Date, Date] | null;
  benchmarkSeries?: { date: string; value: number }[];
  peerSeries?: { date: string; value: number }[];
}

function parseFY(fy: string): { start: Date; end: Date } {
  const parts = fy.split("-").map(Number);
  const y1 = parts[0]!;
  const y2 = parts[1] ?? y1 + 1;
  const startYear = y1 < 100 ? 2000 + y1 : y1;
  const endYear = y2 < 100 ? 2000 + y2 : y2;
  const start = new Date(startYear, 3, 1); // Apr 1
  const end = new Date(endYear, 2, 31); // Mar 31
  return { start, end };
}

function periodReturnFromSeries(
  series: { date: string; value: number }[],
  start: Date,
  end: Date
): number | null {
  if (!series.length) return null;
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const inRange = sorted.filter((p) => {
    const d = new Date(p.date);
    return d >= start && d <= end;
  });
  if (inRange.length < 2) return null;
  const first = inRange[0].value;
  const last = inRange[inRange.length - 1].value;
  if (first <= 0) return null;
  return ((last - first) / first) * 100;
}

export function getFYPerformance(input: PerformanceEngineInput): FYPerformance {
  const { holdings, fy, benchmarkSeries } = input;
  const { start: fyStart, end: fyEnd } = parseFY(fy);
  const rawCashflows = aggregateCashflows(holdings);
  const cashflows = rawCashflows.map((c) => ({ date: c.date, amount: c.amount, type: "nav" as const }));

  const monthOnMonth: MonthReturn[] = [];
  const cursor = new Date(fyStart);
  while (cursor <= fyEnd) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const range: [Date, Date] = [monthStart, monthEnd];
    const irrMonth = computeXIRR(cashflows, range);
    const portfolioReturn = irrMonth != null ? irrMonth * 100 : 0;
    const benchmarkReturn = benchmarkSeries?.length
      ? periodReturnFromSeries(benchmarkSeries, monthStart, monthEnd) ?? 0
      : 0;
    monthOnMonth.push({
      month: format(monthStart, "MMM yyyy"),
      portfolioReturn,
      benchmarkReturn,
      excessReturn: portfolioReturn - benchmarkReturn,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const y = fyStart.getFullYear();
  const quarters: { label: string; start: Date; end: Date }[] = [
    { label: "Q1", start: new Date(y, 3, 1), end: new Date(y, 5, 30) },
    { label: "Q2", start: new Date(y, 6, 1), end: new Date(y, 8, 30) },
    { label: "Q3", start: new Date(y, 9, 1), end: new Date(y, 11, 31) },
    { label: "Q4", start: new Date(y + 1, 0, 1), end: new Date(y + 1, 2, 31) },
  ];
  const quarterly: QuarterlyReturn[] = quarters.map((q) => {
    const range: [Date, Date] = [q.start, q.end];
    const irr = computeXIRR(cashflows, range);
    const absPct = irr != null ? irr * 100 : null;
    return { period: q.label, irr: irr != null ? irr * 100 : null, absolutePct: absPct };
  });
  const h1Start = new Date(y, 3, 1);
  const h1End = new Date(y, 8, 30);
  const h1Irr = computeXIRR(cashflows, [h1Start, h1End]);
  quarterly.push({
    period: "H1",
    irr: h1Irr != null ? h1Irr * 100 : null,
    absolutePct: h1Irr != null ? h1Irr * 100 : null,
  });
  const fyIrr = computeXIRR(cashflows, [fyStart, fyEnd]);
  quarterly.push({
    period: "Full Year",
    irr: fyIrr != null ? fyIrr * 100 : null,
    absolutePct: fyIrr != null ? fyIrr * 100 : null,
  });

  return { fy, monthOnMonth, quarterly };
}

export function getRollingPerformance(
  input: PerformanceEngineInput & { asOfDates?: Date[] }
): RollingPerformancePoint[] {
  const { holdings, dateRange, benchmarkSeries, asOfDates } = input;
  const end = dateRange?.[1] ?? new Date();
  const rawCashflows = aggregateCashflows(holdings);
  const cashflows = rawCashflows.map((c) => ({ date: c.date, amount: c.amount, type: "nav" as const }));
  const points: RollingPerformancePoint[] = [];
  const dates = asOfDates ?? (() => {
    const d: Date[] = [];
    const t = new Date(end);
    for (let i = 0; i < 24; i++) {
      d.push(new Date(t));
      t.setMonth(t.getMonth() - 1);
    }
    return d.reverse();
  })();

  for (const asOf of dates) {
    const start1Y = subMonths(asOf, 12);
    const start3Y = subMonths(asOf, 36);
    const r1y = computeXIRR(cashflows, [start1Y, asOf]);
    const r3y = computeXIRR(cashflows, [start3Y, asOf]);
    let excess: number | null = null;
    if (benchmarkSeries?.length && r1y != null) {
      const b1y = periodReturnFromSeries(benchmarkSeries, start1Y, asOf);
      excess = b1y != null ? r1y * 100 - b1y : null;
    }
    points.push({
      date: format(asOf, "yyyy-MM-dd"),
      rolling1YXIRR: r1y != null ? r1y * 100 : null,
      rolling3YIRR: r3y != null ? r3y * 100 : null,
      excessReturn: excess,
    });
  }
  return points;
}
