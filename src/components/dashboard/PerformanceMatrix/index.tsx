"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePeriodReturns, useReturnMetrics } from "@/lib/store/dashboardStore";

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function PerformanceMatrix() {
  const periodReturns = usePeriodReturns();
  const returnMetrics = useReturnMetrics();

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Performance Matrix</h2>
        <p className="text-xs text-muted-foreground">
          Period returns (Portfolio, Benchmark, Peer) • XIRR below
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                Period
              </th>
              <th className="text-right py-2 px-3 font-medium">Portfolio</th>
              <th className="text-right py-2 px-3 font-medium">Benchmark</th>
              <th className="text-right py-2 px-3 font-medium">Peer</th>
            </tr>
          </thead>
          <tbody>
            {periodReturns.map((row) => (
              <tr key={row.period} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium">{row.period}</td>
                <td className="text-right py-2 px-3 tabular-nums">
                  {formatPercent(row.portfolio)}
                </td>
                <td className="text-right py-2 px-3 tabular-nums text-muted-foreground">
                  {formatPercent(row.benchmark)}
                </td>
                <td className="text-right py-2 px-3 tabular-nums text-muted-foreground">
                  {formatPercent(row.peer)}
                </td>
              </tr>
            ))}
            <tr className="bg-muted/30">
              <td className="py-2 px-3 font-medium">XIRR</td>
              <td className="text-right py-2 px-3 tabular-nums font-medium">
                {formatPercent(returnMetrics.portfolioXIRR)}
              </td>
              <td className="text-right py-2 px-3 tabular-nums text-muted-foreground">
                {formatPercent(returnMetrics.benchmarkXIRR)}
              </td>
              <td className="text-right py-2 px-3 tabular-nums text-muted-foreground">
                {formatPercent(returnMetrics.peerXIRR)}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
