"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useAllocation } from "@/lib/store/dashboardStore";

export function ResidualDonut() {
  const allocation = useAllocation();

  const data = useMemo(
    () =>
      allocation.map((a) => ({
        name: a.assetType,
        value: a.residualPct,
        itemStyle: {
          color: a.residualPct >= 0 ? "#059669" : "#dc2626",
        },
      })),
    [allocation]
  );

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        formatter: (p: { name: string; value: number }) =>
          `${p.name}: ${p.value >= 0 ? "+" : ""}${p.value.toFixed(1)}%`,
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data,
          label: {
            formatter: "{b}\n{d}%",
          },
          emphasis: {
            itemStyle: { shadowBlur: 10 },
          },
        },
      ],
    }),
    [data]
  );

  if (allocation.length === 0) {
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
