"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioMetrics } from "@/lib/store/dashboardStore";
import { useDashboardStore } from "@/lib/store/dashboardStore";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function SummaryCards() {
  const metrics = usePortfolioMetrics();
  const valueMode = useDashboardStore((s) => s.filters.valueMode);

  const cards = useMemo(
    () => [
      {
        title: "Total Investment",
        value:
          valueMode === "absolute"
            ? formatCurrency(metrics.totalInvested)
            : "100%",
        subValue: valueMode === "percentage" ? formatCurrency(metrics.totalInvested) : undefined,
      },
      {
        title: "Current Value",
        value:
          valueMode === "absolute"
            ? formatCurrency(metrics.currentValue)
            : `${((metrics.currentValue / metrics.totalInvested) * 100).toFixed(1)}%`,
        subValue: valueMode === "percentage" ? formatCurrency(metrics.currentValue) : undefined,
      },
      {
        title: "Absolute Gain/Loss",
        value:
          valueMode === "absolute"
            ? formatCurrency(metrics.absoluteGain)
            : formatPercent(metrics.gainPercent),
        subValue: valueMode === "percentage" ? formatCurrency(metrics.absoluteGain) : formatPercent(metrics.gainPercent),
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
    [metrics, valueMode]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="transition-colors">
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
