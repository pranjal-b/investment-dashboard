"use client";

import { useMemo } from "react";
import { BaseChart } from "@/components/charts/BaseChart";
import { useSectorExposure, useFormatINR } from "@/lib/store/dashboardStore";
import { CHART_COLORS } from "@/lib/charts/chartTheme";

const SECTOR_COLORS = [
  ...CHART_COLORS,
  "#0EA5E9", // sky
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
];

export function SectorDonut() {
  const sectorExposure = useSectorExposure();
  const formatINR = useFormatINR();
  const data = useMemo(
    () =>
      sectorExposure.map((s, i) => ({
        name: s.sector,
        value: s.value,
        pct: s.pct,
        itemStyle: { color: SECTOR_COLORS[i % SECTOR_COLORS.length] },
      })),
    [sectorExposure]
  );

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15,23,42,0.92)",
        borderWidth: 0,
        padding: [10, 14],
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: {
          name: string;
          percent: number;
          data: { value: number };
        }) =>
          [
            `<strong>${params.name}</strong>`,
            `${params.percent.toFixed(1)}%`,
            formatINR(params.data.value),
          ].join("<br/>"),
      },
      series: [
        {
          name: "Sector",
          type: "pie",
          radius: ["40%", "65%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          data,
          itemStyle: {
            borderRadius: 4,
            borderColor: "#fff",
            borderWidth: 1,
          },
          label: {
            show: true,
            fontSize: 11,
            color: "#475569",
            formatter: (params: { name: string; percent: number }) =>
              `${params.name}\n${params.percent.toFixed(1)}%`,
          },
          labelLine: {
            show: true,
            length: 8,
            length2: 12,
            lineStyle: { width: 1, color: "#cbd5e1" },
          },
          emphasis: {
            scale: true,
            scaleSize: 3,
            itemStyle: { borderColor: "#fff", borderWidth: 2 },
          },
          labelLayout: { hideOverlap: true },
        },
      ],
    }),
    [data, formatINR]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
        No sector data
      </div>
    );
  }

  return <BaseChart option={option} height={280} />;
}
