/**
 * FY Performance module: shared types for engines and chart.
 * No UI; consumed by aggregationEngine, benchmarkEngine, and chart selector.
 */

/** Single period (month / quarter / YoY point) with portfolio and optional benchmark metrics */
export interface PeriodPoint {
  periodLabel: string;
  date: Date;
  portfolioReturnPct: number | null;
  /** Portfolio value in ₹ (derived from indexed × initial value when no historical NAV) */
  portfolioValue?: number;
  /** Indexed to 100 at FY start */
  portfolioIndexed?: number;
}

/** One time series for chart (portfolio or benchmark) */
export interface PerformanceSeries {
  id: string;
  name: string;
  /** Values in selected Y-axis mode (value ₹ / return % / indexed 100) */
  values: (number | null)[];
  /** For tooltip: period return % per point (when Y mode is value or indexed) */
  periodReturnsPct?: (number | null)[];
}

/** Chart-ready data from selector: xAxis labels + portfolio + benchmarks, in chosen Y mode */
export interface PerformanceChartData {
  xAxisPeriods: string[];
  portfolio: PerformanceSeries;
  benchmarks: PerformanceSeries[];
  /** When view-by is asset class or vehicle: segment series replace portfolio+benchmarks in chart */
  segmentSeries?: PerformanceSeries[];
  /** Optional: excess vs primary benchmark */
  excessReturnSeries?: PerformanceSeries;
  /** Initial portfolio value at FY start (for value mode tooltip) */
  initialPortfolioValue?: number;
  /** Y-axis mode for axis label and tooltip formatting */
  yAxisMode: PerformanceYAxisMode;
}

/** Frequency for aggregation: month-on-month, quarter-on-quarter, year-on-year */
export type PerformanceFrequency = "mom" | "qoq" | "yoy";

/** Y-axis display mode */
export type PerformanceYAxisMode = "value" | "return" | "indexed";

/** Raw benchmark series from store (date, value) */
export interface BenchmarkDataPoint {
  date: string;
  value: number;
}
