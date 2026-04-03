/**
 * Core data types for Investment Analytics Dashboard
 * Indian market context
 */

export type AssetType =
  | "Equity"
  | "MutualFund"
  | "AIF"
  | "PMS"
  | "ETF"
  | "DebtMF"
  | "IndexFund";

/** Five-sleeve policy taxonomy (macro allocation, filters, performance grouping) */
export type AllocationSleeve =
  | "liquid"
  | "debt"
  | "equity"
  | "alternatives"
  | "unlisted";

/** Drives sleeve via getAllocationSleeve before assetType fallback */
export type InstrumentSubtype =
  | "liquid_fund"
  | "arbitrage"
  | "credit_fund"
  | "bank_balance"
  | "fixed_deposit"
  | "tax_free_bond"
  | "venture_debt"
  | "debt_aif"
  | "short_maturity_bond"
  | "direct_equity"
  | "feeder_fund"
  | "equity_etf"
  | "equity_mf"
  | "pms"
  | "gold_etf"
  | "reit"
  | "invit"
  | "pe_direct_early"
  | "pe_growth"
  | "pe_fund_early_growth"
  | "pe_fund_late"
  | "angel_seed"
  | "early"
  | "growth"
  | "late_pre_ipo";

export type EquityMandate =
  | "Core"
  | "OldCore"
  | "CoreExit"
  | "InternationalFeeder";

export type BondCollateralType = "secured" | "unsecured" | "unknown";

export type BondSeniority =
  | "senior"
  | "at1"
  | "perpetual"
  | "subordinated_other"
  | "unspecified";

/** Shared nested line for liquid / arbitrage / credit fund folios */
export interface FundFolioLine {
  folioNumber?: string;
  investmentDate?: string;
  valuationAsOfDate?: string;
  scriptCode?: string;
  fundHouse?: string;
  advisorName?: string;
  depositoryParticipant?: string;
  averageCostPerUnit?: number;
  units?: number;
  irrRoughPct?: number | null;
  nav?: number | null;
  legalEntityId?: string;
  entityName?: string;
}

export interface BankBalanceLine {
  bankName?: string;
  entityName?: string;
  currentBalance?: number;
  balanceAsOfDate?: string;
}

/** Per-deposit fields when `instrumentSubtype` is `fixed_deposit` */
export interface FixedDepositLine {
  bankName?: string;
  /** ISO date; non-callable liquidity uses calendar days to maturity */
  maturityDate?: string;
  /** When absent, analytics treat the FD as non-callable */
  isCallable?: boolean;
  /** Annual coupon %; falls back to `Holding.ytm` when absent where relevant */
  couponAnnualPct?: number;
  /** Premature withdrawal penalty as annual % (calculator default when absent) */
  prematurePenaltyAnnualPct?: number;
  /** Override days-to-liquidity without further schema changes */
  effectiveLiquidityDays?: number;
  /** Optional liquidity-bucket override for callable / special cases */
  tenorBucket?: "d0_1" | "d1_3" | "d3_5" | "d5p";
}

export interface ShortMaturityBondLine extends FundFolioLine {
  maturityDate?: string;
  ytmAtInvestmentPct?: number | null;
}

export interface DirectEquityLine {
  portfolioLabel?: string;
  advisorName?: string;
  depositoryParticipant?: string;
  isPledged?: boolean;
  pledgeDetail?: string;
}

export interface PeDirectEarlyLine {
  costValue?: number;
  /** Partnership units / commitment share (SOA) */
  units?: number;
  scriptCode?: string;
  advisorName?: string;
  depositoryParticipant?: string;
  profitRs?: number;
  incomeRs?: number;
  capitalRs?: number;
  commissionRs?: number;
  remainingDrawdownCommitment?: number;
  soaAsOfDate?: string;
  statementOfAccountRef?: string;
}

export interface GoldEtfLine {
  folioNumber?: string;
  investmentDate?: string;
  valuationAsOfDate?: string;
  scriptCodes?: string[];
  scriptCode?: string;
  fundHouse?: string;
  advisorName?: string;
  depositoryParticipant?: string;
  averageCostPerUnit?: number;
  units?: number;
  irrRoughPct?: number | null;
  nav?: number | null;
}

