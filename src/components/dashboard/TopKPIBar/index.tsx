"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePortfolioSnapshot, useFormatINR, useRiskMetrics } from "@/lib/store/dashboardStore";

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function TopKPIBar() {
  const snapshot = usePortfolioSnapshot();
  const risk = useRiskMetrics();
  const formatINR = useFormatINR();

  const alphaPct: number | null =
    snapshot.portfolioXIRR != null && snapshot.benchmarkXIRR != null
      ? snapshot.portfolioXIRR - snapshot.benchmarkXIRR
      : null;

  // —— Row 1 (Primary): Wealth → Profitability → Performance ——
  const row1 = [
    { label: "Portfolio Market Value", value: formatINR(snapshot.portfolioMarketValue) },
    { label: "Total Invested Capital", value: formatINR(snapshot.totalCostValue) },
    {
      label: "Absolute Gain",
      value: formatINR(snapshot.absoluteGainRs),
      sub: formatPercent(snapshot.absoluteGainPct),
      variant: snapshot.absoluteGainRs >= 0 ? "positive" : "negative",
    },
    {
      label: "Portfolio XIRR",
      value: formatPercent(snapshot.portfolioXIRR),
      variant: (snapshot.portfolioXIRR ?? 0) >= 0 ? "positive" : "negative",
    },
    {
      label: "Alpha (vs Benchmark)",
      value: formatPercent(alphaPct),
      variant: (alphaPct ?? 0) >= 0 ? "positive" : "negative",
    },
  ];

  // —— Row 2 (Secondary): Unrealized, Realized, Cash, Benchmark, Peer ——
  const row2 = [
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
    { label: "Benchmark", value: formatPercent(snapshot.benchmarkXIRR) },
    { label: "Peer", value: formatPercent(snapshot.peerXIRR) },
  ];

  // —— Optional Risk Snapshot (hover expansion) ——
  const riskSummary = [
    { label: "Top 5 Concentration", value: `${risk.top5ConcentrationPct.toFixed(1)}%` },
    { label: "Lock-in", value: `${snapshot.pctLockIn.toFixed(1)}%` },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Row 1: Market Value | Total Invested Capital | Absolute Gain (₹ & %) | XIRR | Alpha */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {row1.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} size="primary" />
          ))}
        </div>

        {/* Row 2: Unrealized | Realized | Net Cash Flow | Benchmark | Peer | Risk (hover) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {row2.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} size="secondary" />
          ))}
          {/* Optional risk snapshot: hover to expand */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden cursor-help border-dashed">
                <CardHeader className="pb-1 pt-2 px-3">
                  <h3 className="text-xs font-medium text-muted-foreground truncate">
                    Risk snapshot
                  </h3>
                </CardHeader>
                <CardContent className="px-3 pb-2 pt-0">
                  <p className="text-sm font-medium text-muted-foreground tabular-nums">
                    Top 5 · Lock-in
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1.5 py-1">
                {riskSummary.map((r) => (
                  <div key={r.label} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium tabular-nums">{r.value}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

type KpiItem = {
  label: string;
  value: string;
  sub?: string;
  variant?: "positive" | "negative";
};

function KpiCard({
  kpi,
  size,
}: {
  kpi: KpiItem;
  size: "primary" | "secondary";
}) {
  const isPrimary = size === "primary";
  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
      <CardHeader className={isPrimary ? "pb-1 pt-3 px-3" : "pb-0.5 pt-2 px-3"}>
        <h3 className="text-xs font-medium text-muted-foreground truncate">
          {kpi.label}
        </h3>
      </CardHeader>
      <CardContent className={isPrimary ? "px-3 pb-3 pt-0" : "px-3 pb-2 pt-0"}>
        <p
          className={`tabular-nums truncate ${
            isPrimary ? "text-lg font-semibold" : "text-sm font-medium"
          } ${
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
