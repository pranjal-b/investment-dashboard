/**
 * Realistic sample data for Performance Matrix (Indian market context).
 * Guardrails: 3M -8% to +12%, 6M -12% to +18%, 1Y -15% to +28%, 3Y CAGR 8–22%, SI CAGR 9–18%.
 * Use for prototype; toggle between moderate, conservative, and bull scenarios.
 *
 * Scenario rows (except benchmark / portfolio) are rolled into the same drill-down tree as Live:
 * Equity investment → Direct Equity, Equity MF, PMS, AIF, ETF; Liquid & equivalents → Bank & liquid.
 */

import type { PerformanceMatrixTreeNode } from "@/lib/analytics/types";

export interface PerformanceMatrixSampleRow {
  bucket: string;
  "3M": number | null;
  "6M": number | null;
  "1Y": number | null;
  "3Y": number | null;
  "Since Inception": number | null;
}

/** Moderate balanced scenario – typical Indian equity range */
export const performanceMatrixModerate: PerformanceMatrixSampleRow[] = [
  {
    bucket: "Direct Equity",
    "3M": 4.8,
    "6M": 9.2,
    "1Y": 18.4,
    "3Y": 16.1,
    "Since Inception": 15.3,
  },
  {
    bucket: "Equity MF",
    "3M": 3.9,
    "6M": 8.1,
    "1Y": 15.7,
    "3Y": 14.2,
    "Since Inception": 13.8,
  },
  {
    bucket: "PMS",
    "3M": 6.1,
    "6M": 11.3,
    "1Y": 21.6,
    "3Y": 17.8,
    "Since Inception": 16.9,
  },
  {
    bucket: "AIF",
    "3M": -2.4,
    "6M": 7.5,
    "1Y": 19.8,
    "3Y": 18.5,
    "Since Inception": 17.2,
  },
  {
    bucket: "ETF",
    "3M": 3.5,
    "6M": 7.8,
    "1Y": 16.2,
    "3Y": 14.9,
    "Since Inception": 14.5,
  },
  {
    bucket: "Bank & liquid",
    "3M": 1.1,
    "6M": 2.2,
    "1Y": 4.4,
    "3Y": 4.1,
    "Since Inception": 4.0,
  },
  {
    bucket: "Benchmark (Nifty 50)",
    "3M": 3.1,
    "6M": 6.9,
    "1Y": 14.8,
    "3Y": 13.6,
    "Since Inception": 13.2,
  },
  {
    bucket: "Portfolio XIRR",
    "3M": null,
    "6M": null,
    "1Y": null,
    "3Y": null,
    "Since Inception": 15.8,
  },
];

/** Conservative scenario – lower volatility, modest returns */
export const performanceMatrixConservative: PerformanceMatrixSampleRow[] = [
  {
    bucket: "Direct Equity",
    "3M": 2.1,
    "6M": 5.4,
    "1Y": 11.2,
    "3Y": 10.8,
    "Since Inception": 10.2,
  },
  {
    bucket: "Equity MF",
    "3M": 1.8,
    "6M": 4.9,
    "1Y": 10.1,
    "3Y": 9.6,
    "Since Inception": 9.4,
  },
  {
    bucket: "PMS",
    "3M": 2.5,
    "6M": 6.2,
    "1Y": 12.4,
    "3Y": 11.5,
    "Since Inception": 11.0,
  },
  {
    bucket: "AIF",
    "3M": -1.2,
    "6M": 3.8,
    "1Y": 9.5,
    "3Y": 10.2,
    "Since Inception": 9.8,
  },
  {
    bucket: "ETF",
    "3M": 1.6,
    "6M": 4.2,
    "1Y": 9.8,
    "3Y": 9.4,
    "Since Inception": 9.1,
  },
  {
    bucket: "Bank & liquid",
    "3M": 0.7,
    "6M": 1.4,
    "1Y": 2.8,
    "3Y": 2.9,
    "Since Inception": 2.8,
  },
  {
    bucket: "Benchmark (Nifty 50)",
    "3M": 1.4,
    "6M": 3.6,
    "1Y": 8.9,
    "3Y": 8.5,
    "Since Inception": 8.2,
  },
  {
    bucket: "Portfolio XIRR",
    "3M": null,
    "6M": null,
    "1Y": null,
    "3Y": null,
    "Since Inception": 10.5,
  },
];

