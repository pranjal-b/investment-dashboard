/**
 * Liquid & equivalents: classification, summary, FD stats, liquidity buckets, returns split.
 * Uses full-book holdings + reporting as-of date from filters.dateRange?.[1].
 */

import type { Holding } from "@/lib/types";
import type { HoldingPeriodReturn } from "./returnEngine";

import { sumIdleBankBalances } from "./liquidityEngine";

export type LEBucketKey = "d0_1" | "d1_3" | "d3_5" | "d5p";
/** Alias matching roadmap naming (`LiquidityBucketId` === `LEBucketKey`). */
export type LiquidityBucketId = LEBucketKey;

export type LESegment = "liquid" | "fd" | "bank";

const LE_SUBTYPES = new Set<string>([
  "liquid_fund",
  "arbitrage",
  "fixed_deposit",
  "bank_balance",
]);

export function isLiquidEquivalentHolding(h: Holding): boolean {
  const st = h.instrumentSubtype;
  return typeof st === "string" && LE_SUBTYPES.has(st);
}

export function filterLiquidEquivalentHoldings(holdings: Holding[]): Holding[] {
  return holdings.filter(isLiquidEquivalentHolding);
}

/** @see filterLiquidEquivalentHoldings */
export const getLiquidEquivalentHoldings = filterLiquidEquivalentHoldings;

/** Bank label for FD grouping: `fixedDeposit.bankName`, else prefix before em/en dash in `assetName`, else `Unknown`. */
export function getBankNameForFd(h: Holding): string {
  const n = h.fixedDeposit?.bankName?.trim();
  if (n) return n;
  const m = /^(.+?)\s*[–-]\s/.exec(h.assetName.trim());
  if (m?.[1]) return m[1]!.trim();
  return "Unknown";
}

function segmentForHolding(h: Holding): LESegment | null {
  const st = h.instrumentSubtype;
  if (st === "liquid_fund" || st === "arbitrage") return "liquid";
  if (st === "fixed_deposit") return "fd";
  if (st === "bank_balance") return "bank";
  return null;
}

function asOfDate(dateRange: [Date, Date] | null): Date {
  return dateRange?.[1] ?? new Date();
}

