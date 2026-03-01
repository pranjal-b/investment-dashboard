"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useMarketCapExposure } from "@/lib/store/dashboardStore";
import { createModernTheme, CHART_COLORS, formatPct } from "@/lib/charts/chartTheme";

export function MarketCapBarChart() {
  const marketCapExposure = useMarketCapExposure();

  const option = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    return {
      ...theme,
      tooltip: {
        ...(theme.tooltip as object),
        trigger: "item",
        formatter: (p: { name: string; value: number }) =>
          `${p.name}: ${formatPct(p.value ?? 0)}`,
      },
      xAxis: {
        type: "category",
        data: marketCapExposure.map((m) => m.marketCap),
        axisLine: { lineStyle: { color: "rgba(0,0,0,0.08)" } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.05)" } },
      },
      series: [
        {
          type: "bar",
          data: marketCapExposure.map((m, i) => ({
            value: m.pct,
            itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], borderRadius: [4, 4, 0, 0] },
          })),
          barWidth: "48%",
        },
      ],
    };
  }, [marketCapExposure]);

  if (marketCapExposure.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl text-sm text-slate-500">
        No data
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 min-h-[280px]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <ReactECharts option={option} style={{ height: 280 }} opts={{ renderer: "canvas" }} />
    </div>
  );
}
