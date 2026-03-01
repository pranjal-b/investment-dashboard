"use client";

import { useMemo } from "react";
import { useAllocation } from "@/lib/store/dashboardStore";
import { ASSET_COLORS, formatPct } from "@/lib/charts/chartTheme";
import { BaseChart } from "./BaseChart";

/** Horizontal bar: Target vs Actual side-by-side per asset class */
export function TargetVsActual() {
  const allocation = useAllocation();

  const option = useMemo(() => {
    const categories = allocation.map((a) => a.assetType);
    const targetData = allocation.map((a) => a.targetPct);
    const actualData = allocation.map((a) => a.actualPct);
    const colors = allocation.map((a) => ASSET_COLORS[a.assetType] ?? "#94a3b8");

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : null;
          const data = p && typeof p === "object" && "data" in p ? (p as { data: number[] }).data : [];
          if (!data.length) return "";
          return categories
            .map((cat, i) => `${cat}: Target ${formatPct(targetData[i] ?? 0)} · Actual ${formatPct(actualData[i] ?? 0)}`)
            .join("<br/>");
        },
      },
      legend: {
        data: ["Target", "Actual"],
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
      },
      grid: { left: 72, right: 24, top: 24, bottom: 48, containLabel: false },
      xAxis: {
        type: "value",
        max: 100,
        axisLabel: { formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.05)" } },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLabel: { fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: "Target",
          type: "bar",
          stack: "one",
          barWidth: "28%",
          data: targetData.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i], opacity: 0.5 },
          })),
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
        {
          name: "Actual",
          type: "bar",
          stack: "two",
          barWidth: "28%",
          data: actualData.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i] },
          })),
          itemStyle: { borderRadius: [0, 4, 4, 0] },
        },
      ],
    };
  }, [allocation]);

  if (allocation.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl text-sm text-slate-500">
        No data
      </div>
    );
  }

  return <BaseChart option={option} height={Math.max(220, allocation.length * 44)} />;
}