/** Calendar whole days from as-of (start of day) to maturity (inclusive-style). */
function calendarDaysToMaturity(asOf: Date, maturityIso: string): number {
  const a = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const m = new Date(maturityIso);
  const b = new Date(m.getFullYear(), m.getMonth(), m.getDate());
  return Math.ceil((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function bucketFromDays(d: number): LEBucketKey {
  if (d <= 1) return "d0_1";
  if (d <= 3) return "d1_3";
  if (d <= 5) return "d3_5";
  return "d5p";
}

/**
 * Days-to-liquidity bucket for L&E holdings only (null if not L&E).
 */
export function getHoldingLiquidityBucket(h: Holding, dateRange: [Date, Date] | null): LEBucketKey | null {
  if (!isLiquidEquivalentHolding(h)) return null;
  const asOf = asOfDate(dateRange);
  const st = h.instrumentSubtype;

  if (st === "bank_balance") return "d0_1";
  if (st === "liquid_fund" || st === "arbitrage") return "d1_3";

  if (st === "fixed_deposit") {
    const fd = h.fixedDeposit;
    if (fd?.effectiveLiquidityDays != null && Number.isFinite(fd.effectiveLiquidityDays)) {
      return bucketFromDays(Math.max(0, fd.effectiveLiquidityDays));
    }
    if (fd?.tenorBucket) return fd.tenorBucket;
    if (fd?.isCallable === true) return "d1_3";
    const mat = fd?.maturityDate;
    if (!mat) return "d5p";
    const d = calendarDaysToMaturity(asOf, mat);
    return bucketFromDays(d);
  }

  return null;
}

export interface LiquidEquivalentsSummaryRow {
  segment: LESegment;
  label: string;
  marketValueINR: number;
  pctOfTotal: number | null;
  count: number;
}

export interface LiquidEquivalentsSummary {
  rows: LiquidEquivalentsSummaryRow[];
  totalMarketValueINR: number;
}

export function getLiquidEquivalentsSummary(holdings: Holding[]): LiquidEquivalentsSummary {
  const le = filterLiquidEquivalentHoldings(holdings);
  let liquid = 0;
  let fd = 0;
  let bank = 0;
  let nL = 0;
  let nF = 0;
  let nB = 0;
  for (const h of le) {
    const seg = segmentForHolding(h);
    const v = h.currentValue;
    if (seg === "liquid") {
      liquid += v;
      nL += 1;
    } else if (seg === "fd") {
      fd += v;
      nF += 1;
    } else if (seg === "bank") {
      bank += v;
      nB += 1;
    }
  }
  const total = liquid + fd + bank;
  const pct = (x: number) => (total > 0 ? (x / total) * 100 : null);
  const rows: LiquidEquivalentsSummaryRow[] = [
    { segment: "liquid", label: "Liquid", marketValueINR: liquid, pctOfTotal: pct(liquid), count: nL },
    { segment: "fd", label: "FD", marketValueINR: fd, pctOfTotal: pct(fd), count: nF },
    { segment: "bank", label: "Bank", marketValueINR: bank, pctOfTotal: pct(bank), count: nB },
  ];
  return { rows, totalMarketValueINR: total };
}

export interface FDAllocationSlice {
  bankName: string;
  marketValueINR: number;
  pctOfFdTotal: number | null;
}

export function getFDAllocationBreakdown(holdings: Holding[]): FDAllocationSlice[] {
  const fds = holdings.filter((h) => h.instrumentSubtype === "fixed_deposit");
  const byName = new Map<string, number>();
  for (const h of fds) {
    const name = getBankNameForFd(h);
    byName.set(name, (byName.get(name) ?? 0) + h.currentValue);
  }
  const total = Array.from(byName.values()).reduce((s, v) => s + v, 0);
  const slices: FDAllocationSlice[] = Array.from(byName.entries()).map(([bankName, marketValueINR]) => ({
    bankName,
    marketValueINR,
    pctOfFdTotal: total > 0 ? (marketValueINR / total) * 100 : null,
  }));
  slices.sort((a, b) => b.marketValueINR - a.marketValueINR);
  return slices;
}

export interface FDCallableSplit {
  callable: { marketValueINR: number; count: number };
  nonCallable: { marketValueINR: number; count: number };
}

export function getFDCallableSplit(holdings: Holding[]): FDCallableSplit {
  const fds = holdings.filter((h) => h.instrumentSubtype === "fixed_deposit");
  let cMv = 0;
  let ncMv = 0;
  let cN = 0;
  let ncN = 0;
  for (const h of fds) {
    const isCallable = h.fixedDeposit?.isCallable === true;
    if (isCallable) {
      cMv += h.currentValue;
      cN += 1;
    } else {
      ncMv += h.currentValue;
      ncN += 1;
    }
  }
  return {
    callable: { marketValueINR: cMv, count: cN },
    nonCallable: { marketValueINR: ncMv, count: ncN },
  };
}

export interface LEReturnsSegmentRow {
  segment: LESegment;
  label: string;
  marketValueINR: number;
  valueWeightedXirrPct: number | null;
  unrealizedPLNIR: number;
}

function costBasis(h: Holding): number {
  return h.costValue ?? h.investedAmount;
}

export function getLEReturnsSplit(
  holdings: Holding[],
  holdingReturns: HoldingPeriodReturn[]
): LEReturnsSegmentRow[] {
  const le = filterLiquidEquivalentHoldings(holdings);
  const xirrById = new Map(holdingReturns.map((r) => [r.holdingId, r.xirrPct]));

  type Acc = { mv: number; wXirr: number; mvWithXirr: number; pl: number };
  const acc: Record<LESegment, Acc> = {
    liquid: { mv: 0, wXirr: 0, mvWithXirr: 0, pl: 0 },
    fd: { mv: 0, wXirr: 0, mvWithXirr: 0, pl: 0 },
    bank: { mv: 0, wXirr: 0, mvWithXirr: 0, pl: 0 },
  };

  for (const h of le) {
    const seg = segmentForHolding(h);
    if (!seg) continue;
    const mv = h.currentValue;
    const x = xirrById.get(h.id);
    acc[seg].mv += mv;
    if (x != null && Number.isFinite(x)) {
      acc[seg].wXirr += mv * x;
      acc[seg].mvWithXirr += mv;
    }
    acc[seg].pl += mv - costBasis(h);
  }

  const labels: Record<LESegment, string> = {
    liquid: "Liquid",
    fd: "FD",
    bank: "Bank",
  };

  return (["liquid", "fd", "bank"] as const).map((segment) => {
    const a = acc[segment];
    const valueWeightedXirrPct =
      a.mvWithXirr > 0 ? a.wXirr / a.mvWithXirr : null;
    return {
      segment,
      label: labels[segment],
      marketValueINR: a.mv,
      valueWeightedXirrPct,
      unrealizedPLNIR: a.pl,
    };
  });
}

export type LiquidityBucketActuals = Record<LEBucketKey, number>;

export function getLiquidityBucketActuals(
  holdings: Holding[],
  dateRange: [Date, Date] | null
): LiquidityBucketActuals {
  const empty: LiquidityBucketActuals = { d0_1: 0, d1_3: 0, d3_5: 0, d5p: 0 };
  const le = filterLiquidEquivalentHoldings(holdings);
  const out = { ...empty };
  for (const h of le) {
    const bucket = getHoldingLiquidityBucket(h, dateRange);
    if (bucket) out[bucket] += h.currentValue;
  }
  return out;
}

export interface IdealLiquidityBucketINR {
  d0_1: number;
  d1_3: number;
  d3_5: number;
  d5p: number;
}

/** Default ideal targets (zero until the user sets bucket goals). */
export const DEFAULT_IDEAL_LIQUIDITY_BUCKETS: IdealLiquidityBucketINR = {
  d0_1: 0,
  d1_3: 0,
  d3_5: 0,
  d5p: 0,
};

export function normalizeIdealBuckets(
  partial: Partial<Record<keyof IdealLiquidityBucketINR, unknown>>
): IdealLiquidityBucketINR {
  const n = (k: keyof IdealLiquidityBucketINR) => {
    const v = partial[k];
    const num = Number(v);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };
  return {
    d0_1: n("d0_1"),
    d1_3: n("d1_3"),
    d3_5: n("d3_5"),
    d5p: n("d5p"),
  };
}

/** Reporting as-of from dashboard filters (end of range). */
export function asOfDateFromFilters(dateRange: [Date, Date] | null): Date {
  return dateRange?.[1] ?? new Date();
}

/** Alias for L&E subset (same as `filterLiquidEquivalentHoldings`). */
export function getLEHoldings(holdings: Holding[]): Holding[] {
  return filterLiquidEquivalentHoldings(holdings);
}

export interface LiquidityBucketGapRow {
  bucket: LEBucketKey;
  label: string;
  actualINR: number;
  idealINR: number;
  gapINR: number;
}

export function getLiquidityBucketGaps(
  actuals: LiquidityBucketActuals,
  ideal: IdealLiquidityBucketINR
): LiquidityBucketGapRow[] {
  const labels: Record<LEBucketKey, string> = {
    d0_1: "≤1d",
    d1_3: "1–3d",
    d3_5: "3–5d",
    d5p: ">5d",
  };
  return (["d0_1", "d1_3", "d3_5", "d5p"] as const).map((bucket) => ({
    bucket,
    label: labels[bucket],
    actualINR: actuals[bucket],
    idealINR: ideal[bucket],
    gapINR: actuals[bucket] - ideal[bucket],
  }));
}

export interface FDLiquidationSimResult {
  requestedINR: number;
  appliedINR: number;
  penaltyINR: number;
  postLiquidationBankINR: number;
  remainingFDMVINR: number;
  indicativeLostAnnualCouponINR: number;
}

/**
 * Conservative shorthand: penalty ≈ requested × (penaltyAnnualPct / 100).
 * Coupon loss ≈ requested × (couponAnnualPct / 100) for the liquidated slice.
 */
export function simulateFDLiquidation(input: {
  totalFDMVINR: number;
  currentIdleBankINR: number;
  amountINR: number;
  couponAnnualPct: number;
  penaltyAnnualPct: number;
}): FDLiquidationSimResult {
  const cap = Math.max(0, input.totalFDMVINR);
  const req = Math.max(0, input.amountINR);
  const applied = Math.min(req, cap);
  const penaltyINR = applied * (Math.max(0, input.penaltyAnnualPct) / 100);
  const postLiquidationBankINR = Math.max(0, input.currentIdleBankINR) + applied - penaltyINR;
  const remainingFDMVINR = cap - applied;
  const indicativeLostAnnualCouponINR = applied * (Math.max(0, input.couponAnnualPct) / 100);
  return {
    requestedINR: req,
    appliedINR: applied,
    penaltyINR,
    postLiquidationBankINR,
    remainingFDMVINR,
    indicativeLostAnnualCouponINR,
  };
}

const LIQUIDATION_FORMULA_DESCRIPTION =
  "Post bank cash = idle bank balances + applied FD amount − (applied amount × penalty% ÷ 100). " +
  "Indicative lost annual coupon = applied amount × (blended coupon% ÷ 100). " +
  "Illustrative only; use actual bank terms for breakage/fees.";

function mvWeightedFdCouponAnnualPct(fdHoldings: Holding[]): number {
  let sumW = 0;
  let sumWX = 0;
  for (const h of fdHoldings) {
    const w = h.currentValue;
    if (!(w > 0)) continue;
    const x = h.fixedDeposit?.couponAnnualPct ?? h.ytm ?? 0;
    sumW += w;
    sumWX += w * x;
  }
  return sumW > 0 ? sumWX / sumW : 0;
}

export interface FDLiquidationFromHoldingsInput {
  holdings: Holding[];
  /** Applied first when set. Clamped to total FD MV. */
  amountINR?: number;
  /** Used when `amountINR` is omitted: fraction of total FD MV (0–100). */
  amountPctOfTotalFD?: number;
  penaltyAnnualPct: number;
  /** Optional; otherwise MV-weighted from FD `couponAnnualPct` / `ytm` */
  blendedCouponAnnualPct?: number;
}

export interface FDLiquidationFromHoldingsResult extends FDLiquidationSimResult {
  idleBankBeforeINR: number;
  totalFDMVBeforeINR: number;
  blendedCouponAnnualPctApplied: number;
  formulaDescription: string;
}

/**
 * Derives idle bank (all `bank_balance` MV), FD book, and coupon blend from holdings, then runs {@link simulateFDLiquidation}.
 */
export function simulateFDLiquidationFromHoldings(
  input: FDLiquidationFromHoldingsInput
): FDLiquidationFromHoldingsResult {
  const fdHoldings = input.holdings.filter((h) => h.instrumentSubtype === "fixed_deposit");
  const totalFDMVBeforeINR = fdHoldings.reduce((s, h) => s + h.currentValue, 0);
  const { idleINR: idleBankBeforeINR } = sumIdleBankBalances(input.holdings);

  let requested = 0;
  if (input.amountINR != null && Number.isFinite(input.amountINR)) {
    requested = Math.max(0, input.amountINR);
  } else if (input.amountPctOfTotalFD != null && Number.isFinite(input.amountPctOfTotalFD)) {
    const pct = Math.max(0, Math.min(100, input.amountPctOfTotalFD));
    requested = totalFDMVBeforeINR * (pct / 100);
  }

  const blendedCouponAnnualPctApplied =
    input.blendedCouponAnnualPct != null && Number.isFinite(input.blendedCouponAnnualPct)
      ? input.blendedCouponAnnualPct
      : mvWeightedFdCouponAnnualPct(fdHoldings);

  const core = simulateFDLiquidation({
    totalFDMVINR: totalFDMVBeforeINR,
    currentIdleBankINR: idleBankBeforeINR,
    amountINR: requested,
    couponAnnualPct: blendedCouponAnnualPctApplied,
    penaltyAnnualPct: input.penaltyAnnualPct,
  });

  return {
    ...core,
    idleBankBeforeINR,
    totalFDMVBeforeINR,
    blendedCouponAnnualPctApplied,
    formulaDescription: LIQUIDATION_FORMULA_DESCRIPTION,
  };
}

export interface LiquidEquivalentsAnalyticsBase {
  summary: LiquidEquivalentsSummary;
  fdAllocationByBank: FDAllocationSlice[];
  fdCallableSplit: FDCallableSplit;
  liquidityBucketActuals: LiquidityBucketActuals;
  liquidityBucketGaps: LiquidityBucketGapRow[];
  idealBucketINR: IdealLiquidityBucketINR;
}

export interface LiquidEquivalentsAnalytics extends LiquidEquivalentsAnalyticsBase {
  leReturnsSplit: LEReturnsSegmentRow[];
}

export function buildLiquidEquivalentsAnalyticsBase(input: {
  holdings: Holding[];
  dateRange: [Date, Date] | null;
  idealBucketINR: IdealLiquidityBucketINR;
}): LiquidEquivalentsAnalyticsBase {
  const { holdings, dateRange, idealBucketINR } = input;
  const summary = getLiquidEquivalentsSummary(holdings);
  const fdAllocationByBank = getFDAllocationBreakdown(holdings);
  const fdCallableSplit = getFDCallableSplit(holdings);
  const liquidityBucketActuals = getLiquidityBucketActuals(holdings, dateRange);
  const liquidityBucketGaps = getLiquidityBucketGaps(liquidityBucketActuals, idealBucketINR);
  return {
    summary,
    fdAllocationByBank,
    fdCallableSplit,
    liquidityBucketActuals,
    liquidityBucketGaps,
    idealBucketINR,
  };
}
