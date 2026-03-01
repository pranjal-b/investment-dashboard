"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useFilteredHoldings } from "@/lib/store/dashboardStore";
import { subMonths, format } from "date-fns";
import { aggregateCashflows } from "@/lib/calculations/xirr";
import xirr from "xirr";

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

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        formatter: (params: { data: number[]; axisValue: string }[]) =>
          params
            .map((p) => `${p.axisValue}: ${(p.data[0] ?? 0).toFixed(2)}%`)
            .join("<br/>"),
      },
      xAxis: {
        type: "category",
        data: rollingData.map((d) => d.date),
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%" },
      },
      series: [
        {
          type: "line",
          data: rollingData.map((d) => d.xirr),
          smooth: true,
          areaStyle: { opacity: 0.2 },
        },
      ],
    }),
    [rollingData]
  );

  if (rollingData.length < 2) {
    return (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
        Insufficient transaction history for rolling XIRR
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 240 }}
      opts={{ renderer: "canvas" }}
    />
  );
}
