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
  /** Portfolio bucket: Core, New, or Old (for portfolio filter) */
  portfolioType?: "Core" | "New" | "Old";
  /** API override; wins in getAllocationSleeve */
  allocationSleeve?: AllocationSleeve;
  instrumentSubtype?: InstrumentSubtype;
  unlistedStage?: string;
  equityMandate?: EquityMandate;
  bondCollateralType?: BondCollateralType;
  bondSeniority?: BondSeniority;
  fundFolio?: FundFolioLine;
  bankAccount?: BankBalanceLine;
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
    soaReconciled?: boolean;
  };
}

/** Portfolio filter: Core, Satellite (= New), Legacy (= Old) */
export type PortfolioFilter = "all" | "Core" | "New" | "Old";

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
  /** Scope: All | Equity | Debt | Alternatives | Cash */
  scopeAssetClass?: ScopeAssetClass;
  /** Vehicle: All | Direct | MF | PMS | AIF | ETF | Index | FOF */
  vehicleFilter?: VehicleFilter;
  /** Date range preset; when "custom", dateRange is user-defined */
  dateRangePreset?: DateRangePreset;
  /** Multi-select: bucket ids (legacy) */
  coreBucketSelection?: string[];
  /** Multi-select: sub-category option values (legacy) */
  coreSubCategorySelection?: string[];
  /** Portfolio: All | Core | Satellite (New) | Legacy (Old) */
  portfolioFilter?: PortfolioFilter;
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
  /** FY Performance view: portfolio (aggregate) | assetClass | vehicle */
  performanceViewBy?: "portfolio" | "assetClass" | "vehicle";
  /** Performance Matrix data source: live (from holdings) or sample scenario */
  performanceMatrixScenario?: "live" | "moderate" | "conservative" | "bull";
}