/** Strong bull-market scenario – higher returns, still within guardrails */
export const performanceMatrixBull: PerformanceMatrixSampleRow[] = [
  {
    bucket: "Direct Equity",
    "3M": 9.2,
    "6M": 15.6,
    "1Y": 24.8,
    "3Y": 19.4,
    "Since Inception": 17.8,
  },
  {
    bucket: "Equity MF",
    "3M": 7.8,
    "6M": 13.2,
    "1Y": 21.4,
    "3Y": 17.2,
    "Since Inception": 15.9,
  },
  {
    bucket: "PMS",
    "3M": 10.4,
    "6M": 16.8,
    "1Y": 26.2,
    "3Y": 20.8,
    "Since Inception": 18.6,
  },
  {
    bucket: "AIF",
    "3M": 4.2,
    "6M": 12.5,
    "1Y": 22.6,
    "3Y": 19.2,
    "Since Inception": 17.5,
  },
  {
    bucket: "ETF",
    "3M": 7.2,
    "6M": 12.8,
    "1Y": 20.6,
    "3Y": 16.4,
    "Since Inception": 15.2,
  },
  {
    bucket: "Bank & liquid",
    "3M": 1.6,
    "6M": 3.1,
    "1Y": 5.2,
    "3Y": 5.0,
    "Since Inception": 4.9,
  },
  {
    bucket: "Benchmark (Nifty 50)",
    "3M": 6.8,
    "6M": 11.9,
    "1Y": 18.4,
    "3Y": 15.2,
    "Since Inception": 14.1,
  },
  {
    bucket: "Portfolio XIRR",
    "3M": null,
    "6M": null,
    "1Y": null,
    "3Y": null,
    "Since Inception": 17.2,
  },
];

export type PerformanceMatrixScenario = "moderate" | "conservative" | "bull";

export const PERFORMANCE_MATRIX_SCENARIOS: { value: PerformanceMatrixScenario; label: string }[] = [
  { value: "moderate", label: "Moderate" },
  { value: "conservative", label: "Conservative" },
  { value: "bull", label: "Bull market" },
];

export function getPerformanceMatrixSample(
  scenario: PerformanceMatrixScenario
): PerformanceMatrixSampleRow[] {
  switch (scenario) {
    case "conservative":
      return performanceMatrixConservative;
    case "bull":
      return performanceMatrixBull;
    default:
      return performanceMatrixModerate;
  }
}

const SAMPLE_EQUITY_LEAF_BUCKETS = new Set([
  "Direct Equity",
  "Equity MF",
  "PMS",
  "AIF",
  "ETF",
]);
const SAMPLE_LIQUID_LEAF_BUCKETS = new Set(["Bank & liquid"]);

function sampleRowToPeriodReturns(row: PerformanceMatrixSampleRow): Record<string, number | null> {
  return {
    "3M": row["3M"],
    "6M": row["6M"],
    "1Y": row["1Y"],
    "3Y": row["3Y"],
    SI: row["Since Inception"],
  };
}

