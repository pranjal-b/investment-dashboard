"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { createModernTheme } from "@/lib/charts/chartTheme";
import { cn } from "@/lib/utils";

interface BaseChartProps {
  option: Record<string, unknown>;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Wrapper that merges option with centralized theme and applies minimal container styling */
export function BaseChart({
  option,
  height = 280,
  className,
  style,
}: BaseChartProps) {
  const themedOption = useMemo(() => {
    const theme = createModernTheme();
    return {
      ...theme,
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
        notMerge
      />
    </div>
  );
}
