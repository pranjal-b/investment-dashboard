"use client";

import { useMemo } from "react";
import { useAllocationBuckets } from "@/lib/store/dashboardStore";
import { formatINR } from "@/lib/charts/chartTheme";
import { BaseChart } from "./BaseChart";

const COLORS = [
  "#2563EB", // Blue
  "#059669", // Emerald
  "#7C3AED", // Violet
  "#D97706", // Amber
  "#DC2626", // Red
  "#0EA5E9", // Cyan
];

export function AssetWeightagePie() {
  const buckets = useAllocationBuckets();
  const data = useMemo(
    () =>
      buckets
        .filter((b) => b.marketValue > 0)
        .map((b, i) => ({
          name: b.label,
          value: b.marketValue,
          invested: b.invested,
          current: b.marketValue,
          itemStyle: { color: COLORS[i % COLORS.length] },
        })),
    [buckets]
  );

  const option = useMemo(
    () => ({
      backgroundColor: "#ffffff",
      tooltip: {
        trigger: "item",
        backgroundColor: "#1E293B",
        borderWidth: 0,
        padding: [12, 16],
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: {
          name: string;
          percent: number;
          data: { invested: number; current: number };
        }) => {
          const d = params.data;
          return [
            `<strong>${params.name}</strong>`,
            `Weight: ${params.percent.toFixed(1)}%`,
            `Invested: ${formatINR(d.invested)}`,
            `Current: ${formatINR(d.current)}`,
          ].join("<br/>");
        },
      },
      graphic: [
        {
          type: "circle",
          left: "center",
          top: "58%",
          shape: { r: 120 },
          style: { fill: "rgba(0,0,0,0.03)" },
        },
      ],
      series: [
        {
          name: "Asset Weightage",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          avoidLabelOverlap: true,
          data,

          itemStyle: {
            borderRadius: 6,
            borderColor: "#fff",
            borderWidth: 1,
            shadowBlur: 15,
            shadowColor: "rgba(0,0,0,0.08)",
          },

          label: {
            show: true,
            fontSize: 13,
            fontWeight: 500,
            color: "#334155",
            formatter: (params: { name: string; percent: number }) =>
              `${params.name}\n${params.percent.toFixed(1)}%`,
          },

          labelLine: {
            show: true,
            length: 15,
            length2: 25,
            smooth: true,
            lineStyle: {
              width: 1,
              color: "#CBD5E1",
            },
          },

          emphasis: {
            scale: true,
            scaleSize: 4,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: "rgba(0,0,0,0.12)",
            },
          },
          labelLayout: { hideOverlap: true },
        },
      ],
    }),
    [data]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-white text-sm text-slate-500 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        No data
      </div>
    );
  }

  return <BaseChart option={option} height={320} />;
}
