/**
 * Core Buckets: institutional hierarchy for advanced filters.
 * Subtype-aware matching via holdingMatchesCoreOption (uses getAllocationSleeve).
 */

import type { AssetType, Holding } from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";

export interface CoreBucketOption {
  value: string;
  label: string;
}

export interface CoreBucketGroup {
  label: string;
  options: CoreBucketOption[];
}

function isLiquidFundLike(h: Holding): boolean {
  const name = (h.assetName ?? "").toLowerCase();
  const sector = String(h.sector ?? "").toLowerCase();
  return sector === "liquid" || /\bliquid fund\b/.test(name) || /\barbitrage\b/.test(name);
}

function isCreditLike(h: Holding): boolean {
  const name = (h.assetName ?? "").toLowerCase();
  return /\bcredit\b/.test(name) || /\bcorporate bond\b/.test(name);
}

/**
 * Whether a holding matches a core-bucket or sub-bucket option (for multi-select filters).
 */
export function holdingMatchesCoreOption(h: Holding, optionValue: string): boolean {
  const sleeve = getAllocationSleeve(h);
  const st = h.instrumentSubtype;
  const name = (h.assetName ?? "").toLowerCase();

  switch (optionValue) {
    case "liquid":
    case "cash":
      return sleeve === "liquid";

    case "savings":
      return false;

    case "liquid-funds":
      return st === "liquid_fund" || (h.assetType === "DebtMF" && sleeve === "liquid" && isLiquidFundLike(h));

    case "arbitrage-funds":
      return st === "arbitrage" || (sleeve === "liquid" && /\barbitrage\b/.test(name));

    case "bank-balances":
      return st === "bank_balance";

    case "unlisted":
      return sleeve === "unlisted";

    case "private-equity":
    case "venture-capital":
    case "real-estate-funds":
    case "hedge-strategies":
    case "structured-products":
      return h.assetType === "AIF" && sleeve === "unlisted";

    case "aif":
      return h.assetType === "AIF";

    case "alternatives":
      return sleeve === "alternatives";

    case "gold-etf":
      return st === "gold_etf";

    case "reit-invit":
      return st === "reit" || st === "invit";

    case "equity":
      return sleeve === "equity";

    case "direct-stocks":
      return sleeve === "equity" && h.assetType === "Equity";

    case "equity-mf":
      return sleeve === "equity" && h.assetType === "MutualFund";

    case "pms-equity":
      return sleeve === "equity" && h.assetType === "PMS";

    case "index-funds":
      return sleeve === "equity" && h.assetType === "IndexFund";

    case "etf-equity":
      return sleeve === "equity" && h.assetType === "ETF" && st !== "gold_etf";

    case "international-equity":
      return st === "feeder_fund" || (sleeve === "equity" && /offshore|international|feeder/i.test(h.assetName));

    case "debt":
      return sleeve === "debt";

    case "credit-funds":
      return st === "credit_fund" || (sleeve === "debt" && isCreditLike(h));

    case "debt-mf":
      return (
        sleeve === "debt" &&
        h.assetType === "DebtMF" &&
        st !== "liquid_fund" &&
        st !== "credit_fund" &&
        !isLiquidFundLike(h)
      );

    case "bonds":
    case "tax-free-bonds":
      return sleeve === "debt" && (st === "short_maturity_bond" || /bond|gilt|sdl/i.test(name));

    case "debt-pms":
      return h.assetType === "PMS" && sleeve === "debt";

    case "fds":
      return false;

    default: {
      const types = CORE_BUCKET_TO_ASSET_TYPES[optionValue];
      return types != null && types.length > 0 && types.includes(h.assetType);
    }
  }
}

