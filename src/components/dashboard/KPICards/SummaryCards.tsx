"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioMetrics, useDashboardStore, useFormatINR } from "@/lib/store/dashboardStore";

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function SummaryCards() {
  const metrics = usePortfolioMetrics();
  const valueMode = useDashboardStore((s) => s.filters.valueMode);
  const formatINR = useFormatINR();

  const cards = useMemo(
    () => [
      {
        title: "Total Investment",
        value:
          valueMode === "absolute"
            ? formatINR(metrics.totalInvested)
            : "100%",
        subValue: valueMode === "percentage" ? formatINR(metrics.totalInvested) : undefined,
      },
      {
        title: "Current Value",
        value:
          valueMode === "absolute"
            ? formatINR(metrics.currentValue)
            : `${((metrics.currentValue / metrics.totalInvested) * 100).toFixed(1)}%`,
        subValue: valueMode === "percentage" ? formatINR(metrics.currentValue) : undefined,
      },
      {
        title: "Absolute Gain/Loss",
        value:
          valueMode === "absolute"
            ? formatINR(metrics.absoluteGain)
            : formatPercent(metrics.gainPercent),
        subValue: valueMode === "percentage" ? formatINR(metrics.absoluteGain) : formatPercent(metrics.gainPercent),
        variant: metrics.absoluteGain >= 0 ? "positive" : "negative" as const,
      },
      {
        title: "Portfolio XIRR",
        value: formatPercent(metrics.portfolioXIRR),
        subValue: "Annualized",
        variant: (metrics.portfolioXIRR ?? 0) >= 0 ? "positive" : "negative" as const,
      },
      {
        title: "Allocation Deviation",
        value: `${metrics.allocationDeviation.toFixed(1)}%`,
        subValue: "vs target",
        variant: metrics.allocationDeviation > 10 ? "negative" : "neutral" as const,
      },
    ],
    [metrics, valueMode, formatINR]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl transition-colors">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {card.title}
            </h3>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold tabular-nums ${
                card.variant === "positive"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : card.variant === "negative"
                    ? "text-red-600 dark:text-red-400"
                    : ""
              }`}
            >
              {card.value}
            </p>
            {card.subValue && (
              <p className="text-xs text-muted-foreground mt-1">
                {card.subValue}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
