/**
 * Allocation overview tree: aggregates holdings by investment policy category paths.
 */

import type { Holding } from "@/lib/types";
import { computeXIRR, aggregateCashflows } from "@/lib/calculations/xirr";
import {
  getInvestmentPolicyPath,
  policyPathKey,
  labelForPolicySegment,
  POLICY_SIBLING_ORDER,
} from "@/lib/classification/investmentPolicyCategory";
import { splitUnrealizedGainStLt } from "@/lib/analytics/unrealizedStLt";

export interface PolicyAllocationTreeNode {
  pathKey: string;
  segmentId: string;
  depth: number;
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
  /** Annualized XIRR minus simple ROI (% pts); null if XIRR undefined. Timing of cash flows vs cost basis. */
  xirrMinusRoi: number | null;
  children: PolicyAllocationTreeNode[];
}

export interface PolicyAllocationTreeInput {
  holdings: Holding[];
  dateRange?: [Date, Date] | null;
}

function aggregateHoldings(
  holdings: Holding[],
  totalMV: number,
  totalTargetW: number,
  asOf: Date
): Omit<PolicyAllocationTreeNode, "children" | "pathKey" | "segmentId" | "depth" | "label" | "portfolioXIRR" | "xirrMinusRoi"> {
  if (holdings.length === 0) {
    return {
      invested: 0,
      marketValue: 0,
      allocationPct: 0,
      targetPct: 0,
      residualPct: 0,
      pnl: 0,
      roi: 0,
      unrealizedST: 0,
      unrealizedLT: 0,
    };
  }
  const invested = holdings.reduce((s, h) => s + (h.costValue ?? h.investedAmount), 0);
  const marketValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const targetW = holdings.reduce(
    (s, h) => s + (h.targetAllocationPct / 100) * h.currentValue,
    0
  );
  const allocationPct = totalMV > 0 ? (marketValue / totalMV) * 100 : 0;
  const targetPct = totalTargetW > 0 ? (targetW / totalTargetW) * 100 : 0;
  let unrealizedST = 0;
  let unrealizedLT = 0;
  for (const h of holdings) {
    const u = splitUnrealizedGainStLt(h, asOf);
    unrealizedST += u.st;
    unrealizedLT += u.lt;
  }
  const pnl = marketValue - invested;
  const roi = invested > 0 ? (pnl / invested) * 100 : 0;

  return {
    invested,
    marketValue,
    allocationPct,
    targetPct,
    residualPct: allocationPct - targetPct,
    pnl,
    roi,
    unrealizedST,
    unrealizedLT,
  };
}

export function holdingsUnderPrefix(
  prefix: string,
  byLeaf: Map<string, Holding[]>
): Holding[] {
  const out: Holding[] = [];
  for (const [leaf, hh] of byLeaf) {
    if (leaf === prefix || leaf.startsWith(prefix + "|")) {
      out.push(...hh);
    }
  }
  return out;
}

export function sortChildIds(parentPathKey: string, ids: string[]): string[] {
  const order = POLICY_SIBLING_ORDER[parentPathKey];
  if (!order?.length) {
    return [...ids].sort();
  }
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...ids].sort((a, b) => {
    const ra = rank.get(a) ?? 999;
    const rb = rank.get(b) ?? 999;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

export function getPolicyAllocationTree(
  input: PolicyAllocationTreeInput
): PolicyAllocationTreeNode[] {
  const { holdings, dateRange } = input;
  const asOf = dateRange?.[1] ?? new Date();
  const totalMV = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (totalMV <= 0) return [];

  const totalTargetW = holdings.reduce(
    (s, h) => s + (h.targetAllocationPct / 100) * h.currentValue,
    0
  );

  const byLeaf = new Map<string, Holding[]>();
  for (const h of holdings) {
    const path = getInvestmentPolicyPath(h);
    const key = policyPathKey(path);
    if (!byLeaf.has(key)) byLeaf.set(key, []);
    byLeaf.get(key)!.push(h);
  }

  const allPrefixes = new Set<string>();
  for (const key of byLeaf.keys()) {
    const parts = key.split("|");
    for (let i = 1; i <= parts.length; i++) {
      allPrefixes.add(parts.slice(0, i).join("|"));
    }
  }

  function buildNode(pathKey: string): PolicyAllocationTreeNode {
    const parts = pathKey.split("|");
    const segmentId = parts[parts.length - 1]!;
    const depth = parts.length - 1;
    const hh = holdingsUnderPrefix(pathKey, byLeaf);
    const agg = aggregateHoldings(hh, totalMV, totalTargetW, asOf);
    const cashflows = aggregateCashflows(hh).map((cf) => ({
      date: cf.date,
      amount: cf.amount,
      type: "nav" as const,
    }));
    const xirrDec = computeXIRR(cashflows, dateRange ?? null);
    const portfolioXIRRFilt = xirrDec != null ? xirrDec * 100 : null;
    const xirrMinusRoi =
      portfolioXIRRFilt != null ? portfolioXIRRFilt - agg.roi : null;

    const childIds = new Set<string>();
    const prefixWithPipe = pathKey + "|";
    for (const k of byLeaf.keys()) {
      if (!k.startsWith(prefixWithPipe)) continue;
      const rest = k.slice(prefixWithPipe.length);
      const nextSeg = rest.split("|")[0];
      if (nextSeg) childIds.add(nextSeg);
    }
    const sortedChildSegments = sortChildIds(pathKey, Array.from(childIds));
    const children = sortedChildSegments
      .map((seg) => buildNode(pathKey ? `${pathKey}|${seg}` : seg))
      .filter((n) => n.marketValue > 0);

    return {
      pathKey,
      segmentId,
      depth,
      label: labelForPolicySegment(segmentId),
      portfolioXIRR: portfolioXIRRFilt,
      xirrMinusRoi,
      ...agg,
      children,
    };
  }

  const rootSegments = sortChildIds(
    "",
    Array.from(
      new Set(
        [...byLeaf.keys()].map((k) => k.split("|")[0]!).filter(Boolean)
      )
    )
  );

  return rootSegments
    .map((seg) => buildNode(seg))
    .filter((n) => n.marketValue > 0);
}
