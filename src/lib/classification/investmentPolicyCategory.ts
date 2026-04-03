/**
 * Client investment policy taxonomy for allocation overview (drill-down).
 * Maps each holding to a path: Category 1 → Category 2 → optional Category 3.
 */

import type { Holding } from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";

/** Stable path segment ids (joined with "|" for tree keys). */
export const POLICY_PATH = {
  L1: {
    LIQUID: "l1_liquid_equiv",
    DEBT: "l1_debt_investment",
    EQUITY: "l1_equity_investment",
    ALTS: "l1_alternative_investments",
    UNLISTED: "l1_unlisted",
  },
  LIQ: {
    LIQUID: "l2_liquid",
    FD: "l2_fd",
    BANK: "l2_bank_balance",
  },
  DEBT: {
    TAX_FREE: "l2_tax_free_bonds",
    DMF: "l2_debt_mutual_funds",
    SHORT_MAT: "l2_short_maturity_bonds",
    DIRECT: "l2_direct_bonds",
    AA_PLUS: "l2_aa_and_above",
    STRUCT: "l2_structured_credit",
    HIGH_YIELD: "l2_high_yield",
  },
  DEBT_L3: {
    STRUCT_VENTURE: "l3_sc_venture_debt",
    STRUCT_AIF: "l3_sc_debt_aif",
    STRUCT_CREDIT: "l3_sc_credit_funds",
    HY_VENTURE: "l3_hy_venture_debt",
    HY_AIF: "l3_hy_debt_aif",
    HY_CREDIT: "l3_hy_credit_funds",
  },
  EQ: {
    SELF: "l2_self_managed_equity",
    MGD: "l2_managed_equity",
  },
  EQ_SELF: {
    OLD: "l3_portfolio_old",
    CORE: "l3_portfolio_core",
    EXIT: "l3_portfolio_exit",
  },
  EQ_MGD: {
    EMF: "l3_emf",
    PMF: "l3_pmf",
    FEEDER: "l3_feeder_funds",
    EQ_ETF: "l3_equity_etfs",
  },
  ALT: {
    ETF: "l2_alt_etfs",
    REIT: "l2_reits",
    INVIT: "l2_invits",
  },
  UNL: {
    PE_EARLY: "l2_pe_early_stage",
    PE_GROWTH: "l2_pe_growth_stage",
    PE_LATE: "l2_pe_late_stage",
    PRE_IPO: "l2_pre_ipo",
    PE_OTHER: "l2_pe_other",
  },
} as const;

