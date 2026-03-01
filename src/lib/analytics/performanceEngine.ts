/**
 * Performance engine: period-on-period (MoM, Q1–Q4, H1, FY), benchmark-relative, alpha.
 * Rolling 1Y/3Y XIRR and excess.
 */

import type { Holding } from "@/lib/types";
import type {
  FYPerformance,
  MonthReturn,
  QuarterlyReturn,
  RollingPerformancePoint,
  FYPerformanceByCategory,
  CategoryMonthReturn,
  FYPerformanceByVehicle,
  VehicleMonthReturn,
} from "./types";
import type { AssetType } from "@/lib/types";
import { computeXIRR, aggregateCashflows, periodReturnPctFromXIRR } from "@/lib/calculations/xirr";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

type MacroClassId = "equity" | "debt" | "alternatives";

const ASSET_TYPE_TO_MACRO: Record<Holding["assetType"], MacroClassId> = {
  Equity: "equity",
  MutualFund: "equity",
  PMS: "equity",
  ETF: "equity",
  IndexFund: "equity",
  DebtMF: "debt",
  AIF: "alternatives",
};

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
    const portfolioReturn = irrMonth != null ? periodReturnPctFromXIRR(irrMonth, range) : 0;
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
    const periodPct = irr != null ? periodReturnPctFromXIRR(irr, range) : null;
    return { period: q.label, irr: periodPct, absolutePct: periodPct };
  });
  const h1Start = new Date(y, 3, 1);
  const h1End = new Date(y, 8, 30);
  const h1Range: [Date, Date] = [h1Start, h1End];
  const h1Irr = computeXIRR(cashflows, h1Range);
  const h1Pct = h1Irr != null ? periodReturnPctFromXIRR(h1Irr, h1Range) : null;
  quarterly.push({
    period: "H1",
    irr: h1Pct,
    absolutePct: h1Pct,
  });
  const fyRange: [Date, Date] = [fyStart, fyEnd];
  const fyIrr = computeXIRR(cashflows, fyRange);
  const fyPct = fyIrr != null ? periodReturnPctFromXIRR(fyIrr, fyRange) : null;
  quarterly.push({
    period: "Full Year",
    irr: fyPct,
    absolutePct: fyPct,
  });

  return { fy, monthOnMonth, quarterly };
}

export function getFYPerformanceByCategory(input: PerformanceEngineInput): FYPerformanceByCategory {
  const { holdings, fy, benchmarkSeries } = input;
  const { start: fyStart, end: fyEnd } = parseFY(fy);

  const byMacro = new Map<MacroClassId, Holding[]>();
  byMacro.set("equity", []);
  byMacro.set("debt", []);
  byMacro.set("alternatives", []);

  for (const h of holdings) {
    const macro = ASSET_TYPE_TO_MACRO[h.assetType] ?? "equity";
    byMacro.get(macro)!.push(h);
  }

  const cashflowsByMacro = new Map<MacroClassId, { date: string; amount: number }[]>();
  for (const [macro, list] of byMacro) {
    cashflowsByMacro.set(macro, aggregateCashflows(list));
  }
  const allCashflows = aggregateCashflows(holdings);
  const portfolioCashflows = allCashflows.map((c) => ({ date: c.date, amount: c.amount, type: "nav" as const }));

  const monthOnMonth: CategoryMonthReturn[] = [];
  const cursor = new Date(fyStart);
  while (cursor <= fyEnd) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const range: [Date, Date] = [monthStart, monthEnd];

    const equityIrr = computeXIRR(
      cashflowsByMacro.get("equity")!.map((c) => ({ ...c, type: "nav" as const })),
      range
    );
    const debtIrr = computeXIRR(
      cashflowsByMacro.get("debt")!.map((c) => ({ ...c, type: "nav" as const })),
      range
    );
    const alternativesIrr = computeXIRR(
      cashflowsByMacro.get("alternatives")!.map((c) => ({ ...c, type: "nav" as const })),
      range
    );
    const portfolioIrr = computeXIRR(portfolioCashflows, range);
    const benchmarkReturn = benchmarkSeries?.length
      ? periodReturnFromSeries(benchmarkSeries, monthStart, monthEnd) ?? 0
      : 0;

    monthOnMonth.push({
      month: format(monthStart, "MMM yyyy"),
      equity: equityIrr != null ? periodReturnPctFromXIRR(equityIrr, range) : null,
      debt: debtIrr != null ? periodReturnPctFromXIRR(debtIrr, range) : null,
      alternatives: alternativesIrr != null ? periodReturnPctFromXIRR(alternativesIrr, range) : null,
      portfolio: portfolioIrr != null ? periodReturnPctFromXIRR(portfolioIrr, range) : 0,
      benchmark: benchmarkReturn,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { fy, monthOnMonth };
}

/** FY Performance by vehicle (asset type): MoM return % per Equity, MutualFund, PMS, etc. */
export function getFYPerformanceByVehicle(input: PerformanceEngineInput): FYPerformanceByVehicle {
  const { holdings, fy } = input;
  const { start: fyStart, end: fyEnd } = parseFY(fy);

  const byVehicle = new Map<AssetType, Holding[]>();
  for (const h of holdings) {
    const v = h.assetType;
    if (!byVehicle.has(v)) byVehicle.set(v, []);
    byVehicle.get(v)!.push(h);
  }

  const cashflowsByVehicle = new Map<AssetType, { date: string; amount: number }[]>();
  for (const [vehicle, list] of byVehicle) {
    cashflowsByVehicle.set(vehicle, aggregateCashflows(list));
  }

  const monthOnMonth: VehicleMonthReturn[] = [];
  const cursor = new Date(fyStart);
  while (cursor <= fyEnd) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const range: [Date, Date] = [monthStart, monthEnd];

    const returns: Record<string, number | null> = {};
    for (const [vehicle, cf] of cashflowsByVehicle) {
      const irr = computeXIRR(cf.map((c) => ({ ...c, type: "nav" as const })), range);
      returns[vehicle] = irr != null ? periodReturnPctFromXIRR(irr, range) : null;
    }

    monthOnMonth.push({
      month: format(monthStart, "MMM yyyy"),
      returns,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { fy, monthOnMonth };
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
