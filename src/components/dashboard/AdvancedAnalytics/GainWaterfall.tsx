"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useFilteredHoldings } from "@/lib/store/dashboardStore";
import { createModernTheme, SEMANTIC, formatINR, SLATE } from "@/lib/charts/chartTheme";

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
          color: c.value >= 0 ? SEMANTIC.positive : SEMANTIC.negative,
        },
      })),
      {
        name: "Total",
        value: totalGain,
        itemStyle: { color: totalGain >= 0 ? SLATE[900] : SEMANTIC.negative },
      },
    ];

    return waterfall;
  }, [holdings]);

  const option = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    return {
      ...theme,
      tooltip: {
        ...(theme.tooltip as object),
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params : [];
          return (p as { data: number[]; axisValue: string }[])
            .map((x) => `${x.axisValue}: ${formatINR(x.data[0] ?? 0)}`)
            .join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisLabel: { rotate: 45, interval: 0, fontSize: 11 },
        axisLine: { lineStyle: { color: "rgba(0,0,0,0.08)" } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: (v: number) => formatINR(v) },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.05)" } },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => ({ value: d.value, itemStyle: d.itemStyle })),
          barWidth: "56%",
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [data]);

  if (holdings.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-2xl text-sm text-slate-500">
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
