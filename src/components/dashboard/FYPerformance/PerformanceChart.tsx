"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { usePerformanceChartData, useFormatINR } from "@/lib/store/dashboardStore";
import { createModernTheme, formatPct, CHART_CONTAINER_CLASS } from "@/lib/charts/chartTheme";
import type { PerformanceChartData as ChartData } from "@/lib/performance/types";

const PORTFOLIO_COLOR = "#2563EB";
const BENCHMARK_COLORS = ["#64748b", "#94a3b8", "#475569", "#334155"];
const SEGMENT_COLORS = ["#2563EB", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#65a30d", "#4f46e5"];

function buildChartOption(
  data: ChartData | null,
  formatValue: (value: number) => string
) {
  if (!data || data.xAxisPeriods.length === 0) {
    return { ...createModernTheme(), xAxis: { type: "category", data: [] }, yAxis: {}, series: [] };
  }

  const theme = createModernTheme() as Record<string, unknown>;
  const { xAxisPeriods, portfolio, benchmarks, segmentSeries, yAxisMode } = data;
  const useSegmentView = segmentSeries != null && segmentSeries.length > 0;

  const usePctAxis = yAxisMode === "return";
  const useValueAxis = yAxisMode === "value";
  const yAxisLabel = (value: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "";
    return useValueAxis ? formatValue(value) : String(value);
  };

  const tooltipFormatter = (params: unknown) => {
    const p = Array.isArray(params) ? params : [];
    if (p.length === 0) return "";
    const axisValue = (p[0] as { axisValue: string })?.axisValue ?? "";
    const idx = xAxisPeriods.indexOf(axisValue);
    if (idx < 0) return axisValue;

    const lines: string[] = [];
    const seriesToShow = useSegmentView ? segmentSeries! : [portfolio, ...benchmarks];

    seriesToShow.forEach((s) => {
      const val = s.values[idx];
      const ret = s.periodReturnsPct?.[idx];
      if (val != null) {
        if (useValueAxis) lines.push(`${s.name}: ${formatValue(val)}`);
        else if (usePctAxis) lines.push(`${s.name}: ${formatPct(val)}%`);
        else lines.push(`${s.name}: ${val.toFixed(1)}`);
      }
      if (ret != null && !usePctAxis) lines.push(`${s.name} return: ${formatPct(ret)}%`);
      if (!useSegmentView && s.id !== "portfolio" && ret != null && portfolio.periodReturnsPct?.[idx] != null) {
        const alpha = portfolio.periodReturnsPct[idx]! - ret;
        lines.push(`Alpha vs ${s.name}: ${formatPct(alpha)}%`);
      }
    });

    return `${axisValue}<br/>${lines.join("<br/>")}`;
  };

  let series: { type: string; name: string; data: (number | null)[]; smooth: boolean; symbol: string; lineStyle?: { width: number }; itemStyle?: { color: string }; areaStyle?: unknown }[];

  if (useSegmentView) {
    series = segmentSeries!.map((s, i) => ({
      type: "line" as const,
      name: s.name,
      data: s.values,
      smooth: true,
      symbol: "none",
      lineStyle: { width: i === 0 ? 3 : 1.5 },
      itemStyle: { color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] },
      ...(i === 0 ? { areaStyle: { color: "rgba(37, 99, 235, 0.08)" } } : {}),
    }));
  } else {
    series = [
      {
        type: "line",
        name: portfolio.name,
        data: portfolio.values,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 3 },
        itemStyle: { color: PORTFOLIO_COLOR },
        areaStyle: { color: "rgba(37, 99, 235, 0.08)" },
      },
    ];
    benchmarks.forEach((b, i) => {
      series.push({
        type: "line",
        name: b.name,
        data: b.values,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 1.5 },
        itemStyle: { color: BENCHMARK_COLORS[i % BENCHMARK_COLORS.length] },
      });
    });
  }

  const legendData = useSegmentView ? segmentSeries!.map((s) => s.name) : [portfolio.name, ...benchmarks.map((b) => b.name)];

  return {
    ...theme,
    tooltip: {
      trigger: "axis",
      formatter: tooltipFormatter,
    },
    legend: {
      data: legendData,
      bottom: 0,
      type: "scroll",
    },
    xAxis: { type: "category", data: xAxisPeriods },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) =>
          usePctAxis ? `${value}%` : useValueAxis ? yAxisLabel(value) : String(value),
      },
    },
    series,
  };
}

export function PerformanceChart() {
  const data = usePerformanceChartData();
  const formatINRByUnits = useFormatINR();
  const option = useMemo(
    () => buildChartOption(data, formatINRByUnits),
    [data, formatINRByUnits]
  );

  return (
    <div className={`min-h-[280px] w-full ${CHART_CONTAINER_CLASS}`}>
      {data && data.xAxisPeriods.length > 0 ? (
        <ReactECharts
          option={option}
          style={{ height: 320 }}
          opts={{ renderer: "canvas" }}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-12 text-center">No data for selected FY and scope</p>
      )}
    </div>
  );
}
