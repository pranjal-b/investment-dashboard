"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useAllocation } from "@/lib/store/dashboardStore";

const COLORS = ["#2563eb", "#94a3b8"];

export function TargetVsActualDonut() {
  const allocation = useAllocation();

  const actualData = useMemo(
    () =>
      allocation.map((a) => ({
        name: `${a.assetType} (Actual)`,
        value: a.actualPct,
      })),
    [allocation]
  );

  const targetData = useMemo(
    () =>
      allocation.map((a) => ({
        name: `${a.assetType} (Target)`,
        value: a.targetPct,
      })),
    [allocation]
  );

  const option = useMemo(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0, type: "scroll" },
      series: [
        {
          name: "Actual",
          type: "pie",
          radius: ["0%", "45%"],
          center: ["50%", "45%"],
          data: actualData,
          itemStyle: { color: COLORS[0] },
          label: { show: false },
        },
        {
          name: "Target",
          type: "pie",
          radius: ["55%", "75%"],
          center: ["50%", "45%"],
          data: targetData,
          itemStyle: { color: COLORS[1] },
          label: { show: false },
        },
      ],
    }),
    [actualData, targetData]
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
