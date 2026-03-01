/**
 * Core Buckets: institutional asset class hierarchy for filters.
 * Maps to AssetType for filtering holdings.
 */

import type { AssetType } from "@/lib/types";

export interface CoreBucketOption {
  value: string;
  label: string;
}

export interface CoreBucketGroup {
  label: string;
  options: CoreBucketOption[];
}

/** Option value (e.g. "equity", "direct-stocks") → asset types to include */
export const CORE_BUCKET_TO_ASSET_TYPES: Record<string, AssetType[]> = {
  // Equity bucket (parent = all equity)
  equity: ["Equity", "MutualFund", "PMS", "IndexFund", "ETF"],
  "direct-stocks": ["Equity"],
  "equity-mf": ["MutualFund"],
  "pms-equity": ["PMS"],
  "index-funds": ["IndexFund"],
  "etf-equity": ["ETF"],
  "international-equity": ["Equity"],

  // Debt / Fixed Income
  debt: ["DebtMF"],
  "debt-mf": ["DebtMF"],
  bonds: ["DebtMF"],
  "tax-free-bonds": ["DebtMF"],
  fds: [],
  "debt-pms": ["PMS"],
  "credit-funds": ["DebtMF"],

  // Alternatives
  alternatives: ["AIF"],
  aif: ["AIF"],
  "private-equity": ["AIF"],
  "venture-capital": ["AIF"],
  "real-estate-funds": ["AIF"],
  "hedge-strategies": ["AIF"],
  "structured-products": ["AIF"],

  // Cash & Cash Equivalents
  cash: ["MutualFund"],
  savings: [],
  "liquid-funds": ["MutualFund"],
  "arbitrage-funds": ["MutualFund"],
};

export const CORE_BUCKETS: CoreBucketGroup[] = [
  {
    label: "Equity",
    options: [
      { value: "equity", label: "All Equity" },
      { value: "direct-stocks", label: "Direct stocks" },
      { value: "equity-mf", label: "Equity mutual funds" },
      { value: "pms-equity", label: "PMS equity mandates" },
      { value: "index-funds", label: "Index funds" },
      { value: "etf-equity", label: "ETFs (equity)" },
      { value: "international-equity", label: "International equity" },
    ],
  },
  {
    label: "Debt / Fixed Income",
    options: [
      { value: "debt", label: "All Debt / Fixed Income" },
      { value: "debt-mf", label: "Debt mutual funds" },
      { value: "bonds", label: "Bonds" },
      { value: "tax-free-bonds", label: "Tax-free bonds" },
      { value: "fds", label: "FDs (if included)" },
      { value: "debt-pms", label: "Debt PMS" },
      { value: "credit-funds", label: "Credit funds" },
    ],
  },
  {
    label: "Alternatives",
    options: [
      { value: "alternatives", label: "All Alternatives" },
      { value: "aif", label: "AIF (Category I/II/III)" },
      { value: "private-equity", label: "Private equity" },
      { value: "venture-capital", label: "Venture capital" },
      { value: "real-estate-funds", label: "Real estate funds" },
      { value: "hedge-strategies", label: "Hedge strategies" },
      { value: "structured-products", label: "Structured products" },
    ],
  },
  {
    label: "Cash & Cash Equivalents",
    options: [
      { value: "cash", label: "All Cash & Equivalents" },
      { value: "savings", label: "Savings" },
      { value: "liquid-funds", label: "Liquid funds" },
      { value: "arbitrage-funds", label: "Arbitrage funds" },
    ],
  },
];

export function getAssetTypesForCoreOption(value: string): AssetType[] {
  return CORE_BUCKET_TO_ASSET_TYPES[value] ?? [];
}

/** Top-level bucket ids and labels for multi-select */
export const BUCKET_IDS = ["equity", "debt", "alternatives", "cash"] as const;
export const BUCKET_LABELS: Record<(typeof BUCKET_IDS)[number], string> = {
  equity: "Equity",
  debt: "Debt / Fixed Income",
  alternatives: "Alternatives",
  cash: "Cash & Cash Equivalents",
};

/** Get bucket id for a group (first option value) */
export function getBucketIdForGroup(group: CoreBucketGroup): string {
  return group.options[0]?.value ?? "";
}

/** Sub-options for the second multi-select: only from groups whose bucket is in selectedBucketIds */
export function getSubOptionsForBuckets(selectedBucketIds: string[]): CoreBucketOption[] {
  if (selectedBucketIds.length === 0) return [];
  const set = new Set(selectedBucketIds);
  const out: CoreBucketOption[] = [];
  for (const group of CORE_BUCKETS) {
    const bucketId = getBucketIdForGroup(group);
    if (set.has(bucketId)) {
      for (const opt of group.options) out.push(opt);
    }
  }
  return out;
}
