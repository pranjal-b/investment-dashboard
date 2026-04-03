/**
 * Analytics engine layer – single entry for all engine outputs.
 * UI consumes only these APIs; no financial logic in components.
 */

export { getPortfolioSnapshot } from "./portfolioEngine";
export type { PortfolioEngineInput } from "./portfolioEngine";

export { getAllocationBuckets } from "./allocationEngine";
export type { AllocationEngineInput } from "./allocationEngine";

export {
  getMacroAllocation,
  getRebalanceInsight,
  getAllocationHealthScore,
  getTopHoldingsByDeviation,
  getAllocationSleeveBreakdown,
} from "./allocationAnalytics";

export type {
  SleeveChildBucketRow,
  SleeveAllocationBreakdownRow,
  SleeveBreakdownInput,
} from "./allocationAnalytics";

export { getPolicyAllocationTree } from "./policyAllocationTree";
export type { PolicyAllocationTreeNode, PolicyAllocationTreeInput } from "./policyAllocationTree";

export {
  isEquityPolicyPath,
  getPolicyRowBenchmarkContext,
} from "./policyBenchmarkScope";

export { getReturnMetrics, getPeriodReturns, getHoldingPeriodReturns, getPerformanceMatrixTree, PERFORMANCE_MATRIX_PERIODS } from "./returnEngine";
export type { ReturnEngineInput, HoldingPeriodReturn } from "./returnEngine";

export { getRiskMetrics, getDebtRisk } from "./riskEngine";
export type { RiskEngineInput } from "./riskEngine";

export { getPolicyChecks } from "./complianceEngine";
export type { ComplianceEngineInput } from "./complianceEngine";

export {
  getFYPerformance,
  getFYPerformanceByCategory,
  getFYPerformanceByVehicle,
  getFYPerformanceByPolicyCategory,
  getFYPerformanceByPolicySubcategory,
  getFYPerformanceBySector,
  getFYPerformanceByMarketCap,
  getRollingPerformance,
} from "./performanceEngine";
export type { PerformanceEngineInput } from "./performanceEngine";

export { getBondTreasuryDiagnostics, normalizeCreditRating } from "./bondCreditEngine";

export {
  splitUnrealizedGainStLt,
  getEarliestAcquisitionDate,
  longTermMonthsThreshold,
  holdingUnrealizedIsLongTerm,
} from "./unrealizedStLt";

export { sumIdleBankBalances } from "./liquidityEngine";

export {
  isLiquidEquivalentHolding,
  filterLiquidEquivalentHoldings,
  getLiquidEquivalentHoldings,
  getBankNameForFd,
  getHoldingLiquidityBucket,
  getLiquidEquivalentsSummary,
  getFDAllocationBreakdown,
  getFDCallableSplit,
  getLEReturnsSplit,
  getLiquidityBucketActuals,
  getLiquidityBucketGaps,
  simulateFDLiquidation,
  simulateFDLiquidationFromHoldings,
  buildLiquidEquivalentsAnalyticsBase,
  normalizeIdealBuckets,
  DEFAULT_IDEAL_LIQUIDITY_BUCKETS,
  getLEHoldings,
  asOfDateFromFilters,
} from "./liquidEquivalentsEngine";
export type {
  LEBucketKey,
  LiquidityBucketId,
  LESegment,
  LiquidEquivalentsSummary,
  LiquidEquivalentsSummaryRow,
  FDAllocationSlice,
  FDCallableSplit,
  LEReturnsSegmentRow,
  LiquidityBucketActuals,
  IdealLiquidityBucketINR,
  LiquidityBucketGapRow,
  FDLiquidationSimResult,
  FDLiquidationFromHoldingsInput,
  FDLiquidationFromHoldingsResult,
  LiquidEquivalentsAnalyticsBase,
  LiquidEquivalentsAnalytics,
} from "./liquidEquivalentsEngine";

export type {
  PortfolioSnapshot,
  AllocationBucket,
  MacroClassId,
  MacroAllocationRow,
  RebalanceInsight,
  TopHoldingAllocationRow,
  ReturnMetrics,
  PeriodReturn,
  RiskMetrics,
  DebtRisk,
  PolicyCheck,
  PolicyStatus,
  FYPerformance,
  FYPerformanceByCategory,
  FYPerformanceByVehicle,
  CategoryMonthReturn,
  VehicleMonthReturn,
  MonthReturn,
  QuarterlyReturn,
  RollingPerformancePoint,
  PerformanceMatrixTreeNode,
  BondTreasuryDiagnostics,
  BondSplitSlice,
  NormalizedRatingKey,
} from "./types";
