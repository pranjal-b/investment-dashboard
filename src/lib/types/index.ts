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

/** Display scale for INR: full number (Indian grouping), Lakh, or Crore */
export type InrScale = "absolute" | "lac" | "cr";

/** Scope: Asset class bucket — All | Equity | Debt | Alternatives | Cash */
export type ScopeAssetClass = "all" | "equity" | "debt" | "alternatives" | "cash";

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
  /** INR display: absolute (full number), lac (Lakh), cr (Crore) */
  inrScale?: InrScale;
}
