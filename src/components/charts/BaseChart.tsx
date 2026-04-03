"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { createModernTheme } from "@/lib/charts/chartTheme";
import { cn } from "@/lib/utils";

/** Series types that must not inherit theme xAxis/yAxis/grid (breaks layout in ECharts 6). */
const NON_CARTESIAN_SERIES_TYPES = new Set([
  "pie",
  "sunburst",
  "treemap",
  "funnel",
  "gauge",
]);

function shouldOmitCartesianTheme(option: Record<string, unknown>): boolean {
  const series = option.series;
  const list: unknown[] = Array.isArray(series)
    ? series
    : series != null
      ? [series]
      : [];
  if (list.length === 0) return false;
  return list.every((item) => {
    const t =
      item && typeof item === "object" && "type" in item
        ? String((item as { type: string }).type)
        : "";
    return NON_CARTESIAN_SERIES_TYPES.has(t);
  });
}

interface BaseChartProps {
  option: Record<string, unknown>;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onEvents?: React.ComponentProps<typeof ReactECharts>["onEvents"];
}

/** Wrapper that merges option with centralized theme and applies minimal container styling */
export function BaseChart({
  option,
  height = 280,
  className,
  style,
  onEvents,
}: BaseChartProps) {
  const themedOption = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    const omitAxes = shouldOmitCartesianTheme(option);
    const base = omitAxes
      ? Object.fromEntries(
          Object.entries(theme).filter(
            ([k]) => k !== "xAxis" && k !== "yAxis" && k !== "grid"
          )
        )
      : theme;
    return {
      ...base,
      ...option,
      animation: false,
      animationDurationUpdate: 300,
    };
  }, [option]);

  return (
    <div
      className={cn("rounded-2xl min-h-[280px] p-6", className)}
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        ...style,
      }}
    >
      <ReactECharts
        option={themedOption}
        style={{ height }}
        opts={{ renderer: "canvas" }}
        onEvents={onEvents}
        notMerge
      />
    </div>
  );
}
