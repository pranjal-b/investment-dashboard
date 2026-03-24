/**
 * GET /api/holdings
 *
 * Returns `{ holdings: Holding[] }` shaped like `src/data/mock-holdings.json`.
 * Optional fields (for five-sleeve taxonomy & bond treasury):
 * - `allocationSleeve`, `instrumentSubtype`, `unlistedStage`, `equityMandate`
 * - `bondCollateralType` ("secured" | "unsecured" | "unknown"), `bondSeniority`, `creditRating`
 * - Nested line objects: `fundFolio`, `bankAccount`, `shortMaturityBond`, `directEquity`,
 *   `feederFund`, `equityEtf`, `equityMf`, `goldEtf`, `reitInvit`, `peDirectEarly`, `peGrowth`
 *
 * The API assigns rotating `portfolioType` (Core/New/Old) for demo filters.
 */
import { NextResponse } from "next/server";
import holdingsData from "@/data/mock-holdings.json";
import type { Holding } from "@/lib/types";

const PORTFOLIO_TYPES = ["Core", "New", "Old"] as const;

export async function GET() {
  const raw = holdingsData.holdings as Holding[];
  const total = raw.length;
  const holdings = raw.map((h, i) => {
    const bucket = Math.floor((i / total) * 3) % 3;
    return { ...h, portfolioType: PORTFOLIO_TYPES[bucket] as "Core" | "New" | "Old" };
  });
  return NextResponse.json({ holdings });
}
