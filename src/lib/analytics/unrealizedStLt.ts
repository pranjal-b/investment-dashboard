/**
 * Split unrealized gain/loss into short-term vs long-term buckets for policy views.
 * Uses earliest acquisition proxy and Indian-style holding thresholds: 12 months for
 * equity / alternatives / unlisted; 36 months for liquid & debt sleeves.
 */

import type { Holding } from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";

function parseOptionalDate(s?: string | null): Date | null {
  if (s == null || String(s).trim() === "") return null;
  const raw = String(s).trim();
  const d = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Earliest plausible acquisition date for holding-period ST/LT (best-effort). */
export function getEarliestAcquisitionDate(h: Holding): Date | null {
  let best: Date | null = null;
  const consider = (d: Date | null) => {
    if (!d) return;
    if (!best || d < best) best = d;
  };

  for (const t of h.transactions ?? []) {
    if (t.type === "buy" && t.amount < 0) {
      consider(parseOptionalDate(t.date));
    }
  }

  consider(parseOptionalDate(h.fundFolio?.investmentDate));
  consider(parseOptionalDate(h.shortMaturityBond?.investmentDate));
  consider(parseOptionalDate(h.equityMf?.investmentDate));
  consider(parseOptionalDate(h.equityEtf?.investmentDate));
  consider(parseOptionalDate(h.goldEtf?.investmentDate));
  consider(parseOptionalDate(h.reitInvit?.investmentDate));
  consider(parseOptionalDate(h.feederFund?.investmentDate));
  consider(parseOptionalDate(h.inceptionDate));
  consider(parseOptionalDate(h.firstNavDate));

  return best;
}

function monthsHeld(acq: Date, asOf: Date): number {
  const ms = asOf.getTime() - acq.getTime();
  if (ms < 0) return 0;
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

/** Months required for unrealized gain/loss to count as long-term. */
export function longTermMonthsThreshold(h: Holding): number {
  const sleeve = getAllocationSleeve(h);
  if (sleeve === "liquid" || sleeve === "debt") return 36;
  return 12;
}

export function holdingUnrealizedIsLongTerm(h: Holding, asOf: Date): boolean | null {
  const acq = getEarliestAcquisitionDate(h);
  if (!acq) return null;
  return monthsHeld(acq, asOf) >= longTermMonthsThreshold(h);
}

export function splitUnrealizedGainStLt(
  h: Holding,
  asOf: Date = new Date()
): { st: number; lt: number } {
  const cost = h.costValue ?? h.investedAmount;
  const gain = h.currentValue - cost;
  if (gain === 0) return { st: 0, lt: 0 };

  const ltFlag = holdingUnrealizedIsLongTerm(h, asOf);
  const isLT = ltFlag !== false;

  if (gain > 0) {
    return isLT ? { st: 0, lt: gain } : { st: gain, lt: 0 };
  }
  return isLT ? { st: 0, lt: gain } : { st: gain, lt: 0 };
}
