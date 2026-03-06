"use client";

import { useMemo } from "react";
import { BaseChart } from "@/components/charts/BaseChart";
import { useMarketCapExposure, useFormatINR } from "@/lib/store/dashboardStore";
import type { MarketCap } from "@/lib/types";

const MARKET_CAP_COLORS: Record<MarketCap, string> = {
  Large: "#2563EB",  // blue
  Mid: "#D97706",   // amber
  Small: "#64748b", // slate
};

const ORDER: MarketCap[] = ["Large", "Mid", "Small"];

export function MarketCapDonut() {
  const marketCapExposure = useMarketCapExposure();
  const formatINR = useFormatINR();
  const data = useMemo(() => {
    const byCap = new Map(marketCapExposure.map((m) => [m.marketCap, m]));
    return ORDER.filter((cap) => (byCap.get(cap)?.value ?? 0) > 0).map(
      (marketCap) => {
        const item = byCap.get(marketCap)!;
        return {
          name: marketCap,
          value: item.value,
          pct: item.pct,
          itemStyle: { color: MARKET_CAP_COLORS[marketCap] },
        };
      }
    );
  }, [marketCapExposure]);

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
          name: "Market Cap",
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
        No market cap data
      </div>
    );
  }

  return <BaseChart option={option} height={280} />;
}
