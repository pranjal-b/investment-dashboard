/**
 * Which policy tree rows may be compared to the portfolio's primary equity index (e.g. Nifty CAGR).
 * Cash, FD, bank, liquid funds, and non-equity sleeves should not show that number without mislabelling.
 */

import { POLICY_PATH } from "@/lib/classification/investmentPolicyCategory";

const LIQUID_L2_SEGMENTS = new Set<string>([
  POLICY_PATH.LIQ.LIQUID,
  POLICY_PATH.LIQ.FD,
  POLICY_PATH.LIQ.BANK,
]);

/** Policy path is under equity L1 — equity index CAGR is a reasonable reference (not full risk match). */
export function isEquityPolicyPath(pathKey: string): boolean {
  const root = POLICY_PATH.L1.EQUITY;
  return pathKey === root || pathKey.startsWith(`${root}|`);
}

function isLiquidPolicyBranch(pathKey: string): boolean {
  const liq = POLICY_PATH.L1.LIQUID;
  if (pathKey === liq || pathKey.startsWith(`${liq}|`)) return true;
  return pathKey.split("|").some((seg) => LIQUID_L2_SEGMENTS.has(seg));
}

/** Per-row benchmark cell: value only for equity policy subtree; otherwise null + tooltip copy. */
export function getPolicyRowBenchmarkContext(
  pathKey: string,
  equityIndexCagrPct: number | null
): { displayPct: number | null; title?: string } {
  if (isEquityPolicyPath(pathKey)) {
    return { displayPct: equityIndexCagrPct };
  }
  if (isLiquidPolicyBranch(pathKey)) {
    return {
      displayPct: null,
      title:
        "Not vs equity index: compare liquid funds to a liquid fund index, FDs to deposit/savings rates, and bank balances to a hurdle or policy yield — not Nifty.",
    };
  }
  return {
    displayPct: null,
    title:
      "Primary KPI benchmark is an equity index. Debt, alternatives, and unlisted sleeves need their own benchmarks (not shown in this column).",
  };
}
