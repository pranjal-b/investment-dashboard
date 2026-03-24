/**
 * Single classifier for five-sleeve allocation.
 * Order: explicit allocationSleeve → instrumentSubtype (+ unlistedStage hints) → assetType fallback.
 */

import type { AllocationSleeve, Holding, InstrumentSubtype } from "@/lib/types";

const SUBTYPE_TO_SLEEVE: Partial<Record<InstrumentSubtype, AllocationSleeve>> = {
  gold_etf: "alternatives",
  reit: "alternatives",
  invit: "alternatives",
  liquid_fund: "liquid",
  arbitrage: "liquid",
  bank_balance: "liquid",
  credit_fund: "debt",
  short_maturity_bond: "debt",
  pe_direct_early: "unlisted",
  pe_growth: "unlisted",
  pe_fund_early_growth: "unlisted",
  pe_fund_late: "unlisted",
  angel_seed: "unlisted",
  early: "unlisted",
  growth: "unlisted",
  late_pre_ipo: "unlisted",
  direct_equity: "equity",
  feeder_fund: "equity",
  equity_etf: "equity",
  equity_mf: "equity",
  pms: "equity",
};

function isLiquidDebtMF(h: Holding): boolean {
  const name = (h.assetName ?? "").toLowerCase();
  const sector = String(h.sector ?? "").toLowerCase();
  return (
    sector === "liquid" ||
    /\bliquid fund\b/.test(name) ||
    /\barbitrage\b/.test(name)
  );
}

function isCreditDebtMF(h: Holding): boolean {
  const name = (h.assetName ?? "").toLowerCase();
  return /\bcredit\b/.test(name) || /\bcorporate bond\b/.test(name);
}

/**
 * Resolve policy sleeve for a holding.
 * Subtype rules apply before naive assetType so MFs/ETFs can split across sleeves.
 */
export function getAllocationSleeve(h: Holding): AllocationSleeve {
  if (h.allocationSleeve) return h.allocationSleeve;

  const st = h.instrumentSubtype;
  if (st && SUBTYPE_TO_SLEEVE[st]) {
    return SUBTYPE_TO_SLEEVE[st]!;
  }

  const stage = (h.unlistedStage ?? "").toLowerCase();
  if (
    stage.includes("pe") ||
    stage.includes("angel") ||
    stage.includes("pre-ipo") ||
    stage === "early" ||
    stage === "growth" ||
    stage === "late"
  ) {
    return "unlisted";
  }

  switch (h.assetType) {
    case "Equity":
    case "PMS":
    case "ETF":
    case "IndexFund":
    case "MutualFund":
      return "equity";
    case "DebtMF":
      if (isLiquidDebtMF(h)) return "liquid";
      if (isCreditDebtMF(h)) return "debt";
      return "debt";
    case "AIF":
      return "unlisted";
    default:
      return "equity";
  }
}
