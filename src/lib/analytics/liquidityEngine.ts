/**
 * Liquidity helpers for liquid-equivalents analytics (e.g. idle bank cash from holdings).
 */

import type { Holding } from "@/lib/types";

export function sumIdleBankBalances(holdings: Holding[]): {
  idleINR: number;
  targetINR: number;
  bankCount: number;
  totalMV: number;
} {
  const totalMV = holdings.reduce((s, h) => s + h.currentValue, 0);
  let idle = 0;
  let target = 0;
  let bankCount = 0;
  for (const h of holdings) {
    if (h.instrumentSubtype === "bank_balance") {
      idle += h.currentValue;
      target += (h.targetAllocationPct / 100) * totalMV;
      bankCount += 1;
    }
  }
  return { idleINR: idle, targetINR: target, bankCount, totalMV };
}
