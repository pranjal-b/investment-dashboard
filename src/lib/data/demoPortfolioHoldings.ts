import holdingsData from "@/data/mock-holdings.json";
import type { Holding } from "@/lib/types";

const PORTFOLIO_TYPES = ["Core", "New", "Old"] as const;

export function withDemoPortfolioTypes(holdings: Holding[]): Holding[] {
  const total = holdings.length;
  if (total === 0) return holdings;
  return holdings.map((h, i) => {
    const bucket = Math.floor((i / total) * 3) % 3;
    return { ...h, portfolioType: PORTFOLIO_TYPES[bucket] };
  });
}

/** Demo book with rotating Core/New/Old — same shape as GET /api/holdings. */
export function getDemoHoldings(): Holding[] {
  return withDemoPortfolioTypes(holdingsData.holdings as Holding[]);
}
