/**
 * Debt-sleeve debt investment diagnostics: collateral, seniority, rating mix, templated risk narrative.
 * All rules live here; UI only renders series + copy.
 */

import type { Holding } from "@/lib/types";
import type { BondTreasuryDiagnostics, BondSplitSlice, NormalizedRatingKey } from "./types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";

export function normalizeCreditRating(raw: string | undefined | null): NormalizedRatingKey {
  if (raw == null || !String(raw).trim()) return "unrated";
  const t = String(raw).trim().toUpperCase();
  if (t === "NR" || t === "N/A" || t === "—" || t === "-") return "NR";
  if (/SOV|SOVEREIGN|GOVT|G-SEC|GOI|\bSOV\b/.test(t)) return "SOV";
  const c = t.replace(/\s+/g, "");
  if (c.includes("AAA")) return "AAA";
  if (c.includes("AA+") || /^AA\+$/.test(c)) return "AA+";
  if (c.includes("AA") && !c.includes("AA+")) return "AA";
  if (c.includes("A+") && !c.includes("AA")) return "A+";
  if (/^A$/.test(c) || (c.startsWith("A") && !c.includes("AA") && !c.includes("AB"))) return "A";
  if (c.includes("BBB+")) return "BBB+";
  if (c.includes("BBB")) return "BBB";
  if (c.includes("BB+")) return "BB+";
  if (c.includes("BB")) return "BB";
  return "other";
}