/** Option value → asset types (legacy / coarse path only; prefer holdingMatchesCoreOption). */
export const CORE_BUCKET_TO_ASSET_TYPES: Record<string, AssetType[]> = {
  equity: ["Equity", "MutualFund", "PMS", "IndexFund", "ETF"],
  "direct-stocks": ["Equity"],
  "equity-mf": ["MutualFund"],
  "pms-equity": ["PMS"],
  "index-funds": ["IndexFund"],
  "etf-equity": ["ETF"],
  "international-equity": ["Equity"],

  debt: ["DebtMF"],
  "debt-mf": ["DebtMF"],
  bonds: ["DebtMF"],
  "tax-free-bonds": ["DebtMF"],
  fds: [],
  "debt-pms": ["PMS"],
  "credit-funds": ["DebtMF"],

  liquid: [],
  cash: [],
  savings: [],
  "liquid-funds": [],
  "arbitrage-funds": [],
  "bank-balances": [],

  unlisted: [],
  aif: ["AIF"],
  "private-equity": ["AIF"],
  "venture-capital": ["AIF"],
  "real-estate-funds": ["AIF"],
  "hedge-strategies": ["AIF"],
  "structured-products": ["AIF"],

  alternatives: [],
  "gold-etf": [],
  "reit-invit": [],
};

export const CORE_BUCKETS: CoreBucketGroup[] = [
  {
    label: "Liquid & equivalents",
    options: [
      { value: "liquid", label: "All liquid & equivalents" },
      { value: "liquid-funds", label: "Liquid funds" },
      { value: "arbitrage-funds", label: "Arbitrage funds" },
      { value: "bank-balances", label: "Bank balances" },
      { value: "savings", label: "Savings (if wired)" },
    ],
  },
  {
    label: "Debt / fixed income",
    options: [
      { value: "debt", label: "All debt" },
      { value: "debt-mf", label: "Debt mutual funds" },
      { value: "credit-funds", label: "Credit funds" },
      { value: "bonds", label: "Bonds / short duration" },
      { value: "tax-free-bonds", label: "Tax-free bonds" },
      { value: "fds", label: "FDs (if included)" },
      { value: "debt-pms", label: "Debt PMS" },
    ],
  },
  {
    label: "Equity",
    options: [
      { value: "equity", label: "All equity" },
      { value: "direct-stocks", label: "Direct stocks" },
      { value: "equity-mf", label: "Equity mutual funds" },
      { value: "pms-equity", label: "PMS equity" },
      { value: "index-funds", label: "Index funds" },
      { value: "etf-equity", label: "ETFs (equity)" },
      { value: "international-equity", label: "International / feeder" },
    ],
  },
  {
    label: "Alternatives",
    options: [
      { value: "alternatives", label: "All alternatives" },
      { value: "gold-etf", label: "Gold / commodity ETF" },
      { value: "reit-invit", label: "REIT / InvIT" },
    ],
  },
  {
    label: "Unlisted",
    options: [
      { value: "unlisted", label: "All unlisted" },
      { value: "aif", label: "All AIF positions" },
      { value: "private-equity", label: "Private equity" },
      { value: "venture-capital", label: "Venture capital" },
      { value: "real-estate-funds", label: "Real estate funds" },
      { value: "hedge-strategies", label: "Hedge / hybrid strategies" },
      { value: "structured-products", label: "Structured products" },
    ],
  },
];

export function getAssetTypesForCoreOption(value: string): AssetType[] {
  return CORE_BUCKET_TO_ASSET_TYPES[value] ?? [];
}

/** Top-level bucket ids (first option per group) for multi-select */
export const BUCKET_IDS = ["liquid", "debt", "equity", "alternatives", "unlisted"] as const;
export const BUCKET_LABELS: Record<(typeof BUCKET_IDS)[number], string> = {
  liquid: "Liquid & equivalents",
  debt: "Debt / fixed income",
  equity: "Equity",
  alternatives: "Alternatives",
  unlisted: "Unlisted",
};

export function getBucketIdForGroup(group: CoreBucketGroup): string {
  return group.options[0]?.value ?? "";
}

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
