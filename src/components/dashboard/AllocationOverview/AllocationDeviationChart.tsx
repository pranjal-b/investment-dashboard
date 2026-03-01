"use client";

import { useMemo } from "react";
import { useAllocationBuckets } from "@/lib/store/dashboardStore";
import { BaseChart } from "@/components/charts/BaseChart";
import { DEVIATION_COLORS, SLATE } from "@/lib/charts/chartTheme";

const DEVIATION_THRESHOLD_PCT = 1.5;

/** Short labels for y-axis to avoid overlap; full name in tooltip */
const BUCKET_ABBREV: Record<string, string> = {
  DirectEquity: "Direct Eq",
  EquityMF: "Eq MF",
  DebtMF: "Debt MF",
  AlternativeFOF: "Alt FOF",
  PMS: "PMS",
  AIF: "AIF",
  ETF: "ETF",
  IndexFund: "Index",
};

export function AllocationDeviationChart() {
  const buckets = useAllocationBuckets();
  const filtered = useMemo(
    () =>
      [...buckets]
        .filter((b) => b.marketValue > 0)
        .sort((a, b) => Math.abs(b.residualPct) - Math.abs(a.residualPct)),
    [buckets]
  );

  const option = useMemo(() => {
    if (filtered.length === 0) {
      return {
        backgroundColor: "transparent",
        grid: { left: 80, right: 80, top: 24, bottom: 32 },
        xAxis: { type: "value", min: -20, max: 20, show: true },
        yAxis: { type: "category", data: [], show: true },
        series: [],
      };
    }

    const categories = filtered.map((b) => BUCKET_ABBREV[b.bucketId] ?? b.label);
    const data = filtered.map((b) => {
      const dev = b.residualPct;
      const within = Math.abs(dev) <= DEVIATION_THRESHOLD_PCT;
      const color = within
        ? DEVIATION_COLORS.within
        : dev > 0
          ? DEVIATION_COLORS.overweight
          : DEVIATION_COLORS.underweight;
      const labelInside = Math.abs(dev) >= 3;
      return {
        value: dev,
        itemStyle: { color },
        label: {
          show: true,
          position: labelInside ? "inside" : (dev >= 0 ? "right" : "left"),
          formatter: () => `${dev >= 0 ? "+" : ""}${dev.toFixed(1)}%`,
          fontSize: 12,
          color: labelInside ? "#fff" : SLATE[600],
          fontWeight: labelInside ? 500 : 400,
          distance: labelInside ? 0 : 4,
        },
      };
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const parts: string[] = [];
          (params as { data: { value: number }; name: string }[]).forEach((item, i) => {
            const bucket = filtered[i];
            const v = item.data?.value;
            if (bucket != null && typeof v === "number")
              parts.push(
                `<strong>${bucket.label}</strong><br/>` +
                  `Residual %: ${v >= 0 ? "+" : ""}${v.toFixed(1)}%<br/>` +
                  `Alloc %: ${bucket.allocationPct.toFixed(1)}% · Target %: ${bucket.targetPct.toFixed(1)}%`
              );
          });
          return parts.join("<br/>");
        },
      },
      grid: { left: 72, right: 52, top: 24, bottom: 32, containLabel: false },
      xAxis: {
        type: "value",
        min: -20,
        max: 20,
        axisLabel: { formatter: "{value}%", fontSize: 12, color: SLATE[600] },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.06)" } },
        axisLine: {
          show: true,
          lineStyle: { width: 1.5, color: "rgba(0,0,0,0.2)" },
        },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLabel: { fontSize: 12, color: SLATE[600] },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data,
          barWidth: "56%",
          barGap: "-100%",
          itemStyle: { borderRadius: [0, 2, 2, 0] },
        },
      ],
    };
  }, [filtered]);

  const CHART_HEIGHT = 320;

  return (
    <div className="rounded-2xl border border-border/60 bg-background shadow-sm p-6 flex flex-col h-full transition-shadow hover:shadow-md">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Deviation & rebalance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Overweight (right) vs underweight (left) vs target</p>
      </div>
      <div className="flex-1 min-h-[340px]">
        <BaseChart
          option={option}
          height={CHART_HEIGHT}
          className="!p-0 !shadow-none !min-h-0"
          style={{ height: CHART_HEIGHT, boxShadow: "none" }}
        />
      </div>
    </div>
  );
}
