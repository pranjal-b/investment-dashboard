/**
 * Allocation analytics: five-sleeve macro allocation,
 * rebalance insight, health score, top holdings by deviation.
 * All calculations centralized; UI consumes via selectors only.
 */

import type { Holding } from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";
import type {
  MacroAllocationRow,
  MacroClassId,
  RebalanceInsight,
  TopHoldingAllocationRow,
} from "./types";

const MACRO_ORDER: MacroClassId[] = [
  "liquid",
  "debt",
  "equity",
  "alternatives",
  "unlisted",
];
const MACRO_LABELS: Record<MacroClassId, string> = {
  liquid: "Liquid & equivalents",
  debt: "Debt",
  equity: "Equity",
  alternatives: "Alternatives",
  unlisted: "Unlisted",
};

/** Holding-level rollup so subtypes (liquid MF, gold ETF, PE) land in the right sleeve. */
export function getMacroAllocation(holdings: Holding[]): MacroAllocationRow[] {
  const totalMarketValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const byMacro = new Map<
    MacroClassId,
    { value: number; invested: number; targetWeighted: number }
  >();
  for (const cid of MACRO_ORDER) {
    byMacro.set(cid, { value: 0, invested: 0, targetWeighted: 0 });
  }

  for (const h of holdings) {
    const macro = getAllocationSleeve(h);
    const data = byMacro.get(macro)!;
    data.value += h.currentValue;
    data.invested += h.costValue ?? h.investedAmount;
    data.targetWeighted += (h.targetAllocationPct / 100) * h.currentValue;
    byMacro.set(macro, data);
  }

  const result: MacroAllocationRow[] = [];
  for (const classId of MACRO_ORDER) {
    const data = byMacro.get(classId)!;
    const actualPct = totalMarketValue > 0 ? (data.value / totalMarketValue) * 100 : 0;
    const targetPct =
      totalMarketValue > 0 ? (data.targetWeighted / totalMarketValue) * 100 : 0;
    result.push({
      classId,
      label: MACRO_LABELS[classId],
      actualPct,
      targetPct,
      value: data.value,
      invested: data.invested,
      residualPct: actualPct - targetPct,
    });
  }
  return result;
}

const REBALANCE_DEVIATION_THRESHOLD_PCT = 2;

export function getRebalanceInsight(
  macroAllocation: MacroAllocationRow[],
  totalMarketValue: number
): RebalanceInsight | null {
  const withDeviation = macroAllocation.filter((r) => Math.abs(r.residualPct) >= REBALANCE_DEVIATION_THRESHOLD_PCT);
  if (withDeviation.length === 0) return null;

  const overweight = withDeviation
    .filter((r) => r.residualPct > 0)
    .sort((a, b) => b.residualPct - a.residualPct)[0];
  const underweight = withDeviation
    .filter((r) => r.residualPct < 0)
    .sort((a, b) => a.residualPct - b.residualPct)[0];
  if (!overweight || !underweight) return null;

  const rebalanceAmount = (overweight.residualPct / 100) * totalMarketValue;
  const message = `${overweight.label} overweight by ${overweight.residualPct.toFixed(1)}%. Rebalancing ₹${formatCompact(rebalanceAmount)} into ${underweight.label} would restore target allocation.`;
  return {
    message,
    overweightClass: overweight.label,
    underweightClass: underweight.label,
    rebalanceAmount,
    deviationPct: overweight.residualPct,
  };
}

function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(1)} Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(1)} L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
  return value.toFixed(0);
}

const DEVIATION_PENALTY_CAP = 40;
const CONCENTRATION_PENALTY_CAP = 30;
const DEVIATION_SCALE = 2; // e.g. 20% total drift → 40 pts
const CONCENTRATION_SCALE = 1; // e.g. 30% top5 → 30 pts

export function getAllocationHealthScore(
  totalDeviationPct: number,
  top5ConcentrationPct: number
): number {
  const deviationPenalty = Math.min(
    DEVIATION_PENALTY_CAP,
    totalDeviationPct * DEVIATION_SCALE
  );
  const concentrationPenalty = Math.min(
    CONCENTRATION_PENALTY_CAP,
    top5ConcentrationPct * CONCENTRATION_SCALE
  );
  const score = Math.round(100 - deviationPenalty - concentrationPenalty);
  return Math.max(0, Math.min(100, score));
}

export function getTopHoldingsByDeviation(
  holdings: Holding[],
  totalMarketValue: number,
  limit: number = 10
): TopHoldingAllocationRow[] {
  if (totalMarketValue <= 0) return [];
  return holdings
    .map((h) => {
      const value = h.currentValue;
      const weightPct = (value / totalMarketValue) * 100;
      const targetPct = h.targetAllocationPct ?? 0;
      const invested = h.costValue ?? h.investedAmount;
      const gain = value - invested;
      return {
        holdingId: h.id,
        holdingName: h.assetName,
        allocationSleeve: getAllocationSleeve(h),
        weightPct,
        targetPct,
        deviationPct: weightPct - targetPct,
        value,
        invested,
        gain,
      };
    })
    .sort((a, b) => Math.abs(b.deviationPct) - Math.abs(a.deviationPct))
    .slice(0, limit);
}
