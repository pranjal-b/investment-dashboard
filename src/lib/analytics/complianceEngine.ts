/**
 * Compliance engine: policy rules (equity ≤70%, single stock ≤10%, etc.).
 * Actual vs threshold, status (green/amber/red).
 */

import type { Holding } from "@/lib/types";
import type { PolicyCheck, PolicyStatus } from "./types";

export interface ComplianceEngineInput {
  holdings: Holding[];
  /** Optional policy overrides: e.g. { equityCap: 70, singleStockCap: 10 } */
  policies?: {
    equityCapPct?: number;
    singleStockCapPct?: number;
    debtFloorPct?: number;
    alternativeCapPct?: number;
  };
}

const DEFAULT_POLICIES = {
  equityCapPct: 70,
  singleStockCapPct: 10,
  debtFloorPct: 20,
  alternativeCapPct: 30,
};

function statusFromDeviation(actual: number, threshold: number, isCap: boolean): PolicyStatus {
  const diff = isCap ? threshold - actual : actual - threshold;
  if (diff >= 0) return "green";
  if (Math.abs(diff) <= (isCap ? 5 : 5)) return "amber";
  return "red";
}

export function getPolicyChecks(input: ComplianceEngineInput): PolicyCheck[] {
  const { holdings, policies = {} } = input;
  const opts = { ...DEFAULT_POLICIES, ...policies };
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  const checks: PolicyCheck[] = [];

  if (total === 0) return checks;

  const equityValue = holdings
    .filter((h) => ["Equity", "ETF", "IndexFund", "MutualFund"].includes(h.assetType))
    .reduce((s, h) => s + h.currentValue, 0);
  const equityPct = (equityValue / total) * 100;
  const equityCap = opts.equityCapPct ?? 70;
  checks.push({
    policy: "Equity cap",
    threshold: `≤ ${equityCap}%`,
    actual: equityPct,
    actualLabel: `${equityPct.toFixed(1)}%`,
    status: statusFromDeviation(equityPct, equityCap, true),
  });

  const maxSingle = Math.max(...holdings.map((h) => h.currentValue));
  const singleStockPct = (maxSingle / total) * 100;
  const singleCap = opts.singleStockCapPct ?? 10;
  checks.push({
    policy: "Single holding cap",
    threshold: `≤ ${singleCap}%`,
    actual: singleStockPct,
    actualLabel: `${singleStockPct.toFixed(1)}%`,
    status: statusFromDeviation(singleStockPct, singleCap, true),
  });

  const debtValue = holdings
    .filter((h) => h.assetType === "DebtMF")
    .reduce((s, h) => s + h.currentValue, 0);
  const debtPct = (debtValue / total) * 100;
  const debtFloor = opts.debtFloorPct ?? 20;
  checks.push({
    policy: "Debt floor",
    threshold: `≥ ${debtFloor}%`,
    actual: debtPct,
    actualLabel: `${debtPct.toFixed(1)}%`,
    status: debtPct >= debtFloor ? "green" : debtPct >= debtFloor - 5 ? "amber" : "red",
  });

  const altValue = holdings
    .filter((h) => h.assetType === "AIF")
    .reduce((s, h) => s + h.currentValue, 0);
  const altPct = (altValue / total) * 100;
  const altCap = opts.alternativeCapPct ?? 30;
  checks.push({
    policy: "Alternatives cap",
    threshold: `≤ ${altCap}%`,
    actual: altPct,
    actualLabel: `${altPct.toFixed(1)}%`,
    status: statusFromDeviation(altPct, altCap, true),
  });

  return checks;
}
