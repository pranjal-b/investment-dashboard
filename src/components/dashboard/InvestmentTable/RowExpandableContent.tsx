"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { Holding } from "@/lib/types";
import { computeAssetMetrics } from "@/lib/calculations/metrics";
import { useDashboardStore } from "@/lib/store/dashboardStore";

function formatChartDate(iso: string): string {
  const d = new Date(iso);
  const m = d.toLocaleString("en-IN", { month: "short" });
  const y = String(d.getFullYear()).slice(-2);
  return `${m} ${y}`;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

interface RowExpandableContentProps {
  holding: Holding;
}

export function RowExpandableContent({ holding }: RowExpandableContentProps) {
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const metrics = useMemo(
    () => computeAssetMetrics(holding, dateRange ?? undefined),
    [holding, dateRange]
  );

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
      grid: {
        left: 12,
        right: 12,
        top: 12,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: cashflowData.map((c) => formatChartDate(c.date)),
        axisLine: { show: true, lineStyle: { color: "rgba(0,0,0,0.06)", width: 1 } },
        axisLabel: { color: "#64748b", fontSize: 10, interval: "auto" },
        splitLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.05)", width: 1 } },
        axisTick: { show: false },
      },
      series: [
        {
          name: "Cumulative",
          type: "line",
          data: cashflowData.map((c) => c.cumulative),
          smooth: true,
          lineStyle: { width: 2, color: "#0f172a" },
          areaStyle: { color: "rgba(15,23,42,0.06)" },
          symbol: "circle",
          symbolSize: 4,
          showSymbol: cashflowData.length <= 24,
        },
      ],
    }),
    [cashflowData]
  );

  const benchmarkMeta = useMemo(() => {
    const bh = holding.benchmarkHistory ?? [];
    if (bh.length < 2) return null;
    const first = bh[0].value;
    const last = bh[bh.length - 1].value;
    const benchmarkReturnPct = first !== 0 ? ((last - first) / first) * 100 : 0;
    const alphaPct = metrics.xirrPct != null ? metrics.xirrPct - benchmarkReturnPct : null;
    return { benchmarkReturnPct, alphaPct };
  }, [holding.benchmarkHistory, metrics.xirrPct]);

  const benchmarkOption = useMemo(() => {
    const bh = holding.benchmarkHistory ?? [];
    if (bh.length < 2) return null;
    const labels = bh.map((b) => formatChartDate(b.date));
    return {
      tooltip: { trigger: "axis" },
      grid: {
        left: 12,
        right: 12,
        top: 12,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { show: true, lineStyle: { color: "rgba(0,0,0,0.06)", width: 1 } },
        axisLabel: { color: "#64748b", fontSize: 10, interval: "auto" },
        splitLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.05)", width: 1 } },
        axisTick: { show: false },
      },
      series: [
        {
          name: holding.benchmark,
          type: "line",
          data: bh.map((b) => b.value),
          smooth: true,
          lineStyle: { width: 2, color: "#0f172a" },
          symbol: "circle",
          symbolSize: 4,
          showSymbol: bh.length <= 24,
        },
      ],
    };
  }, [holding.benchmarkHistory, holding.benchmark]);

  const chartHeight = 200;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
        <h4 className="text-sm font-medium text-slate-800 mb-2 border-b border-slate-100 pb-2">
          Cashflow Timeline
        </h4>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-500">Total Invested</p>
            <p className="text-sm font-medium text-slate-800 tabular-nums">
              {formatINR(holding.investedAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Value</p>
            <p className="text-sm font-medium text-slate-800 tabular-nums">
              {formatINR(holding.currentValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">XIRR</p>
            <p className="text-sm font-medium text-slate-800 tabular-nums">
              {formatPct(metrics.xirrPct)}
            </p>
          </div>
        </div>
        <div className="h-[200px] min-h-[200px]">
          <ReactECharts
            option={cashflowChartOption}
            style={{ height: chartHeight }}
            opts={{ renderer: "canvas" }}
          />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
        <h4 className="text-sm font-medium text-slate-800 mb-2 border-b border-slate-100 pb-2">
          Benchmark: {holding.benchmark ?? "—"}
        </h4>
        {benchmarkMeta && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-slate-500">Benchmark Return</p>
              <p className="text-sm font-medium text-slate-800 tabular-nums">
                {formatPct(benchmarkMeta.benchmarkReturnPct)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Alpha vs Benchmark</p>
              <p className="text-sm font-medium text-slate-800 tabular-nums">
                {formatPct(benchmarkMeta.alphaPct)}
              </p>
            </div>
          </div>
        )}
        {benchmarkOption ? (
          <div className="h-[200px] min-h-[200px]">
            <ReactECharts
              option={benchmarkOption}
              style={{ height: chartHeight }}
              opts={{ renderer: "canvas" }}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-6">No benchmark history</p>
        )}
      </div>
    </div>
  );
}
