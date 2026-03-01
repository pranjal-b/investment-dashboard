"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  useAllocationBuckets,
  useFormatINR,
  useRebalanceInsight,
} from "@/lib/store/dashboardStore";
import { AllocationSnapshotBar } from "./AllocationSnapshotBar";
import { AllocationDeviationChart } from "./AllocationDeviationChart";

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function AllocationOverview() {
  const buckets = useAllocationBuckets();
  const formatINR = useFormatINR();
  const rebalanceInsight = useRebalanceInsight();
  const filtered = buckets.filter((b) => b.marketValue > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Allocation Overview</h2>

      {/* Bucket-level detail table (first) */}
      <Card className="border border-border/60 rounded-xl overflow-hidden shadow-none">
        <CardContent className="overflow-x-auto px-0 pt-4 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Bucket</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Invested</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Market Value</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Alloc %</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Target %</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Residual %</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">P&L</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">ROI</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Unreal. ST</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Unreal. LT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bucket) => (
                <tr key={bucket.bucketId} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-3 font-medium">{bucket.label}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatINR(bucket.invested)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatINR(bucket.marketValue)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{bucket.allocationPct.toFixed(1)}%</td>
                  <td className="text-right py-2 px-3 tabular-nums text-muted-foreground">{bucket.targetPct.toFixed(1)}%</td>
                  <td
                    className={`text-right py-2 px-3 tabular-nums ${
                      bucket.residualPct >= 0
                        ? "text-amber-700 dark:text-amber-500"
                        : "text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {formatPercent(bucket.residualPct)}
                  </td>
                  <td
                    className={`text-right py-2 px-3 tabular-nums ${
                      bucket.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatINR(bucket.pnl)}
                  </td>
                  <td
                    className={`text-right py-2 px-3 tabular-nums ${
                      bucket.roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatPercent(bucket.roi)}
                  </td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatINR(bucket.unrealizedST)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatINR(bucket.unrealizedLT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Rebalancing insight banner */}
      {rebalanceInsight && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {rebalanceInsight.message}
        </div>
      )}

      {/* Two panels: same height, equal columns, fixed chart area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0 items-stretch">
        <div className="min-w-0 h-full flex flex-col">
          <AllocationSnapshotBar />
        </div>
        <div className="min-w-0 h-full flex flex-col">
          <AllocationDeviationChart />
        </div>
      </div>
    </div>
  );
}
