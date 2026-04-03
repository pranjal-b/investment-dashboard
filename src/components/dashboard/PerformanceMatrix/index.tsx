"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePerformanceMatrixData, useDashboardStore } from "@/lib/store/dashboardStore";
import { PERFORMANCE_MATRIX_PERIODS } from "@/lib/analytics/returnEngine";
import {
  getPerformanceMatrixSample,
  getPerformanceMatrixSampleTree,
  PERFORMANCE_MATRIX_SCENARIOS,
  type PerformanceMatrixScenario,
} from "@/data/performance-matrix-sample";
import type { PerformanceMatrixTreeNode } from "@/lib/analytics/types";

const SAMPLE_PERIOD_KEYS = ["3M", "6M", "1Y", "3Y", "Since Inception"] as const;

function formatPercent(value: number | null, mutedIfNull = false): React.ReactNode {
  if (value === null) {
    return <span className={mutedIfNull ? "text-muted-foreground" : ""}>—</span>;
  }
  const str = `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  return mutedIfNull ? <span className="text-muted-foreground">{str}</span> : str;
}

const PERIOD_HEADERS: Record<string, string> = {
  "3M": "3M",
  "6M": "6M",
  "1Y": "1Y",
  "3Y": "3Y",
  SI: "Since Inception",
};

function MatrixRows({
  nodes,
  expanded,
  toggle,
  periods,
}: {
  nodes: PerformanceMatrixTreeNode[];
  expanded: Set<string>;
  toggle: (pathKey: string) => void;
  periods: readonly string[];
}) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isOpen = expanded.has(node.pathKey);
        const padLeft = 12 + node.depth * 20;

        return (
          <Fragment key={node.pathKey}>
            <tr className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3 min-w-[220px]" style={{ paddingLeft: padLeft }}>
                <div className="flex items-center gap-1.5 min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggle(node.pathKey)}
                      className="shrink-0 inline-flex rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4" aria-hidden />
                      ) : (
                        <ChevronRight className="size-4" aria-hidden />
                      )}
                    </button>
                  ) : (
                    <span className="inline-block w-6 shrink-0" aria-hidden />
                  )}
                  <span
                    className={
                      node.depth === 0
                        ? "font-semibold text-foreground truncate"
                        : node.depth === 1
                          ? "font-medium text-foreground truncate"
                          : "text-muted-foreground truncate"
                    }
                  >
                    {node.label}
                  </span>
                </div>
              </td>
              {periods.map((p) => (
                <td key={p} className="text-right py-2 px-3 tabular-nums">
                  {formatPercent(node.periodReturns[p] ?? null)}
                </td>
              ))}
            </tr>
            {hasChildren && isOpen ? (
              <MatrixRows
                nodes={node.children}
                expanded={expanded}
                toggle={toggle}
                periods={periods}
              />
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}

export function PerformanceMatrix() {
  const scenario = useDashboardStore(
    (s) => (s.filters.performanceMatrixScenario ?? "moderate") as "live" | PerformanceMatrixScenario
  );
  const setFilters = useDashboardStore((s) => s.setFilters);
  const { matrixTree, benchmarkByPeriod, portfolioByPeriod } = usePerformanceMatrixData();
  const periods = [...PERFORMANCE_MATRIX_PERIODS];
  const useSample = scenario !== "live";

  const flatSample = useMemo(
    () => (useSample ? getPerformanceMatrixSample(scenario as PerformanceMatrixScenario) : null),
    [useSample, scenario]
  );
  const sampleTree = useMemo(
    () => (useSample ? getPerformanceMatrixSampleTree(scenario as PerformanceMatrixScenario) : null),
    [useSample, scenario]
  );

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const togglePath = useCallback((pathKey: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  }, []);

  useEffect(() => {
    if (useSample && sampleTree) {
      const next = new Set<string>();
      for (const n of sampleTree) {
        if (n.children.length > 0) next.add(n.pathKey);
      }
      setExpandedPaths(next);
    } else if (!useSample) {
      setExpandedPaths(new Set());
    }
  }, [useSample, scenario, sampleTree]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Data
          </span>
          <Select
            value={scenario}
            onValueChange={(v) =>
              setFilters({ performanceMatrixScenario: v as "live" | PerformanceMatrixScenario })
            }
          >
            <SelectTrigger className="h-8 w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live</SelectItem>
              {PERFORMANCE_MATRIX_SCENARIOS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Benchmark selector (uses FY Performance benchmark keys) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Benchmark
          </span>
          <span className="text-xs text-muted-foreground">From global performance controls</span>
        </div>
      </div>

      <Card className="border border-border/60 rounded-xl overflow-hidden shadow-none">
        <CardContent className="overflow-x-auto px-0 pt-4 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  Category
                </th>
                {useSample
                  ? SAMPLE_PERIOD_KEYS.map((p) => (
                      <th
                        key={p}
                        className="text-right py-2 px-3 font-medium text-muted-foreground"
                      >
                        {p}
                      </th>
                    ))
                  : periods.map((p) => (
                      <th
                        key={p}
                        className="text-right py-2 px-3 font-medium text-muted-foreground"
                      >
                        {PERIOD_HEADERS[p]}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {useSample && flatSample && sampleTree ? (
                <>
                  {sampleTree.length === 0 ? (
                    <tr>
                      <td
                        colSpan={SAMPLE_PERIOD_KEYS.length + 1}
                        className="py-8 px-3 text-sm text-muted-foreground text-center"
                      >
                        No sample categories.
                      </td>
                    </tr>
                  ) : (
                    <MatrixRows
                      nodes={sampleTree}
                      expanded={expandedPaths}
                      toggle={togglePath}
                      periods={periods}
                    />
                  )}
                  {flatSample
                    .filter((row) => row.bucket === "Benchmark (Nifty 50)" || row.bucket === "Portfolio XIRR")
                    .map((row) => (
                      <tr
                        key={row.bucket}
                        className={
                          row.bucket === "Portfolio XIRR"
                            ? "bg-muted/30"
                            : "border-b border-border/50 hover:bg-muted/30"
                        }
                      >
                        <td
                          className={`py-2 px-3 font-medium ${
                            row.bucket === "Benchmark (Nifty 50)" ? "text-muted-foreground" : ""
                          }`}
                        >
                          {row.bucket}
                        </td>
                        {SAMPLE_PERIOD_KEYS.map((p) => (
                          <td key={p} className="text-right py-2 px-3 tabular-nums">
                            {formatPercent(row[p], row[p] === null)}
                          </td>
                        ))}
                      </tr>
                    ))}
                </>
              ) : (
                <>
                  {matrixTree.length === 0 ? (
                    <tr>
                      <td colSpan={periods.length + 1} className="py-8 px-3 text-sm text-muted-foreground text-center">
                        No holdings in view.
                      </td>
                    </tr>
                  ) : (
                    <MatrixRows
                      nodes={matrixTree}
                      expanded={expandedPaths}
                      toggle={togglePath}
                      periods={periods}
                    />
                  )}
                  <tr className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium text-muted-foreground">
                      Benchmark (XIRR)
                    </td>
                    {periods.map((p) => (
                      <td
                        key={p}
                        className="text-right py-2 px-3 tabular-nums text-muted-foreground"
                      >
                        {formatPercent(benchmarkByPeriod[p] ?? null)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="py-2 px-3 font-medium">Portfolio XIRR</td>
                    {periods.map((p) => (
                      <td
                        key={p}
                        className="text-right py-2 px-3 tabular-nums font-medium"
                      >
                        {formatPercent(portfolioByPeriod[p] ?? null)}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        {useSample
          ? "Sample data: expand Equity investment or Liquid & equivalents to see sub-rows (same control pattern as Live). Switch to Live for your holdings tree."
          : "Same investment policy tree as Allocation Overview: expand any category to drill into sub-categories. Benchmark row uses global performance controls; Since Inception aligns with portfolio/benchmark XIRR."}
      </p>
    </div>
  );
}
