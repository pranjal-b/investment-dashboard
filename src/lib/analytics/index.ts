/**
 * Analytics engine layer – single entry for all engine outputs.
 * UI consumes only these APIs; no financial logic in components.
 */

export { getPortfolioSnapshot } from "./portfolioEngine";
export type { PortfolioEngineInput } from "./portfolioEngine";

export { getAllocationBuckets } from "./allocationEngine";
export type { AllocationEngineInput } from "./allocationEngine";

export { getReturnMetrics, getPeriodReturns, getHoldingPeriodReturns } from "./returnEngine";
export type { ReturnEngineInput, HoldingPeriodReturn } from "./returnEngine";

export { getRiskMetrics, getDebtRisk } from "./riskEngine";
export type { RiskEngineInput } from "./riskEngine";

export { getPolicyChecks } from "./complianceEngine";
export type { ComplianceEngineInput } from "./complianceEngine";

export { getFYPerformance, getRollingPerformance } from "./performanceEngine";
export type { PerformanceEngineInput } from "./performanceEngine";

export type {
  PortfolioSnapshot,
  AllocationBucket,
  ReturnMetrics,
  PeriodReturn,
  RiskMetrics,
  DebtRisk,
  PolicyCheck,
  PolicyStatus,
  FYPerformance,
  MonthReturn,
  QuarterlyReturn,
  RollingPerformancePoint,
} from "./types";