export const POLICY_LABELS: Record<string, string> = {
  [POLICY_PATH.L1.LIQUID]: "Liquid & equivalents",
  [POLICY_PATH.L1.DEBT]: "Debt investment",
  [POLICY_PATH.L1.EQUITY]: "Equity investment",
  [POLICY_PATH.L1.ALTS]: "Alternative investments",
  [POLICY_PATH.L1.UNLISTED]: "Unlisted",

  [POLICY_PATH.LIQ.LIQUID]: "Liquid",
  [POLICY_PATH.LIQ.FD]: "FD",
  [POLICY_PATH.LIQ.BANK]: "Bank balance",

  [POLICY_PATH.DEBT.TAX_FREE]: "Tax-free bonds",
  [POLICY_PATH.DEBT.DMF]: "Debt mutual funds",
  [POLICY_PATH.DEBT.SHORT_MAT]: "Short maturity bonds",
  [POLICY_PATH.DEBT.DIRECT]: "Direct bonds",
  [POLICY_PATH.DEBT.AA_PLUS]: "AA and above",
  [POLICY_PATH.DEBT.STRUCT]: "Structured credit",
  [POLICY_PATH.DEBT.HIGH_YIELD]: "High yield",

  [POLICY_PATH.DEBT_L3.STRUCT_VENTURE]: "Venture debt funds",
  [POLICY_PATH.DEBT_L3.STRUCT_AIF]: "Debt AIFs",
  [POLICY_PATH.DEBT_L3.STRUCT_CREDIT]: "Credit funds",
  [POLICY_PATH.DEBT_L3.HY_VENTURE]: "Venture debt funds",
  [POLICY_PATH.DEBT_L3.HY_AIF]: "Debt AIFs",
  [POLICY_PATH.DEBT_L3.HY_CREDIT]: "Credit funds",

  [POLICY_PATH.EQ.SELF]: "Self-managed equity",
  [POLICY_PATH.EQ.MGD]: "Managed equity",

  [POLICY_PATH.EQ_SELF.OLD]: "Old portfolio",
  [POLICY_PATH.EQ_SELF.CORE]: "Core portfolio",
  [POLICY_PATH.EQ_SELF.EXIT]: "Exit portfolio",

  [POLICY_PATH.EQ_MGD.EMF]: "EMF (equity mutual funds)",
  [POLICY_PATH.EQ_MGD.PMF]: "PMF (portfolio managed funds)",
  [POLICY_PATH.EQ_MGD.FEEDER]: "Feeder funds",
  [POLICY_PATH.EQ_MGD.EQ_ETF]: "Equity ETFs",

  [POLICY_PATH.ALT.ETF]: "ETFs (incl. commodity)",
  [POLICY_PATH.ALT.REIT]: "REITs",
  [POLICY_PATH.ALT.INVIT]: "InvITs",

  [POLICY_PATH.UNL.PE_EARLY]: "PE — early stage",
  [POLICY_PATH.UNL.PE_GROWTH]: "PE — growth stage",
  [POLICY_PATH.UNL.PE_LATE]: "PE — late stage",
  [POLICY_PATH.UNL.PRE_IPO]: "Pre-IPO",
  [POLICY_PATH.UNL.PE_OTHER]: "PE / private equity (other)",
};

/** Sibling order under each parent prefix (deepest segment = sort key for L1). */
export const POLICY_SIBLING_ORDER: Record<string, string[]> = {
  "": [
    POLICY_PATH.L1.LIQUID,
    POLICY_PATH.L1.DEBT,
    POLICY_PATH.L1.EQUITY,
    POLICY_PATH.L1.ALTS,
    POLICY_PATH.L1.UNLISTED,
  ],
  [POLICY_PATH.L1.LIQUID]: [
    POLICY_PATH.LIQ.LIQUID,
    POLICY_PATH.LIQ.FD,
    POLICY_PATH.LIQ.BANK,
  ],
  [POLICY_PATH.L1.DEBT]: [
    POLICY_PATH.DEBT.TAX_FREE,
    POLICY_PATH.DEBT.DMF,
    POLICY_PATH.DEBT.SHORT_MAT,
    POLICY_PATH.DEBT.DIRECT,
    POLICY_PATH.DEBT.AA_PLUS,
    POLICY_PATH.DEBT.STRUCT,
    POLICY_PATH.DEBT.HIGH_YIELD,
  ],
  [`${POLICY_PATH.L1.DEBT}|${POLICY_PATH.DEBT.STRUCT}`]: [
    POLICY_PATH.DEBT_L3.STRUCT_VENTURE,
    POLICY_PATH.DEBT_L3.STRUCT_AIF,
    POLICY_PATH.DEBT_L3.STRUCT_CREDIT,
  ],
  [`${POLICY_PATH.L1.DEBT}|${POLICY_PATH.DEBT.HIGH_YIELD}`]: [
    POLICY_PATH.DEBT_L3.HY_VENTURE,
    POLICY_PATH.DEBT_L3.HY_AIF,
    POLICY_PATH.DEBT_L3.HY_CREDIT,
  ],
  [POLICY_PATH.L1.EQUITY]: [POLICY_PATH.EQ.SELF, POLICY_PATH.EQ.MGD],
  [`${POLICY_PATH.L1.EQUITY}|${POLICY_PATH.EQ.SELF}`]: [
    POLICY_PATH.EQ_SELF.OLD,
    POLICY_PATH.EQ_SELF.CORE,
    POLICY_PATH.EQ_SELF.EXIT,
  ],
  [`${POLICY_PATH.L1.EQUITY}|${POLICY_PATH.EQ.MGD}`]: [
    POLICY_PATH.EQ_MGD.EMF,
    POLICY_PATH.EQ_MGD.PMF,
    POLICY_PATH.EQ_MGD.FEEDER,
    POLICY_PATH.EQ_MGD.EQ_ETF,
  ],
  [POLICY_PATH.L1.ALTS]: [
    POLICY_PATH.ALT.ETF,
    POLICY_PATH.ALT.REIT,
    POLICY_PATH.ALT.INVIT,
  ],
  [POLICY_PATH.L1.UNLISTED]: [
    POLICY_PATH.UNL.PE_EARLY,
    POLICY_PATH.UNL.PE_GROWTH,
    POLICY_PATH.UNL.PE_LATE,
    POLICY_PATH.UNL.PRE_IPO,
    POLICY_PATH.UNL.PE_OTHER,
  ],
};

