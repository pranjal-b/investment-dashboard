/**
 * GET /api/holdings
 *
 * Returns `{ holdings: Holding[] }` shaped like `src/data/mock-holdings.json`.
 * Optional fields (for five-sleeve taxonomy & debt investment diagnostics):
 * - `allocationSleeve`, `instrumentSubtype`, `unlistedStage`, `equityMandate`
 * - `bondCollateralType` ("secured" | "unsecured" | "unknown"), `bondSeniority`, `creditRating`
 * - Nested line objects: `fundFolio`, `bankAccount`, `fixedDeposit`, `shortMaturityBond`, `directEquity`,
 *   `feederFund`, `equityEtf`, `equityMf`, `goldEtf`, `reitInvit`, `peDirectEarly`, `peGrowth`
 *   (`fixedDeposit` when `instrumentSubtype` is `fixed_deposit`: optional `bankName`, ISO `maturityDate`,
 *   `isCallable` (omit/false = non-callable for analytics), `couponAnnualPct`, `prematurePenaltyAnnualPct`,
 *   `effectiveLiquidityDays`, `tenorBucket` `"d0_1"|"d1_3"|"d3_5"|"d5p"`. Coupon may fall back to top-level `ytm`.)
 *   (PE lines: `costValue`, `units`, `scriptCode`, `advisorName`, SOA fields; growth adds `nav`, `valuationAsOfDate`, `reviewCheck`)
 *
 * The API assigns rotating `portfolioType` (Core/New/Old) for demo data shape.
 */
import { NextResponse } from "next/server";
import { getDemoHoldings } from "@/lib/data/demoPortfolioHoldings";

export async function GET() {
  return NextResponse.json({ holdings: getDemoHoldings() });
}