function pct(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

function slice(
  key: string,
  label: string,
  value: number,
  total: number
): BondSplitSlice {
  return { key, label, value, pct: pct(value, total) };
}

const SENIORITY_LABELS: Record<string, string> = {
  senior: "Senior",
  at1: "AT1",
  perpetual: "Perpetual",
  subordinated_other: "Subordinated (other)",
  unspecified: "Not specified",
};

const RATING_ORDER: NormalizedRatingKey[] = [
  "SOV",
  "AAA",
  "AA+",
  "AA",
  "A+",
  "A",
  "BBB+",
  "BBB",
  "BB+",
  "BB",
  "other",
  "NR",
  "unrated",
];

export function getBondTreasuryDiagnostics(input: {
  holdings: Holding[];
}): BondTreasuryDiagnostics {
  const debt = input.holdings.filter((h) => getAllocationSleeve(h) === "debt");
  const totalDebtValue = debt.reduce((s, h) => s + h.currentValue, 0);

  if (totalDebtValue <= 0) {
    return {
      totalDebtValue: 0,
      securedVsUnsecured: {
        secured: { value: 0, pct: 0 },
        unsecured: { value: 0, pct: 0 },
        unknownCollateral: { value: 0, pct: 0 },
      },
      unsecuredRatingDistribution: [],
      seniorityBreakdown: [],
      ratingDistribution: [],
      riskSignals: {
        unsecuredPct: 0,
        unspecifiedSeniorityPct: 0,
        unratedPct: 0,
        hasSubordinatedExposure: false,
        highUnsecuredShare: false,
        largeUnspecifiedSeniority: false,
        bullets: [],
      },
      overallAssessment:
        "No debt-sleeve holdings in the current filter. Add bond or credit-fund positions with ratings and seniority for debt investment diagnostics.",
    };
  }

  let secured = 0;
  let unsecured = 0;
  let unknownCollateral = 0;
  const seniorityMap = new Map<string, number>();
  const ratingMap = new Map<NormalizedRatingKey, number>();

  for (const h of debt) {
    const v = h.currentValue;
    const col = h.bondCollateralType;
    if (col === "secured") secured += v;
    else if (col === "unsecured") unsecured += v;
    else unknownCollateral += v;

    const sen = h.bondSeniority ?? "unspecified";
    seniorityMap.set(sen, (seniorityMap.get(sen) ?? 0) + v);

    const r = normalizeCreditRating(h.creditRating);
    ratingMap.set(r, (ratingMap.get(r) ?? 0) + v);
  }

  const unsecuredStrict = debt
    .filter((h) => h.bondCollateralType === "unsecured")
    .reduce((s, h) => s + h.currentValue, 0);

  const ratingWithinUnsecured: Map<NormalizedRatingKey, number> = new Map();
  for (const h of debt) {
    if (h.bondCollateralType !== "unsecured") continue;
    const r = normalizeCreditRating(h.creditRating);
    ratingWithinUnsecured.set(r, (ratingWithinUnsecured.get(r) ?? 0) + h.currentValue);
  }

  const unsecuredRatingDistribution: BondSplitSlice[] = [];
  if (unsecuredStrict > 0) {
    for (const rk of RATING_ORDER) {
      const val = ratingWithinUnsecured.get(rk) ?? 0;
      if (val > 0) {
        unsecuredRatingDistribution.push(
          slice(rk, rk === "SOV" ? "Sovereign" : rk, val, unsecuredStrict)
        );
      }
    }
    for (const [rk, val] of ratingWithinUnsecured) {
      if (!RATING_ORDER.includes(rk) && val > 0) {
        unsecuredRatingDistribution.push(slice(rk, rk, val, unsecuredStrict));
      }
    }
  }

  const seniorityBreakdown: BondSplitSlice[] = [];
  for (const [k, val] of seniorityMap) {
    if (val <= 0) continue;
    const label = SENIORITY_LABELS[k] ?? k;
    seniorityBreakdown.push(slice(k, label, val, totalDebtValue));
  }
  seniorityBreakdown.sort((a, b) => b.value - a.value);

  const ratingDistribution: BondSplitSlice[] = [];
  for (const rk of RATING_ORDER) {
    const val = ratingMap.get(rk) ?? 0;
    if (val > 0) {
      ratingDistribution.push(
        slice(rk, rk === "SOV" ? "Sovereign" : rk, val, totalDebtValue)
      );
    }
  }
  for (const [rk, val] of ratingMap) {
    if (!RATING_ORDER.includes(rk) && val > 0) {
      ratingDistribution.push(slice(rk, rk, val, totalDebtValue));
    }
  }

  const unsecuredPct = pct(unsecured, totalDebtValue);
  const unspecifiedSeniorityPct = pct(seniorityMap.get("unspecified") ?? 0, totalDebtValue);
  const unratedVal =
    (ratingMap.get("unrated") ?? 0) + (ratingMap.get("NR") ?? 0);
  const unratedPct = pct(unratedVal, totalDebtValue);
  const hasSubordinatedExposure =
    (seniorityMap.get("at1") ?? 0) +
      (seniorityMap.get("perpetual") ?? 0) +
      (seniorityMap.get("subordinated_other") ?? 0) >
    0;
  const highUnsecuredShare = unsecuredPct > 50;
  const largeUnspecifiedSeniority = unspecifiedSeniorityPct > 15;

  const bullets: string[] = [];
  if (highUnsecuredShare) {
    bullets.push(
      "Unsecured debt is a material share of the book — focus on loss given default even where average ratings are strong."
    );
  }
  if (hasSubordinatedExposure) {
    bullets.push(
      "AT1/perpetual or other subordinated exposure absorbs losses before senior paper — monitor capital and call schedules."
    );
  }
  if (largeUnspecifiedSeniority) {
    bullets.push(
      "A sizable slice of seniority is unspecified — improve security master / ops data before relying on structural analysis."
    );
  }
  if (unratedPct > 5) {
    bullets.push(
      "Unrated / NR positions are meaningful — treat as a data and mandate blind spot, not just low credit risk."
    );
  }
  if (unknownCollateral > 0 && pct(unknownCollateral, totalDebtValue) > 10) {
    bullets.push(
      "Collateral type is unknown for a double-digit share of MV — triage missing secured vs unsecured flags."
    );
  }
  if (bullets.length === 0) {
    bullets.push(
      "Book shows reasonable rating and seniority disclosure for the filtered universe; continue monitoring unsecured concentration vs policy."
    );
  }

  const overallAssessment =
    unsecuredPct > 60 && unratedPct < 5
      ? "Predominantly unsecured with rated disclosure — key risk is loss severity in stress, not rating migration alone."
      : largeUnspecifiedSeniority || unratedPct > 10
        ? "Data gaps (seniority or ratings) dominate — remediate security master before sizing structural conclusions."
        : "Fixed-income sleeve is serviceable for monitoring; align live data with collateral and seniority where unknown.";

  return {
    totalDebtValue,
    securedVsUnsecured: {
      secured: { value: secured, pct: pct(secured, totalDebtValue) },
      unsecured: { value: unsecured, pct: unsecuredPct },
      unknownCollateral: {
        value: unknownCollateral,
        pct: pct(unknownCollateral, totalDebtValue),
      },
    },
    unsecuredRatingDistribution,
    seniorityBreakdown,
    ratingDistribution,
    riskSignals: {
      unsecuredPct,
      unspecifiedSeniorityPct,
      unratedPct,
      hasSubordinatedExposure,
      highUnsecuredShare,
      largeUnspecifiedSeniority,
      bullets,
    },
    overallAssessment,
  };
}
