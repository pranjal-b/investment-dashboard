"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useFilteredHoldings } from "@/lib/store/dashboardStore";

export function GainWaterfall() {
  const holdings = useFilteredHoldings();

  const data = useMemo(() => {
    const contributions = holdings
      .map((h) => ({
        name: h.assetName.length > 20 ? h.assetName.slice(0, 20) + "…" : h.assetName,
        value: h.currentValue - h.investedAmount,
      }))
      .filter((c) => Math.abs(c.value) > 100)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    const totalGain = contributions.reduce((s, c) => s + c.value, 0);

    const waterfall: { name: string; value: number; itemStyle?: { color: string } }[] = [
      { name: "Start", value: 0 },
      ...contributions.map((c) => ({
        name: c.name,
        value: c.value,
        itemStyle: {
          color: c.value >= 0 ? "#059669" : "#dc2626",
        },
      })),
      {
        name: "Total",
        value: totalGain,
        itemStyle: { color: totalGain >= 0 ? "#2563eb" : "#dc2626" },
      },
    ];

    return waterfall;
  }, [holdings]);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        formatter: (params: { data: number[]; axisValue: string }[]) =>
          params
            .map((p) => {
              const val = p.data[0] ?? 0;
              return `${p.axisValue}: ₹${(val / 1e5).toFixed(1)}L`;
            })
            .join("<br/>"),
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisLabel: {
          rotate: 45,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (v: number) => `₹${(v / 1e5).toFixed(0)}L`,
        },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => ({
            value: d.value,
            itemStyle: d.itemStyle,
          })),
          barWidth: "60%",
        },
      ],
    }),
    [data]
  );

  if (holdings.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
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