export interface ReitInvitLine {
  folioNumber?: string;
  investmentDate?: string;
  valuationAsOfDate?: string;
  scriptCodes?: string[];
  scriptCode?: string;
  advisorName?: string;
  depositoryParticipant?: string;
  averageCostPerUnit?: number;
  units?: number;
  irrRoughPct?: number | null;
  nav?: number | null;
}

/** Bucket IDs for allocation (Direct Equity, Equity MF, Debt MF, Alt FOF, PMS, AIF, ETF, Index) */
export type AllocationBucketId =
  | "DirectEquity"
  | "EquityMF"
  | "DebtMF"
  | "AlternativeFOF"
  | "PMS"
  | "AIF"
  | "ETF"
  | "IndexFund";

export type MarketCap = "Large" | "Mid" | "Small";

export const SECTORS = [
  "Banking",
  "IT",
  "Pharma",
  "FMCG",
  "Auto",
  "CapitalGoods",
  "Energy",
  "Infra",
  "Consumption",
  "Chemicals",
] as const;

export type Sector = (typeof SECTORS)[number];

export const ASSET_TYPES: AssetType[] = [
  "Equity",
  "MutualFund",
  "AIF",
  "PMS",
  "ETF",
  "DebtMF",
  "IndexFund",
];

export const MARKET_CAPS: MarketCap[] = ["Large", "Mid", "Small"];

export interface Transaction {
  date: string; // ISO format
  amount: number; // negative = outflow, positive = inflow
  type: "buy" | "sell" | "dividend" | "nav";
  realizedGain?: number; // for sell transactions
}

export interface BenchmarkHistoryPoint {
  date: string;
  value: number;
}

/** Historical return or index level series (e.g. Nifty 50, peer) for benchmark XIRR */
export interface ReturnSeriesPoint {
  date: string;
  value: number; // index level or cumulative return factor
}

/** Per-scheme NAV history for period returns and rolling metrics */
export interface NavSeriesPoint {
  date: string;
  nav: number;
}

export interface Holding {
  id: string;
  assetName: string;
  assetType: AssetType;
  sector: Sector | string;
  marketCap: MarketCap;
  investedAmount: number;
  currentValue: number;
  targetAllocationPct: number;
  benchmark: string;
  sectorSplit?: Record<string, number>; // For MF/AIF - underlying sector weights
  transactions: Transaction[];
  historicalNav?: { date: string; value: number }[]; // For rolling XIRR
  benchmarkHistory?: BenchmarkHistoryPoint[];
  // Extended fields for HNI platform
  costValue?: number; // for FIFO/realized
  wealthManagerId?: string;
  ter?: number; // expense ratio
  lockInPct?: number;
  isDirect?: boolean;
  isIndexed?: boolean;
  isActive?: boolean;
  creditRating?: string; // debt: AAA, AA, etc.
  modifiedDuration?: number;
  ytm?: number;
  firstNavDate?: string;
  inceptionDate?: string;
  /** Portfolio bucket: Core, New, or Old */
  portfolioType?: "Core" | "New" | "Old";
  /** API override; wins in getAllocationSleeve */
  allocationSleeve?: AllocationSleeve;
  /** Drives sleeve before assetType; union or free string for API flexibility */
  instrumentSubtype?: InstrumentSubtype | string;
  unlistedStage?: string;
  equityMandate?: EquityMandate;
  bondCollateralType?: BondCollateralType;
  bondSeniority?: BondSeniority;
  fundFolio?: FundFolioLine;
  bankAccount?: BankBalanceLine;
  fixedDeposit?: FixedDepositLine;
  shortMaturityBond?: ShortMaturityBondLine;
  directEquity?: DirectEquityLine;
  feederFund?: FundFolioLine & { scriptCodes?: string[] };
  equityEtf?: FundFolioLine;
  equityMf?: FundFolioLine & { custodianBankName?: string; equitySchemeTag?: string };
  goldEtf?: GoldEtfLine;
  reitInvit?: ReitInvitLine;
  peDirectEarly?: PeDirectEarlyLine;
  peGrowth?: PeDirectEarlyLine & {
    distributionsCurrentValue?: number;
    /** Growth-stage NAV / unit (per SOA) */
    nav?: number | null;
    /** As-on date for NAV (SOA) */
    valuationAsOfDate?: string;
    soaReconciled?: boolean;
    /** Ops verification / checklist */
    reviewCheck?: boolean;
  };
}

export interface PortfolioMetrics {
  totalInvested: number;
  currentValue: number;
  absoluteGain: number;
  gainPercent: number;
  portfolioXIRR: number | null;
  allocationDeviation: number;
}