function norm(s: string): string {
  return s.toLowerCase();
}

function isLiquidDebtMFName(h: Holding): boolean {
  const name = norm(h.assetName ?? "");
  const sector = norm(String(h.sector ?? ""));
  return (
    sector === "liquid" ||
    /\bliquid fund\b/.test(name) ||
    /\barbitrage\b/.test(name)
  );
}

function isTaxFreeBond(h: Holding): boolean {
  if (h.instrumentSubtype === "tax_free_bond") return true;
  const n = norm(h.assetName ?? "");
  return /\btax[\s-]*free\b/.test(n);
}

function isShortMaturityMFname(h: Holding): boolean {
  const n = norm(h.assetName ?? "");
  return (
    /\bshort\b.*\b(dur|duration)\b/.test(n) ||
    /\blow\s+duration\b/.test(n) ||
    /\bultra\s+short\b/.test(n) ||
    /\bmoney\s+market\b/.test(n)
  );
}

/** IG vs HY split for structured credit tree. */
function debtCreditQualityBucket(h: Holding): "struct" | "hy" {
  const r = String(h.creditRating ?? "")
    .toUpperCase()
    .trim();
  if (!r || r === "NR" || r === "UNRATED") return "hy";
  if (r === "SOV" || r.startsWith("AAA") || r.startsWith("AA")) return "struct";
  if (r.startsWith("BBB") || r.startsWith("BB") || /^B[^A]/.test(r)) return "hy";
  return "hy";
}

function isDebtAIFholding(h: Holding): boolean {
  if (h.assetType !== "AIF") return false;
  if (h.instrumentSubtype === "debt_aif") return true;
  const n = norm(h.assetName ?? "");
  const raw = h.assetName ?? "";
  if (/\bventure\s+debt\b/i.test(raw)) return true;
  if (
    /\b(pe fund|private equity|early stage|growth stage|late stage|series a|pre-ipo)\b/i.test(raw)
  )
    return false;
  if (/\bventure\b/i.test(raw)) return false;
  return (
    /\bdebt\b/.test(n) || /\bcredit\b/.test(n) || /\bstructured\b/.test(n) || /\bopportunit(y|ies)\b/.test(n)
  );
}

function isVentureDebtHolding(h: Holding): boolean {
  if (h.instrumentSubtype === "venture_debt") return true;
  return /\bventure\s+debt\b/i.test(h.assetName ?? "");
}

function selfManagedPortfolioBucket(h: Holding): string {
  const m = h.equityMandate;
  if (m === "OldCore") return POLICY_PATH.EQ_SELF.OLD;
  if (m === "CoreExit") return POLICY_PATH.EQ_SELF.EXIT;
  if (m === "Core") return POLICY_PATH.EQ_SELF.CORE;
  const pt = h.portfolioType;
  if (pt === "Old") return POLICY_PATH.EQ_SELF.OLD;
  if (pt === "New") return POLICY_PATH.EQ_SELF.CORE;
  return POLICY_PATH.EQ_SELF.CORE;
}

