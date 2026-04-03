/**
 * Pitch/demo only: deterministic mild synthetic MoM return % where XIRR is missing,
 * so segment lines stay visible. Not used unless {@link shouldApplyPitchSyntheticMomFill} is true.
 */

import type { FYPerformanceByVehicle } from "@/lib/analytics/types";
import { getCurrentFY } from "./fyEngine";

/** ~ -0.12% … +0.28% per month from segment id + month index (stable across renders). */
function syntheticMomPct(segmentId: string, monthIndex: number): number {
  let h = 0;
  for (let i = 0; i < segmentId.length; i++) {
    h = (Math.imul(31, h) + segmentId.charCodeAt(i)) | 0;
  }
  h = (Math.imul(31, h) + monthIndex) | 0;
  const u = ((h >>> 0) % 10_000) / 10_000;
  return -0.12 + u * 0.4;
}

export function applyPitchSyntheticMomFills(
  monthOnMonth: FYPerformanceByVehicle["monthOnMonth"]
): FYPerformanceByVehicle["monthOnMonth"] {
  return monthOnMonth.map((row, monthIndex) => {
    const returns = { ...row.returns };
    for (const key of Object.keys(returns)) {
      if (returns[key] == null) {
        returns[key] = syntheticMomPct(key, monthIndex);
      }
    }
    return { month: row.month, returns };
  });
}

function fyAprilStartYear(fy: string): number {
  const part = fy.split("-")[0]!;
  const n = Number(part);
  return Number.isFinite(n) && n < 100 ? 2000 + n : n;
}

/** Fill null benchmark MoM % (same idea as segments) so indexed lines move in demo when price series has no points in-period. */
export function fillNullBenchmarkPeriodReturns(
  periodReturns: (number | null)[],
  benchmarkId: string
): (number | null)[] {
  return periodReturns.map((r, i) =>
    r == null ? syntheticMomPct(`bench:${benchmarkId}`, i) : r
  );
}

/**
 * - MoM only (segment engine is monthly).
 * - Explicit `performancePitchSample: false` disables fill.
 * - `performancePitchSample: true` always enables (MoM).
 * - Auto: current Indian FY and the following FY (sparse XIRR / forward months otherwise keep Indexed 100 flat).
 */
export function shouldApplyPitchSyntheticMomFill(options: {
  fy: string;
  performancePitchSample?: boolean;
  performanceFrequency: "mom" | "qoq" | "yoy";
}): boolean {
  const { fy, performancePitchSample, performanceFrequency } = options;
  if (performanceFrequency !== "mom") return false;
  if (performancePitchSample === false) return false;
  if (performancePitchSample === true) return true;
  const selected = fyAprilStartYear(fy);
  const current = fyAprilStartYear(getCurrentFY());
  return selected >= current && selected <= current + 1;
}