export interface AssetAllocation {
  assetType: AssetType;
  actualPct: number;
  targetPct: number;
  value: number;
  residualPct: number; // actual - target
}

export interface SectorExposure {
  sector: string;
  pct: number;
  value: number;
  byVehicle: Record<AssetType, number>;
}

export interface MarketCapExposure {
  marketCap: MarketCap;
  pct: number;
  value: number;
}

export type ValueMode = "absolute" | "percentage";

export type GainFilter = "all" | "gain" | "loss";

/** Reporting currency for display */
export type ReportingCurrency = "INR" | "USD";

/** Reporting units: scale for numeric display */
export type ReportingUnits =
  | "absolute"
  | "lac"
  | "cr"
  | "million"
  | "billion";

/** @deprecated Use ReportingUnits */
export type InrScale = "absolute" | "lac" | "cr";

/**
 * Scope: All | Equity | Debt | Alternatives | Cash (→ liquid sleeve) | Liquid | Unlisted
 * Legacy "cash" is treated as liquid in filters.
 */
export type ScopeAssetClass =
  | "all"
  | "equity"
  | "debt"
  | "alternatives"
  | "cash"
  | "liquid"
  | "unlisted";

/** Vehicle: All | Direct | MF | PMS | AIF | ETF | Index | FOF */
export type VehicleFilter =
  | "all"
  | "direct"
  | "mf"
  | "pms"
  | "aif"
  | "etf"
  | "index"
  | "fof";

/** Date range preset: FY | YTD | 3M | 6M | 1Y | Custom */
export type DateRangePreset = "fy" | "ytd" | "3m" | "6m" | "1y" | "custom";

export interface DashboardFilters {
  assetClasses: AssetType[];
  sectors: string[];
  marketCaps: MarketCap[];
  dateRange: [Date, Date] | null;
  valueMode: ValueMode;
  gainFilter: GainFilter;
  selectedSector: string | null; // For drilldown
  /** @deprecated Scope filter; replaced by policyCategory1/category2. Kept for persisted state. */
  scopeAssetClass?: ScopeAssetClass;
  /** @deprecated Vehicle filter; replaced by policy categories. */
  vehicleFilter?: VehicleFilter;
  /** Investment policy category 1 (liquid, debt, equity, …). `"all"` = no filter. */
  policyCategory1?: string;
  /** Sub-category under category 1. `"all"` = all sub-categories. Only applies when category 1 is set. */
  policyCategory2?: string;
  /** Date range preset; when "custom", dateRange is user-defined */
  dateRangePreset?: DateRangePreset;
  /** Multi-select: bucket ids (legacy) */
  coreBucketSelection?: string[];
  /** Multi-select: sub-category option values (legacy) */
  coreSubCategorySelection?: string[];
  /** FY for performance screen e.g. "2024-25" (Apr–Mar) */
  fy?: string;
  /** Net cash flow window in days (e.g. 30 for last month) */
  netCashFlowDays?: number;
  /** Reporting currency: INR | USD */
  reportingCurrency?: ReportingCurrency;
  /** Reporting units: Absolute | Lac | Cr | Million | Billion */
  reportingUnits?: ReportingUnits;
  /** @deprecated Use reportingUnits */
  inrScale?: InrScale;

  // FY Performance module (institutional chart)
  /** Selected FY for performance chart e.g. "2024-25" */
  performanceFY?: string;
  /** Frequency: mom | qoq | yoy */
  performanceFrequency?: "mom" | "qoq" | "yoy";
  /** Selected benchmark keys e.g. ["nifty50"]; at least one */
  performanceBenchmarks?: string[];
  /** Y-axis mode: value (₹) | return (%) | indexed (100) */
  performanceYAxisMode?: "value" | "return" | "indexed";
  /** FY Performance trend breakdown: policy category / sub-category / sector / market cap */
  performanceViewBy?: "category" | "subcategory" | "sector" | "marketCap";
  /** Performance Matrix data source: live (from holdings) or sample scenario */
  performanceMatrixScenario?: "live" | "moderate" | "conservative" | "bull";
  /**
   * Pitch/demo: when true, missing segment MoM % are filled with mild synthetic returns.
   * Set false to opt out of Auto demo fills for current/next FY. Omit = default behavior.
   */
  performancePitchSample?: boolean;
}
