"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useAllocation } from "@/lib/store/dashboardStore";

const COLORS = [
  "#2563eb", "#059669", "#7c3aed", "#dc2626", "#d97706",
  "#0891b2", "#4f46e5", "#db2777",
];

export function AssetClassDonut() {
  const allocation = useAllocation();

  const option = useMemo(() => ({
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: "transparent",
        },
        label: {
          show: true,
          formatter: "{b}\n{d}%",
        },
        emphasis: {
          label: { show: true },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0 },
        },
        data: allocation.map((a, i) => ({
          name: a.assetType,
          value: a.value,
          itemStyle: { color: COLORS[i % COLORS.length] },
        })),
      },
    ],
  }), [allocation]);

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
