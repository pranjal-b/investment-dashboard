/**
 * Portfolio and asset-level metrics calculation
 */

import type { Holding, PortfolioMetrics } from "@/lib/types";
import { computeXIRR } from "./xirr";
import { aggregateCashflows } from "./xirr";
import { computeResidualAllocation } from "./exposure";

/**
 * Compute portfolio-level metrics from filtered holdings
 */
export function computePortfolioMetrics(
  holdings: Holding[],
  dateRange?: [Date, Date] | null
): PortfolioMetrics {
  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  const currentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const absoluteGain = currentValue - totalInvested;
  const gainPercent =
    totalInvested > 0 ? (absoluteGain / totalInvested) * 100 : 0;

  const cashflows = aggregateCashflows(holdings).map((c) => ({
    date: c.date,
    amount: c.amount,
    type: "nav" as const,
  }));
  const portfolioXIRR = computeXIRR(cashflows, dateRange);
  const allocationDeviation = computeAllocationDeviation(holdings);

  return {
    totalInvested,
    currentValue,
    absoluteGain,
    gainPercent,
    portfolioXIRR: portfolioXIRR != null ? portfolioXIRR * 100 : null,
    allocationDeviation,
  };
}

/**
 * Allocation deviation = sum of |actual - target| across asset classes
 */
function computeAllocationDeviation(holdings: Holding[]): number {
  const residuals = computeResidualAllocation(holdings);
  return residuals.reduce((s, r) => s + Math.abs(r.residualPct), 0);
}

/**
 * Asset-level metrics for a single holding
 */
export function computeAssetMetrics(
  holding: Holding,
  dateRange?: [Date, Date] | null
) {
  const gain = holding.currentValue - holding.investedAmount;
  const gainPercent =
    holding.investedAmount > 0
      ? (gain / holding.investedAmount) * 100
      : 0;
  const xirrResult = computeXIRR(holding.transactions, dateRange);
  const xirrPct = xirrResult != null ? xirrResult * 100 : null;
  return { gain, gainPercent, xirrPct };
}
