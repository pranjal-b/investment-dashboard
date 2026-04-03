/**
 * Allocation analytics: five-sleeve macro allocation,
 * rebalance insight, health score, top holdings by deviation.
 * All calculations centralized; UI consumes via selectors only.
 */

import type { Holding, AllocationBucketId, AllocationSleeve } from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";
import { computeXIRR, aggregateCashflows } from "@/lib/calculations/xirr";
import { assetTypeToBucket, ALLOCATION_BUCKET_LABELS } from "./allocationEngine";
import type {
  MacroAllocationRow,
  MacroClassId,
  RebalanceInsight,
  TopHoldingAllocationRow,
} from "./types";
import { splitUnrealizedGainStLt } from "@/lib/analytics/unrealizedStLt";

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
  alternatives: "Alternative investments",
  unlisted: "Unlisted",
};

/** Top-level allocation overview rows (drill-down parent order). */
const OVERVIEW_SLEEVE_ORDER: AllocationSleeve[] = [
  "debt",
  "equity",
  "alternatives",
  "unlisted",
  "liquid",
];

const OVERVIEW_SLEEVE_LABELS: Record<AllocationSleeve, string> = {
  liquid: "Liquid & equivalents",
  debt: "Debt",
  equity: "Equity",
  alternatives: "Alternative investments",
  unlisted: "Unlisted",
};

export interface SleeveChildBucketRow {
  sleeveId: AllocationSleeve;
  bucketId: AllocationBucketId;
  label: string;
  invested: number;
  marketValue: number;
  allocationPct: number;
  targetPct: number;
  residualPct: number;
  pnl: number;
  roi: number;
  unrealizedST: number;
  unrealizedLT: number;
}

export interface SleeveAllocationBreakdownRow {
  sleeveId: AllocationSleeve;
  label: string;
  invested: number;
  marketValue: number;
  allocationPct: number;
  targetPct: number;
  residualPct: number;
  pnl: number;
  roi: number;
  unrealizedST: number;
  unrealizedLT: number;
  portfolioXIRR: number | null;
  children: SleeveChildBucketRow[];
}

export interface SleeveBreakdownInput {
  holdings: Holding[];
  dateRange?: [Date, Date] | null;
}

type ChildAgg = {
  bucketId: AllocationBucketId;
  invested: number;
  marketValue: number;
  targetWeighted: number;
  unrealizedST: number;
  unrealizedLT: number;
};

function addHoldingUnrealized(data: ChildAgg, holding: Holding, asOf: Date): void {
  const u = splitUnrealizedGainStLt(holding, asOf);
  data.unrealizedST += u.st;
  data.unrealizedLT += u.lt;
}

/**
 * Policy-sleeve rollup with per–asset-type children for allocation overview drill-down.
 */
