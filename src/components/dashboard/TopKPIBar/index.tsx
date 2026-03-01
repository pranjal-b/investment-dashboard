"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioSnapshot } from "@/lib/store/dashboardStore";
import { formatINR } from "@/lib/charts/chartTheme";

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function TopKPIBar() {
  const snapshot = usePortfolioSnapshot();

  const kpis = [
    { label: "Portfolio Market Value", value: formatINR(snapshot.portfolioMarketValue) },
    { label: "Total Cost", value: formatINR(snapshot.totalCostValue) },
    {
      label: "Absolute Gain",
      value: formatINR(snapshot.absoluteGainRs),
      sub: formatPercent(snapshot.absoluteGainPct),
      variant: snapshot.absoluteGainRs >= 0 ? "positive" : "negative",
    },
    {
      label: "Unrealized Gain",
      value: formatINR(snapshot.unrealizedGain),
      variant: snapshot.unrealizedGain >= 0 ? "positive" : "negative",
    },
    {
      label: "Realized Gain",
      value: formatINR(snapshot.realizedGain),
      variant: snapshot.realizedGain >= 0 ? "positive" : "negative",
    },
    { label: "Net Cash Flow (Last Month)", value: formatINR(snapshot.netCashFlowLastMonth) },
    {
      label: "Portfolio XIRR",
      value: formatPercent(snapshot.portfolioXIRR),
      variant: (snapshot.portfolioXIRR ?? 0) >= 0 ? "positive" : "negative",
    },
    {
      label: "Benchmark XIRR",
      value: formatPercent(snapshot.benchmarkXIRR),
    },
    {
      label: "Peer XIRR",
      value: formatPercent(snapshot.peerXIRR),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9 gap-3">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden"
        >
          <CardHeader className="pb-1 pt-3 px-3">
            <h3 className="text-xs font-medium text-muted-foreground truncate">
              {kpi.label}
            </h3>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <p
              className={`text-lg font-semibold tabular-nums truncate ${
                kpi.variant === "positive"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : kpi.variant === "negative"
                    ? "text-red-600 dark:text-red-400"
                    : ""
              }`}
            >
              {kpi.value}
            </p>
            {kpi.sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
