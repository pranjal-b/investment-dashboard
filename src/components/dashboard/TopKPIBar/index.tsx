"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioSnapshot, useFormatINR } from "@/lib/store/dashboardStore";

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function TopKPIBar() {
  const snapshot = usePortfolioSnapshot();
  const formatINR = useFormatINR();

  const alphaPct: number | null =
    snapshot.portfolioXIRR != null && snapshot.benchmarkXIRR != null
      ? snapshot.portfolioXIRR - snapshot.benchmarkXIRR
      : null;

  // —— Single row: Wealth → Profitability → Cash → Performance (institutional order) ——
  const kpis: KpiItem[] = [
    { label: "Portfolio Market Value", value: formatINR(snapshot.portfolioMarketValue) },
    { label: "Total Invested Capital", value: formatINR(snapshot.totalCostValue) },
    {
      label: "Absolute Gain",
      value: formatINR(snapshot.absoluteGainRs),
      sub: formatPercent(snapshot.absoluteGainPct),
      variant: (snapshot.absoluteGainRs >= 0 ? "positive" : "negative") as "positive" | "negative",
    },
    {
      label: "Unrealized Gain",
      value: formatINR(snapshot.unrealizedGain),
      variant: (snapshot.unrealizedGain >= 0 ? "positive" : "negative") as "positive" | "negative",
    },
    {
      label: "Realized Gain",
      value: formatINR(snapshot.realizedGain),
      variant: (snapshot.realizedGain >= 0 ? "positive" : "negative") as "positive" | "negative",
    },
    { label: "Net Cash Flow (Last Month)", value: formatINR(snapshot.netCashFlowLastMonth) },
    {
      label: "Portfolio XIRR",
      value: formatPercent(snapshot.portfolioXIRR),
      variant: ((snapshot.portfolioXIRR ?? 0) >= 0 ? "positive" : "negative") as "positive" | "negative",
    },
    { label: "Benchmark", value: formatPercent(snapshot.benchmarkXIRR) },
    {
      label: "Alpha (vs Benchmark)",
      value: formatPercent(alphaPct),
      variant: ((alphaPct ?? 0) >= 0 ? "positive" : "negative") as "positive" | "negative",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

type KpiItem = {
  label: string;
  value: string;
  sub?: string;
  variant?: "positive" | "negative";
};

function KpiCard({ kpi }: { kpi: KpiItem }) {
  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
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
  );
}
