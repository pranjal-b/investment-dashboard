"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useRollingPerformance } from "@/lib/store/dashboardStore";
import { createModernTheme, formatPct } from "@/lib/charts/chartTheme";
import { SLATE } from "@/lib/charts/chartTheme";

export function RollingXIRRChart() {
  const series = useRollingPerformance();

  const rollingData = useMemo(
    () =>
      series.map((p) => ({
        date: p.date,
        xirr: p.rolling1YXIRR ?? 0,
      })),
    [series]
  );

  const option = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    return {
      ...theme,
      tooltip: {
        ...(typeof theme.tooltip === "object" && theme.tooltip && !Array.isArray(theme.tooltip) ? theme.tooltip : {}),
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params : [];
          return (p as { data: number[]; axisValue: string }[])
            .map((x) => `${x.axisValue}: ${formatPct(x.data[0] ?? 0)}`)
            .join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: rollingData.map((d) => d.date),
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
          type: "line",
          data: rollingData.map((d) => d.xirr),
          smooth: true,
          lineStyle: { color: SLATE[900] },
          areaStyle: { color: SLATE[900], opacity: 0.08 },
          symbol: "none",
        },
      ],
    };
  }, [rollingData]);

  if (rollingData.length < 2) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-2xl text-sm text-slate-500">
        Insufficient transaction history for rolling XIRR
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 min-h-[240px]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <ReactECharts option={option} style={{ height: 240 }} opts={{ renderer: "canvas" }} />
    </div>
  );
}
