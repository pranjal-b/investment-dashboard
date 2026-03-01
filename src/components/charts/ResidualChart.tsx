"use client";

import { useMemo } from "react";
import { useAllocation } from "@/lib/store/dashboardStore";
import { SEMANTIC, formatPct } from "@/lib/charts/chartTheme";
import { BaseChart } from "./BaseChart";

/** Minimal bar chart: deviation % only (analytical, not decorative) */
export function ResidualChart() {
  const allocation = useAllocation();

  const option = useMemo(() => {
    const data = allocation.map((a) => ({
      name: a.assetType,
      value: a.residualPct,
      itemStyle: {
        color: a.residualPct >= 0 ? SEMANTIC.positive : SEMANTIC.negative,
      },
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: { name: string; value: number }) =>
          `${p.name}: ${p.value >= 0 ? "+" : ""}${formatPct(p.value)}`,
      },
      grid: { left: 72, right: 24, top: 16, bottom: 24, containLabel: false },
      xAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.05)" } },
        axisLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: allocation.map((a) => a.assetType),
        axisLabel: { fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data,
          barWidth: "48%",
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          emphasis: { focus: "self" },
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

  return <BaseChart option={option} height={Math.max(200, allocation.length * 40)} />;
}
