/**
 * Benchmark engine: resolve keys to series, compute period returns and indexed 100
 * for the same FY and frequency as portfolio. Pure functions; no UI.
 */

import type { BenchmarkDataPoint } from "./types";
import type { PerformanceFrequency } from "./types";
import { getFYStartEnd } from "./fyEngine";
import { startOfMonth, endOfMonth, format } from "date-fns";

export const BENCHMARK_LABELS: Record<string, string> = {
  nifty50: "Nifty 50",
  nifty500: "Nifty 500",
  sensex: "Sensex",
  niftyMidcap: "Nifty Midcap",
  custom: "Custom",
};

/** Period return % from a price series between start and end */
function periodReturnFromSeries(
  series: BenchmarkDataPoint[],
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
  const first = inRange[0]!.value;
  const last = inRange[inRange.length - 1]!.value;
  if (first <= 0) return null;
  return ((last - first) / first) * 100;
}

/** MoM period boundaries (start, end) for FY */
function getMoMPeriods(fyStart: Date, fyEnd: Date): { label: string; start: Date; end: Date }[] {
  const periods: { label: string; start: Date; end: Date }[] = [];
  const cursor = new Date(fyStart);
  while (cursor <= fyEnd) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    periods.push({
      label: format(monthStart, "MMM"),
      start: new Date(monthStart),
      end: new Date(monthEnd),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return periods;
}

/** QoQ period boundaries */
function getQoQPeriods(fyStart: Date, fyEnd: Date): { label: string; start: Date; end: Date }[] {
  const y = fyStart.getFullYear();
  const quarters: { label: string; start: Date; end: Date }[] = [
    { label: "Q1", start: new Date(y, 3, 1), end: new Date(y, 5, 30) },
    { label: "Q2", start: new Date(y, 6, 1), end: new Date(y, 8, 30) },
    { label: "Q3", start: new Date(y, 9, 1), end: new Date(y, 11, 31) },
    { label: "Q4", start: new Date(y + 1, 0, 1), end: new Date(y + 1, 2, 31) },
  ];
  return quarters.filter((q) => q.end <= fyEnd);
}

/** YoY: same as MoM for single FY (one year of months) */
function getYoYPeriods(fyStart: Date, fyEnd: Date, fy: string): { label: string; start: Date; end: Date }[] {
  const fyShort = fy.replace("-", "–");
  const periods: { label: string; start: Date; end: Date }[] = [];
  const cursor = new Date(fyStart);
  while (cursor <= fyEnd) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    periods.push({
      label: `${format(monthStart, "MMM")} FY${fyShort.slice(-2)}`,
      start: new Date(monthStart),
      end: new Date(monthEnd),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return periods;
}

function getPeriods(fy: string, frequency: PerformanceFrequency): { label: string; start: Date; end: Date }[] {
  const { start: fyStart, end: fyEnd } = getFYStartEnd(fy);
  switch (frequency) {
    case "mom":
      return getMoMPeriods(fyStart, fyEnd);
    case "qoq":
      return getQoQPeriods(fyStart, fyEnd);
    case "yoy":
      return getYoYPeriods(fyStart, fyEnd, fy);
    default:
      return getMoMPeriods(fyStart, fyEnd);
  }
}

/** Indexed series from period returns (base 100) */
function buildIndexed(periodReturns: (number | null)[]): (number | null)[] {
  const out: (number | null)[] = [];
  let cum = 100;
  for (const r of periodReturns) {
    out.push(cum);
    if (r != null) cum = cum * (1 + r / 100);
  }
  return out;
}

export interface BenchmarkSeriesResult {
  benchmarkId: string;
  label: string;
  periodReturns: (number | null)[];
  indexedSeries: (number | null)[];
}

export interface BenchmarkEngineInput {
  benchmarkKeys: string[];
  benchmarkSeriesByKey: Record<string, BenchmarkDataPoint[]>;
  fy: string;
  frequency: PerformanceFrequency;
}

export function runBenchmarkEngine(input: BenchmarkEngineInput): BenchmarkSeriesResult[] {
  const { benchmarkKeys, benchmarkSeriesByKey, fy, frequency } = input;
  const periods = getPeriods(fy, frequency);
  const results: BenchmarkSeriesResult[] = [];

  for (const key of benchmarkKeys) {
    const series = benchmarkSeriesByKey[key];
    if (!series?.length) {
      results.push({
        benchmarkId: key,
        label: BENCHMARK_LABELS[key] ?? key,
        periodReturns: periods.map(() => null),
        indexedSeries: periods.map(() => null),
      });
      continue;
    }
    const periodReturns = periods.map((p) =>
      periodReturnFromSeries(series, p.start, p.end)
    );
    const indexedSeries = buildIndexed(periodReturns);
    results.push({
      benchmarkId: key,
      label: BENCHMARK_LABELS[key] ?? key,
      periodReturns,
      indexedSeries,
    });
  }
  return results;
}