function unlistedStagePath(h: Holding): string {
  const stage = norm(h.unlistedStage ?? "");
  const st = h.instrumentSubtype;
  if (stage.includes("pre-ipo") || stage.includes("preipo") || st === "late_pre_ipo")
    return POLICY_PATH.UNL.PRE_IPO;
  if (
    stage.includes("early") ||
    stage.includes("angel") ||
    st === "angel_seed" ||
    st === "pe_direct_early" ||
    st === "early"
  )
    return POLICY_PATH.UNL.PE_EARLY;
  if (stage.includes("growth") || st === "pe_growth" || st === "pe_fund_early_growth")
    return POLICY_PATH.UNL.PE_GROWTH;
  if (stage.includes("late") || st === "pe_fund_late") return POLICY_PATH.UNL.PE_LATE;
  return POLICY_PATH.UNL.PE_OTHER;
}

/**
 * Returns 2- or 3-segment policy path (ids), ordered root → leaf.
 */
export function getInvestmentPolicyPath(h: Holding): readonly string[] {
  // —— Liquid & equivalents ——
  if (h.instrumentSubtype === "bank_balance" || h.bankAccount) {
    return [POLICY_PATH.L1.LIQUID, POLICY_PATH.LIQ.BANK] as const;
  }
  if (
    h.instrumentSubtype === "fixed_deposit" ||
    /\bfd\b/i.test(h.assetName ?? "") ||
    /\bfixed\s+deposit\b/i.test(h.assetName ?? "")
  ) {
    return [POLICY_PATH.L1.LIQUID, POLICY_PATH.LIQ.FD] as const;
  }
  if (
    h.instrumentSubtype === "liquid_fund" ||
    h.instrumentSubtype === "arbitrage" ||
    (h.assetType === "DebtMF" && isLiquidDebtMFName(h))
  ) {
    return [POLICY_PATH.L1.LIQUID, POLICY_PATH.LIQ.LIQUID] as const;
  }

  // —— Alternatives (before equity/unlisted sweep) ——
  if (h.instrumentSubtype === "gold_etf") {
    return [POLICY_PATH.L1.ALTS, POLICY_PATH.ALT.ETF] as const;
  }
  if (h.instrumentSubtype === "reit") {
    return [POLICY_PATH.L1.ALTS, POLICY_PATH.ALT.REIT] as const;
  }
  if (h.instrumentSubtype === "invit") {
    return [POLICY_PATH.L1.ALTS, POLICY_PATH.ALT.INVIT] as const;
  }

  // —— Unlisted / PE ——
  const sleeve = getAllocationSleeve(h);
  if (sleeve === "unlisted" && !isDebtAIFholding(h)) {
    const leaf = unlistedStagePath(h);
    return [POLICY_PATH.L1.UNLISTED, leaf] as const;
  }

  // —— Debt investment ——
  if (isTaxFreeBond(h)) {
    return [POLICY_PATH.L1.DEBT, POLICY_PATH.DEBT.TAX_FREE] as const;
  }

  if (isVentureDebtHolding(h)) {
    const q = debtCreditQualityBucket(h);
    if (q === "struct") {
      return [
        POLICY_PATH.L1.DEBT,
        POLICY_PATH.DEBT.STRUCT,
        POLICY_PATH.DEBT_L3.STRUCT_VENTURE,
      ] as const;
    }
    return [
      POLICY_PATH.L1.DEBT,
      POLICY_PATH.DEBT.HIGH_YIELD,
      POLICY_PATH.DEBT_L3.HY_VENTURE,
    ] as const;
  }

  if (h.instrumentSubtype === "credit_fund") {
    const q = debtCreditQualityBucket(h);
    if (q === "struct") {
      return [
        POLICY_PATH.L1.DEBT,
        POLICY_PATH.DEBT.STRUCT,
        POLICY_PATH.DEBT_L3.STRUCT_CREDIT,
      ] as const;
    }
    return [
      POLICY_PATH.L1.DEBT,
      POLICY_PATH.DEBT.HIGH_YIELD,
      POLICY_PATH.DEBT_L3.HY_CREDIT,
    ] as const;
  }

  if (isDebtAIFholding(h)) {
    const q = debtCreditQualityBucket(h);
    if (q === "struct") {
      return [
        POLICY_PATH.L1.DEBT,
        POLICY_PATH.DEBT.STRUCT,
        POLICY_PATH.DEBT_L3.STRUCT_AIF,
      ] as const;
    }
    return [
      POLICY_PATH.L1.DEBT,
      POLICY_PATH.DEBT.HIGH_YIELD,
      POLICY_PATH.DEBT_L3.HY_AIF,
    ] as const;
  }

  if (h.instrumentSubtype === "short_maturity_bond") {
    if (isShortMaturityMFname(h)) {
      return [POLICY_PATH.L1.DEBT, POLICY_PATH.DEBT.SHORT_MAT] as const;
    }
    return [POLICY_PATH.L1.DEBT, POLICY_PATH.DEBT.DIRECT] as const;
  }

  if (h.assetType === "DebtMF") {
    const r = String(h.creditRating ?? "").toUpperCase();
    if (
      r === "SOV" ||
      r.startsWith("AAA") ||
      r.startsWith("AA") ||
      r.startsWith("AA+")
    ) {
      return [POLICY_PATH.L1.DEBT, POLICY_PATH.DEBT.AA_PLUS] as const;
    }
    return [POLICY_PATH.L1.DEBT, POLICY_PATH.DEBT.DMF] as const;
  }

  // —— Equity investment ——
  if (h.instrumentSubtype === "direct_equity" || (h.assetType === "Equity" && h.instrumentSubtype !== "pms")) {
    const leaf = selfManagedPortfolioBucket(h);
    return [POLICY_PATH.L1.EQUITY, POLICY_PATH.EQ.SELF, leaf] as const;
  }
  if (h.assetType === "Equity" && !h.instrumentSubtype) {
    const leaf = selfManagedPortfolioBucket(h);
    return [POLICY_PATH.L1.EQUITY, POLICY_PATH.EQ.SELF, leaf] as const;
  }

  if (h.instrumentSubtype === "pms" || h.assetType === "PMS") {
    return [POLICY_PATH.L1.EQUITY, POLICY_PATH.EQ.MGD, POLICY_PATH.EQ_MGD.PMF] as const;
  }

  if (h.instrumentSubtype === "feeder_fund") {
    return [POLICY_PATH.L1.EQUITY, POLICY_PATH.EQ.MGD, POLICY_PATH.EQ_MGD.FEEDER] as const;
  }

  if (h.instrumentSubtype === "equity_etf" || h.assetType === "ETF") {
    return [POLICY_PATH.L1.EQUITY, POLICY_PATH.EQ.MGD, POLICY_PATH.EQ_MGD.EQ_ETF] as const;
  }

  if (
    h.instrumentSubtype === "equity_mf" ||
    h.assetType === "MutualFund" ||
    h.assetType === "IndexFund"
  ) {
    return [POLICY_PATH.L1.EQUITY, POLICY_PATH.EQ.MGD, POLICY_PATH.EQ_MGD.EMF] as const;
  }

  // Fallback by sleeve
  if (sleeve === "equity") {
    return [POLICY_PATH.L1.EQUITY, POLICY_PATH.EQ.MGD, POLICY_PATH.EQ_MGD.EMF] as const;
  }

  return [POLICY_PATH.L1.UNLISTED, POLICY_PATH.UNL.PE_OTHER] as const;
}

export function policyPathKey(segments: readonly string[]): string {
  return segments.join("|");
}

export function labelForPolicySegment(id: string): string {
  return POLICY_LABELS[id] ?? id;
}

/** Top-level policy categories for dashboard filters (same order as overview). */
export const POLICY_CATEGORY_1_OPTIONS: { id: string; label: string }[] = (
  POLICY_SIBLING_ORDER[""] ?? []
).map((id) => ({ id, label: POLICY_LABELS[id] ?? id }));

/** Sub-categories under a given category 1 id (empty when “all”). */
export function getPolicyCategory2Options(category1: string): { id: string; label: string }[] {
  if (category1 === "all") return [];
  const ids = POLICY_SIBLING_ORDER[category1];
  if (!ids?.length) return [];
  return ids.map((id) => ({ id, label: POLICY_LABELS[id] ?? id }));
}
