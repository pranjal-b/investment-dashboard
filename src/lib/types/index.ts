/**
 * Core data types for Investment Analytics Dashboard
 * Indian market context
 */

export type AssetType = "Equity" | "MutualFund" | "AIF" | "PMS" | "ETF";

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
];

export const MARKET_CAPS: MarketCap[] = ["Large", "Mid", "Small"];

export interface Transaction {
  date: string; // ISO format
  amount: number; // negative = outflow, positive = inflow
  type: "buy" | "sell" | "dividend" | "nav";
}

export interface BenchmarkHistoryPoint {
  date: string;
  value: number;
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

export interface DashboardFilters {
  assetClasses: AssetType[];
  sectors: string[];
  marketCaps: MarketCap[];
  dateRange: [Date, Date] | null;
  valueMode: ValueMode;
  gainFilter: GainFilter;
  selectedSector: string | null; // For drilldown
}