function meanSamplePeriodReturns(rows: PerformanceMatrixSampleRow[]): Record<string, number | null> {
  const keys = ["3M", "6M", "1Y", "3Y", "Since Inception"] as const;
  const out: Record<string, number | null> = {};
  for (const k of keys) {
    const engineKey = k === "Since Inception" ? "SI" : k;
    const vals = rows.map((r) => r[k]).filter((v): v is number => v != null && !Number.isNaN(v));
    out[engineKey] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  return out;
}

function sampleLeafNode(
  row: PerformanceMatrixSampleRow,
  pathKey: string,
  depth: number
): PerformanceMatrixTreeNode {
  return {
    pathKey,
    depth,
    label: row.bucket,
    periodReturns: sampleRowToPeriodReturns(row),
    xirrPct: row["Since Inception"],
    children: [],
  };
}

const SAMPLE_L1_EMPTY_RETURNS: Record<string, number | null> = {
  "3M": null,
  "6M": null,
  "1Y": null,
  "3Y": null,
  SI: null,
};

function sampleL1Placeholder(pathKey: string, label: string): PerformanceMatrixTreeNode {
  return {
    pathKey,
    depth: 0,
    label,
    periodReturns: { ...SAMPLE_L1_EMPTY_RETURNS },
    xirrPct: null,
    children: [],
  };
}

/** Drill-down sample tree (same expand UX as Live). Always shows all five policy L1 rows. */
export function getPerformanceMatrixSampleTree(
  scenario: PerformanceMatrixScenario
): PerformanceMatrixTreeNode[] {
  const flat = getPerformanceMatrixSample(scenario);
  const dataRows = flat.filter(
    (r) => r.bucket !== "Benchmark (Nifty 50)" && r.bucket !== "Portfolio XIRR"
  );
  const equityLeaves = dataRows.filter((r) => SAMPLE_EQUITY_LEAF_BUCKETS.has(r.bucket));
  const liquidLeaves = dataRows.filter((r) => SAMPLE_LIQUID_LEAF_BUCKETS.has(r.bucket));

  const liquidNode: PerformanceMatrixTreeNode =
    liquidLeaves.length > 0
      ? {
          pathKey: `sample:liquid-equivalents:${scenario}`,
          depth: 0,
          label: "Liquid & equivalents",
          periodReturns: meanSamplePeriodReturns(liquidLeaves),
          xirrPct: null,
          children: liquidLeaves.map((r, i) =>
            sampleLeafNode(r, `sample:liquid:${scenario}:${i}:${r.bucket}`, 1)
          ),
        }
      : sampleL1Placeholder(`sample:liquid-equivalents:${scenario}`, "Liquid & equivalents");

  const debtNode = sampleL1Placeholder(`sample:debt-investment:${scenario}`, "Debt investment");

  const equityNode: PerformanceMatrixTreeNode =
    equityLeaves.length > 0
      ? {
          pathKey: `sample:equity-investment:${scenario}`,
          depth: 0,
          label: "Equity investment",
          periodReturns: meanSamplePeriodReturns(equityLeaves),
          xirrPct: null,
          children: equityLeaves.map((r, i) =>
            sampleLeafNode(r, `sample:equity:${scenario}:${i}:${r.bucket}`, 1)
          ),
        }
      : sampleL1Placeholder(`sample:equity-investment:${scenario}`, "Equity investment");

  const altNode = sampleL1Placeholder(
    `sample:alternative-investments:${scenario}`,
    "Alternative investments"
  );
  const unlistedNode = sampleL1Placeholder(`sample:unlisted:${scenario}`, "Unlisted");

  const nodes: PerformanceMatrixTreeNode[] = [
    liquidNode,
    debtNode,
    equityNode,
    altNode,
    unlistedNode,
  ];

  const used = new Set([...SAMPLE_EQUITY_LEAF_BUCKETS, ...SAMPLE_LIQUID_LEAF_BUCKETS]);
  const orphanLeaves = dataRows.filter((r) => !used.has(r.bucket));
  for (let i = 0; i < orphanLeaves.length; i++) {
    const r = orphanLeaves[i]!;
    nodes.push(sampleLeafNode(r, `sample:orphan:${scenario}:${i}:${r.bucket}`, 0));
  }

  return nodes;
}
