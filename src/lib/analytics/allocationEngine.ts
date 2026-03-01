/**
 * Allocation engine: bucket-level allocation, target vs actual, residual.
 * Outputs AllocationBucket[] (invested, marketValue, allocationPct, targetPct, residualPct, pnl, roi, unrealizedST/LT).
 */

import type { Holding, AllocationBucketId } from "@/lib/types";
import type { AllocationBucket } from "./types";

const BUCKET_LABELS: Record<AllocationBucketId, string> = {
  DirectEquity: "Direct Equity",
  EquityMF: "Equity MF",
  DebtMF: "Debt MF",
  AlternativeFOF: "Alternative FOF",
  PMS: "PMS",
  AIF: "AIF",
  ETF: "ETF",
  IndexFund: "Index Fund",
};

/** Map AssetType to allocation bucket (single bucket per type for now) */
function assetTypeToBucket(assetType: Holding["assetType"]): AllocationBucketId {
  const map: Record<string, AllocationBucketId> = {
    Equity: "DirectEquity",
    MutualFund: "EquityMF",
    DebtMF: "DebtMF",
    AIF: "AIF",
    PMS: "PMS",
    ETF: "ETF",
    IndexFund: "IndexFund",
  };
  return map[assetType] ?? "EquityMF";
}

export interface AllocationEngineInput {
  holdings: Holding[];
}

export function getAllocationBuckets(input: AllocationEngineInput): AllocationBucket[] {
  const { holdings } = input;
  const totalMarketValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (totalMarketValue === 0) {
    return (Object.keys(BUCKET_LABELS) as AllocationBucketId[]).map((bucketId) => ({
      bucketId,
      label: BUCKET_LABELS[bucketId],
      invested: 0,
      marketValue: 0,
      allocationPct: 0,
      targetPct: 0,
      residualPct: 0,
      pnl: 0,
      roi: 0,
      unrealizedST: 0,
      unrealizedLT: 0,
    }));
  }

  const byBucket = new Map<
    AllocationBucketId,
    {
      invested: number;
      marketValue: number;
      targetWeighted: number;
      unrealizedST: number;
      unrealizedLT: number;
    }
  >();

  const allBucketIds = Object.keys(BUCKET_LABELS) as AllocationBucketId[];
  for (const bid of allBucketIds) {
    byBucket.set(bid, {
      invested: 0,
      marketValue: 0,
      targetWeighted: 0,
      unrealizedST: 0,
      unrealizedLT: 0,
    });
  }

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  for (const h of holdings) {
    const bucketId = assetTypeToBucket(h.assetType);
    const data = byBucket.get(bucketId)!;
    const cost = h.costValue ?? h.investedAmount;
    data.invested += cost;
    data.marketValue += h.currentValue;
    // Target weighted = sum of (holding's target % × holding's value) so bucket targets can sum to 100%
    data.targetWeighted += (h.targetAllocationPct / 100) * h.currentValue;
    const gain = h.currentValue - cost;
    // Simplified: assume ST if held < 1 year (no purchase date in base holding)
    const isLT = true; // could use first transaction date if available
    if (gain >= 0) {
      if (isLT) data.unrealizedLT += gain;
      else data.unrealizedST += gain;
    } else {
      if (isLT) data.unrealizedLT += gain;
      else data.unrealizedST += gain;
    }
    byBucket.set(bucketId, data);
  }

  const totalTargetWeighted = allBucketIds.reduce(
    (sum, bid) => sum + byBucket.get(bid)!.targetWeighted,
    0
  );

  const result: AllocationBucket[] = [];
  for (const bucketId of allBucketIds) {
    const data = byBucket.get(bucketId)!;
    const allocationPct = (data.marketValue / totalMarketValue) * 100;
    const targetPct =
      totalTargetWeighted > 0
        ? (data.targetWeighted / totalTargetWeighted) * 100
        : 0;
    const residualPct = allocationPct - targetPct;
    const pnl = data.marketValue - data.invested;
    const roi = data.invested > 0 ? (pnl / data.invested) * 100 : 0;
    result.push({
      bucketId,
      label: BUCKET_LABELS[bucketId],
      invested: data.invested,
      marketValue: data.marketValue,
      allocationPct,
      targetPct,
      residualPct,
      pnl,
      roi,
      unrealizedST: data.unrealizedST,
      unrealizedLT: data.unrealizedLT,
    });
  }

  return result.sort((a, b) => b.marketValue - a.marketValue);
}
