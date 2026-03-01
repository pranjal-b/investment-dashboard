"use client";

import { useMemo } from "react";
import { useAllocation } from "@/lib/store/dashboardStore";
import { ASSET_COLORS, formatINR, SLATE } from "@/lib/charts/chartTheme";
import { BaseChart } from "./BaseChart";

export function AllocationDonut() {
  const allocation = useAllocation();

  const totalValue = useMemo(
    () => allocation.reduce((s, a) => s + a.value, 0),
    [allocation]
  );

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        formatter: (params: { name: string; value: number; percent: number }) =>
          `${params.name}: ${params.percent.toFixed(1)}% · ${formatINR(params.value)}`,
      },
      legend: {
        bottom: 8,
        left: "center",
        type: "scroll",
        textStyle: { fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        icon: "roundRect",
      },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "45%",
          style: {
            text: formatINR(totalValue),
            fontSize: 18,
            fontWeight: 600,
            fill: SLATE[900],
          },
        },
        {
          type: "text",
          left: "center",
          top: "52%",
          style: {
            text: "Total value",
            fontSize: 11,
            fill: SLATE[600],
          },
        },
      ],
      series: [
        {
          type: "pie",
          radius: ["70%", "90%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: {
            borderRadius: 6,
            borderColor: "transparent",
          },
          emphasis: {
            scale: true,
            scaleSize: 4,
            itemStyle: { shadowBlur: 0 },
          },
          animation: false,
          data: allocation.map((a) => ({
            name: a.assetType,
            value: a.value,
            itemStyle: {
              color: ASSET_COLORS[a.assetType] ?? "#94a3b8",
            },
          })),
        },
      ],
    }),
    [allocation, totalValue]
  );

  if (allocation.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl bg-transparent text-sm text-slate-500">
        No data
      </div>
    );
  }

  return <BaseChart option={option} height={320} />;
}
