"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useMarketCapExposure } from "@/lib/store/dashboardStore";

const COLORS = ["#2563eb", "#059669", "#d97706"];

export function MarketCapBarChart() {
  const marketCapExposure = useMarketCapExposure();

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        formatter: (params: { name: string; value: number }[]) =>
          params
            .map(
              (p) =>
                `${p.name}: ${p.value.toFixed(1)}%`
            )
            .join("<br/>"),
      },
      xAxis: {
        type: "category",
        data: marketCapExposure.map((m) => m.marketCap),
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%" },
      },
      series: [
        {
          type: "bar",
          data: marketCapExposure.map((m, i) => ({
            value: m.pct,
            itemStyle: { color: COLORS[i % COLORS.length] },
          })),
          barWidth: "50%",
        },
      ],
    }),
    [marketCapExposure]
  );

  if (marketCapExposure.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 280 }}
      opts={{ renderer: "canvas" }}
    />
  );
}