export function getAllocationSleeveBreakdown(
  input: SleeveBreakdownInput
): SleeveAllocationBreakdownRow[] {
  const { holdings, dateRange } = input;
  const asOf = dateRange?.[1] ?? new Date();
  const totalMV = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (totalMV <= 0) return [];

  const totalTargetWeighted = holdings.reduce(
    (s, h) => s + (h.targetAllocationPct / 100) * h.currentValue,
    0
  );

  const bySleeve = new Map<
    AllocationSleeve,
    { holdings: Holding[]; children: Map<AllocationBucketId, ChildAgg> }
  >();
  for (const sid of OVERVIEW_SLEEVE_ORDER) {
    bySleeve.set(sid, { holdings: [], children: new Map() });
  }

  for (const h of holdings) {
    const sleeve = getAllocationSleeve(h);
    if (!bySleeve.has(sleeve)) continue;
    const sleeveAgg = bySleeve.get(sleeve)!;
    sleeveAgg.holdings.push(h);

    const bucketId = assetTypeToBucket(h.assetType);
    const child =
      sleeveAgg.children.get(bucketId) ??
      ({
        bucketId,
        invested: 0,
        marketValue: 0,
        targetWeighted: 0,
        unrealizedST: 0,
        unrealizedLT: 0,
      } satisfies ChildAgg);
    const cost = h.costValue ?? h.investedAmount;
    child.invested += cost;
    child.marketValue += h.currentValue;
    child.targetWeighted += (h.targetAllocationPct / 100) * h.currentValue;
    addHoldingUnrealized(child, h, asOf);
    sleeveAgg.children.set(bucketId, child);
  }

  const result: SleeveAllocationBreakdownRow[] = [];

  for (const sleeveId of OVERVIEW_SLEEVE_ORDER) {
    const agg = bySleeve.get(sleeveId)!;
    const mv = agg.holdings.reduce((s, h) => s + h.currentValue, 0);
    if (mv <= 0) continue;

    const invested = agg.holdings.reduce(
      (s, h) => s + (h.costValue ?? h.investedAmount),
      0
    );
    const targetW = agg.holdings.reduce(
      (s, h) => s + (h.targetAllocationPct / 100) * h.currentValue,
      0
    );
    const allocationPct = (mv / totalMV) * 100;
    const targetPct =
      totalTargetWeighted > 0 ? (targetW / totalTargetWeighted) * 100 : 0;
    const residualPct = allocationPct - targetPct;
    const pnl = mv - invested;
    const roi = invested > 0 ? (pnl / invested) * 100 : 0;

    let unrealizedST = 0;
    let unrealizedLT = 0;
    for (const h of agg.holdings) {
      const u = splitUnrealizedGainStLt(h, asOf);
      unrealizedST += u.st;
      unrealizedLT += u.lt;
    }

    const children: SleeveChildBucketRow[] = [];
    for (const c of agg.children.values()) {
      if (c.marketValue <= 0) continue;
      const cAlloc = (c.marketValue / totalMV) * 100;
      const cTarget =
        totalTargetWeighted > 0 ? (c.targetWeighted / totalTargetWeighted) * 100 : 0;
      const cPnl = c.marketValue - c.invested;
      const cRoi = c.invested > 0 ? (cPnl / c.invested) * 100 : 0;
      children.push({
        sleeveId,
        bucketId: c.bucketId,
        label: ALLOCATION_BUCKET_LABELS[c.bucketId],
        invested: c.invested,
        marketValue: c.marketValue,
        allocationPct: cAlloc,
        targetPct: cTarget,
        residualPct: cAlloc - cTarget,
        pnl: cPnl,
        roi: cRoi,
        unrealizedST: c.unrealizedST,
        unrealizedLT: c.unrealizedLT,
      });
    }
    children.sort((a, b) => b.marketValue - a.marketValue);

    const cashflows = aggregateCashflows(agg.holdings).map((cf) => ({
      date: cf.date,
      amount: cf.amount,
      type: "nav" as const,
    }));
    const xirrDec = computeXIRR(cashflows, dateRange ?? null);
    const portfolioXIRR = xirrDec != null ? xirrDec * 100 : null;

    result.push({
      sleeveId,
      label: OVERVIEW_SLEEVE_LABELS[sleeveId],
      invested,
      marketValue: mv,
      allocationPct,
      targetPct,
      residualPct,
      pnl,
      roi,
      unrealizedST,
      unrealizedLT,
      portfolioXIRR,
      children,
    });
  }

  return result;
}

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

  const overweights = withDeviation
    .filter((r) => r.residualPct > 0)
    .sort((a, b) => b.residualPct - a.residualPct);
  const underweights = withDeviation
    .filter((r) => r.residualPct < 0)
    .sort((a, b) => a.residualPct - b.residualPct);
  const overweight = overweights[0];
  const underweight = underweights[0];
  if (!overweight || !underweight) return null;

  const rebalanceAmount = (overweight.residualPct / 100) * totalMarketValue;
  const isLiquidOverweight = overweight.classId === "liquid";
  const message = isLiquidOverweight
    ? `Approximately ₹${formatCompact(rebalanceAmount)} needs redeployment from liquidity — ${overweight.label} is ${overweight.residualPct.toFixed(1)}% above target. Moving that into ${underweight.label} would restore target allocation.`
    : `${overweight.label} overweight by ${overweight.residualPct.toFixed(1)}%. Rebalancing ₹${formatCompact(rebalanceAmount)} into ${underweight.label} would restore target allocation.`;

  let secondaryMessage: string | undefined;
  const o2 = overweights[1];
  const u2 = underweights[1];
  if (o2 && u2 && (o2.classId !== overweight.classId || u2.classId !== underweight.classId)) {
    const amt2 = (o2.residualPct / 100) * totalMarketValue;
    secondaryMessage = `${o2.label} is still overweight by ${o2.residualPct.toFixed(1)}% while ${u2.label} is underweight (${u2.residualPct.toFixed(1)}%). Consider a further ≈₹${formatCompact(amt2)} shift from ${o2.label} toward ${u2.label}.`;
  }

  return {
    message,
    overweightClass: overweight.label,
    underweightClass: underweight.label,
    overweightSleeveId: overweight.classId,
    underweightSleeveId: underweight.classId,
    rebalanceAmount,
    deviationPct: overweight.residualPct,
    secondaryMessage,
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
