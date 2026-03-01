/**
 * Risk engine: concentration (Herfindahl, top 5), liquidity, lock-in %, expense drag.
 * For debt: credit breakdown (AAA/AA/below), modified duration, YTM.
 */

import type { Holding } from "@/lib/types";
import type { RiskMetrics, DebtRisk } from "./types";

export interface RiskEngineInput {
  holdings: Holding[];
}

function herfindahlIndex(weights: number[]): number {
  if (weights.length === 0) return 0;
  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum <= 0) return 0;
  return weights.reduce((s, w) => s + Math.pow(w / sum, 2), 0);
}

export function getRiskMetrics(input: RiskEngineInput): RiskMetrics {
  const { holdings } = input;
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (total === 0) {
    return {
      herfindahl: 0,
      top5ConcentrationPct: 0,
      pctOverconcentration: 0,
      pctLowLiquidity: 0,
      pctLockIn: 0,
      expenseDrag: 0,
    };
  }

  const weights = holdings.map((h) => h.currentValue);
  const herfindahl = herfindahlIndex(weights);
  const sorted = [...holdings].sort((a, b) => b.currentValue - a.currentValue);
  const top5Value = sorted.slice(0, 5).reduce((s, h) => s + h.currentValue, 0);
  const top5ConcentrationPct = (top5Value / total) * 100;
  const overconcentrationThreshold = 25; // single holding > 25%
  const overconcentrationValue = holdings
    .filter((h) => (h.currentValue / total) * 100 > overconcentrationThreshold)
    .reduce((s, h) => s + h.currentValue, 0);
  const pctOverconcentration = (overconcentrationValue / total) * 100;
  const lowLiquidityValue = holdings
    .filter((h) => (h.lockInPct ?? 0) >= 95)
    .reduce((s, h) => s + h.currentValue, 0);
  const pctLowLiquidity = (lowLiquidityValue / total) * 100;
  const lockInValue = holdings.reduce(
    (s, h) => s + ((h.lockInPct ?? 0) / 100) * h.currentValue,
    0
  );
  const pctLockIn = (lockInValue / total) * 100;
  const terWeighted = holdings.reduce(
    (s, h) => s + (h.ter ?? 0) * h.currentValue,
    0
  );
  const expenseDrag = total > 0 ? terWeighted / total : 0;

  return {
    herfindahl,
    top5ConcentrationPct,
    pctOverconcentration,
    pctLowLiquidity,
    pctLockIn,
    expenseDrag,
  };
}

export function getDebtRisk(input: RiskEngineInput): DebtRisk {
  const debtHoldings = input.holdings.filter(
    (h) => h.assetType === "DebtMF" || (h.assetType === "MutualFund" && h.creditRating)
  );
  const total = debtHoldings.reduce((s, h) => s + h.currentValue, 0);
  if (total === 0) {
    return {
      aaaPct: 0,
      aaPct: 0,
      belowAAPct: 0,
      modifiedDuration: 0,
      yieldToMaturity: 0,
    };
  }

  let aaa = 0,
    aa = 0,
    below = 0;
  let durationWeighted = 0,
    ytmWeighted = 0;
  for (const h of debtHoldings) {
    const rating = (h.creditRating ?? "").toUpperCase();
    const v = h.currentValue;
    if (rating.startsWith("AAA")) aaa += v;
    else if (rating.startsWith("AA")) aa += v;
    else below += v;
    durationWeighted += (h.modifiedDuration ?? 0) * v;
    ytmWeighted += (h.ytm ?? 0) * v;
  }
  return {
    aaaPct: (aaa / total) * 100,
    aaPct: (aa / total) * 100,
    belowAAPct: (below / total) * 100,
    modifiedDuration: total > 0 ? durationWeighted / total : 0,
    yieldToMaturity: total > 0 ? ytmWeighted / total : 0,
  };
}
