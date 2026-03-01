"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRollingPerformance } from "@/lib/store/dashboardStore";
import { createModernTheme, formatPct } from "@/lib/charts/chartTheme";

export function RollingPerformanceChart() {
  const series = useRollingPerformance();
  const option = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    const dates = series.map((p) => p.date);
    const r1y = series.map((p) => p.rolling1YXIRR);
    const r3y = series.map((p) => p.rolling3YIRR);
    const excess = series.map((p) => p.excessReturn);
    return {
      ...theme,
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params : [];
          const lines = (p as { data: number[]; axisValue: string; seriesName: string }[])
            .filter((x) => x.data[0] != null)
            .map((x) => `${x.seriesName}: ${formatPct(x.data[0])}`);
          return `${(p[0] as { axisValue: string })?.axisValue ?? ""}<br/>${lines.join("<br/>")}`;
        },
      },
      legend: { data: ["Rolling 1Y XIRR", "Rolling 3Y IRR", "Excess"], bottom: 0 },
      xAxis: { type: "category", data: dates },
      yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
      series: [
        { type: "line", name: "Rolling 1Y XIRR", data: r1y, smooth: true, symbol: "none" },
        { type: "line", name: "Rolling 3Y IRR", data: r3y, smooth: true, symbol: "none" },
        { type: "line", name: "Excess", data: excess, smooth: true, symbol: "none" },
      ],
    };
  }, [series]);

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Rolling Performance</h2>
        <p className="text-xs text-muted-foreground">Rolling 1Y XIRR, 3Y IRR, excess vs benchmark</p>
      </CardHeader>
      <CardContent>
        {series.length < 2 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
        ) : (
          <ReactECharts option={option} style={{ height: 240 }} opts={{ renderer: "canvas" }} />
        )}
      </CardContent>
    </Card>
  );
}
