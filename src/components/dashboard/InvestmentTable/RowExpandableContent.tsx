"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { Holding } from "@/lib/types";

interface RowExpandableContentProps {
  holding: Holding;
}

export function RowExpandableContent({ holding }: RowExpandableContentProps) {

  const cashflowData = useMemo(() => {
    const sorted = [...holding.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let cumulative = 0;
    return sorted.map((t) => {
      cumulative += t.amount;
      return {
        date: t.date,
        amount: t.amount,
        cumulative,
      };
    });
  }, [holding.transactions]);

  const cashflowChartOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        formatter: (params: { data: number[]; axisValue: string }[]) =>
          params
            .map(
              (p, i) =>
                `${p.axisValue}: ₹${(p.data[i] ?? 0).toLocaleString("en-IN")}`
            )
            .join("<br/>"),
      },
      xAxis: {
        type: "category",
        data: cashflowData.map((c) => c.date.slice(0, 10)),
      },
      yAxis: { type: "value" },
      series: [
        {
          name: "Cumulative",
          type: "line",
          data: cashflowData.map((c) => c.cumulative),
          smooth: true,
        },
      ],
    }),
    [cashflowData]
  );

  const benchmarkOption = useMemo(() => {
    const bh = holding.benchmarkHistory ?? [];
    if (bh.length < 2) return null;
    return {
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: bh.map((b) => b.date.slice(0, 10)),
      },
      yAxis: { type: "value" },
      series: [
        {
          name: holding.benchmark,
          type: "line",
          data: bh.map((b) => b.value),
          smooth: true,
        },
      ],
    };
  }, [holding.benchmarkHistory, holding.benchmark]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Cashflow Timeline</h4>
        <ReactECharts
          option={cashflowChartOption}
          style={{ height: 200 }}
          opts={{ renderer: "canvas" }}
        />
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">
          Benchmark: {holding.benchmark}
        </h4>
        {benchmarkOption ? (
          <ReactECharts
            option={benchmarkOption}
            style={{ height: 200 }}
            opts={{ renderer: "canvas" }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No benchmark history</p>
        )}
      </div>
    </div>
  );
}
