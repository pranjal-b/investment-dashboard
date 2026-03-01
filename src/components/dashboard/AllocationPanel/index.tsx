"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAllocationBuckets } from "@/lib/store/dashboardStore";
import { formatINR } from "@/lib/charts/chartTheme";

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function AllocationPanel() {
  const buckets = useAllocationBuckets();
  const filtered = buckets.filter((b) => b.marketValue > 0);

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Allocation Control Panel</h2>
        <p className="text-xs text-muted-foreground">
          By bucket: Invested, Market Value, Allocation %, Target %, Residual %, P&L, ROI
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Bucket</th>
              <th className="text-right py-2 px-3 font-medium">Invested</th>
              <th className="text-right py-2 px-3 font-medium">Market Value</th>
              <th className="text-right py-2 px-3 font-medium">Alloc %</th>
              <th className="text-right py-2 px-3 font-medium">Target %</th>
              <th className="text-right py-2 px-3 font-medium">Residual %</th>
              <th className="text-right py-2 px-3 font-medium">P&L</th>
              <th className="text-right py-2 px-3 font-medium">ROI</th>
              <th className="text-right py-2 px-3 font-medium">Unreal. ST</th>
              <th className="text-right py-2 px-3 font-medium">Unreal. LT</th>
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
                <td className={`text-right py-2 px-3 tabular-nums ${bucket.residualPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatPercent(bucket.residualPct)}
                </td>
                <td className={`text-right py-2 px-3 tabular-nums ${bucket.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatINR(bucket.pnl)}
                </td>
                <td className={`text-right py-2 px-3 tabular-nums ${bucket.roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
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
  );
}
