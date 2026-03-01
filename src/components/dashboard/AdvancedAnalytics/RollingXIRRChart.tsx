"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useFilteredHoldings } from "@/lib/store/dashboardStore";
import { subMonths, format } from "date-fns";
import { aggregateCashflows } from "@/lib/calculations/xirr";
import xirr from "xirr";
import { createModernTheme, formatPct, SLATE } from "@/lib/charts/chartTheme";

export function RollingXIRRChart() {
  const holdings = useFilteredHoldings();

  const rollingData = useMemo(() => {
    const cashflows = aggregateCashflows(holdings).map((c) => ({
      amount: c.amount,
      when: new Date(c.date),
    }));

    if (cashflows.length < 2) return [];

    const endDate = new Date();
    const startDate = subMonths(endDate, 24);
    const points: { date: string; xirr: number }[] = [];

    let d = new Date(startDate);
    while (d <= endDate) {
      const filtered = cashflows.filter((c) => c.when <= d);
      if (filtered.length >= 2) {
        try {
          const rate = xirr(filtered);
          points.push({
            date: format(d, "yyyy-MM"),
            xirr: rate * 100,
          });
        } catch {
          points.push({ date: format(d, "yyyy-MM"), xirr: 0 });
        }
      }
      d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }

    return points;
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
