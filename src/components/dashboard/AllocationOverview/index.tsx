"use client";

import { Fragment, useCallback, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PolicyAllocationTreeNode } from "@/lib/analytics/policyAllocationTree";
import { getPolicyRowBenchmarkContext } from "@/lib/analytics/policyBenchmarkScope";
import {
  usePolicyAllocationTree,
  useFormatINR,
  usePerformanceMatrixData,
  useRebalanceInsight,
} from "@/lib/store/dashboardStore";
import { AllocationDeviationChart } from "./AllocationDeviationChart";
import { AllocationPctDonutChart } from "./AllocationPctDonutChart";

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatPercentOrDash(value: number | null): string {
  if (value === null) return "—";
  return formatPercent(value);
}

function PolicyRows({
  nodes,
  expanded,
  toggle,
  formatINR,
  benchmarkXIRR,
}: {
  nodes: PolicyAllocationTreeNode[];
  expanded: Set<string>;
  toggle: (pathKey: string) => void;
  formatINR: (n: number) => string;
  benchmarkXIRR: number | null;
}) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isOpen = expanded.has(node.pathKey);
        const padLeft = 12 + node.depth * 20;
        const bench = getPolicyRowBenchmarkContext(node.pathKey, benchmarkXIRR);

        return (
          <Fragment key={node.pathKey}>
            <tr className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3" style={{ paddingLeft: padLeft }}>
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
              <td className="text-right py-2 px-3 tabular-nums">{formatINR(node.invested)}</td>
              <td className="text-right py-2 px-3 tabular-nums">{formatINR(node.marketValue)}</td>
              <td className="text-right py-2 px-3 tabular-nums">{node.allocationPct.toFixed(1)}%</td>
              <td className="text-right py-2 px-3 tabular-nums text-muted-foreground">
                {node.targetPct.toFixed(1)}%
              </td>
              <td
                className={`text-right py-2 px-3 tabular-nums ${
                  node.residualPct >= 0
                    ? "text-amber-700 dark:text-amber-500"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                {formatPercent(node.residualPct)}
              </td>
              <td
                className={`text-right py-2 px-3 tabular-nums ${
                  node.pnl >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatINR(node.pnl)}
              </td>
              <td
                className={`text-right py-2 px-3 tabular-nums ${
                  node.roi >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatPercent(node.roi)}
              </td>
              <td
                className={`text-right py-2 px-3 tabular-nums ${
                  (node.portfolioXIRR ?? 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatPercentOrDash(node.portfolioXIRR)}
              </td>
              <td
                className={`text-right py-2 px-3 tabular-nums ${
                  node.xirrMinusRoi != null && node.xirrMinusRoi >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : node.xirrMinusRoi != null
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                }`}
                title="XIRR − ROI (% pts). Large gaps often reflect cash-flow timing vs average cost."
              >
                {formatPercentOrDash(node.xirrMinusRoi)}
              </td>
              <td
                className="text-right py-2 px-3 tabular-nums text-muted-foreground max-w-[5rem]"
                title={bench.title}
              >
                {formatPercentOrDash(bench.displayPct)}
              </td>
              <td className="text-right py-2 px-3 tabular-nums">{formatINR(node.unrealizedST)}</td>
              <td className="text-right py-2 px-3 tabular-nums">{formatINR(node.unrealizedLT)}</td>
            </tr>
            {hasChildren && isOpen ? (
              <PolicyRows
                nodes={node.children}
                expanded={expanded}
                toggle={toggle}
                formatINR={formatINR}
                benchmarkXIRR={benchmarkXIRR}
              />
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}

export function AllocationOverview() {
  const tree = usePolicyAllocationTree();
  const formatINR = useFormatINR();
  const rebalanceInsight = useRebalanceInsight();
  const { benchmarkXIRR } = usePerformanceMatrixData();

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((pathKey: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Allocation Overview</h2>

      <Card className="border border-border/60 rounded-xl overflow-hidden shadow-none min-w-0 h-full flex flex-col min-h-0">
        <CardContent className="flex flex-1 flex-col min-h-0 overflow-hidden px-0 pt-4 pb-4">
          <div className="overflow-auto min-h-0 flex-1">
            {tree.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4">No holdings in view.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[220px]">
                      Category
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Invested</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Market Value</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Alloc %</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Target %</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Residual %</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">P&L</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">ROI</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">XIRR</th>
                    <th
                      className="text-right py-2 px-3 font-medium text-muted-foreground"
                      title="Per-row: XIRR minus simple ROI. Useful for Liquid / FD / Bank to see timing effects."
                    >
                      Δ XIRR−ROI
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground align-bottom">
                      <span className="block">Bench.</span>
                      <span className="block text-[10px] font-normal text-muted-foreground/90 normal-case">
                        (equity index)
                      </span>
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Unreal. ST</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Unreal. LT</th>
                  </tr>
                </thead>
                <tbody>
                  <PolicyRows
                    nodes={tree}
                    expanded={expanded}
                    toggle={toggle}
                    formatINR={formatINR}
                    benchmarkXIRR={benchmarkXIRR}
                  />
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {rebalanceInsight && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 space-y-2">
          <p>{rebalanceInsight.message}</p>
          {rebalanceInsight.secondaryMessage ? (
            <p className="text-amber-800/90 dark:text-amber-200/90 border-t border-amber-200/60 dark:border-amber-800/50 pt-2">
              {rebalanceInsight.secondaryMessage}
            </p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0 items-stretch">
        <AllocationPctDonutChart />
        <AllocationDeviationChart />
      </div>
    </div>
  );
}
