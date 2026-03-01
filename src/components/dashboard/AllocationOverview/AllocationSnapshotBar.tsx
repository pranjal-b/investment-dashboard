"use client";

import { useMemo } from "react";
import { useAllocationBuckets, useFormatINR } from "@/lib/store/dashboardStore";
import { BaseChart } from "@/components/charts/BaseChart";
import { SLATE } from "@/lib/charts/chartTheme";
import type { AllocationBucket } from "@/lib/analytics/types";

/** Colors for bucket-level segments (same order as table) */
const BUCKET_COLORS: Record<string, string> = {
  DirectEquity: "#2563EB",
  EquityMF: "#059669",
  DebtMF: "#0d9488",
  AlternativeFOF: "#7c3aed",
  PMS: "#a855f7",
  AIF: "#dc2626",
  ETF: "#d97706",
  IndexFund: "#64748b",
};

function buildOption(
  buckets: AllocationBucket[],
  formatINR: (n: number) => string
): Record<string, unknown> {
  const segments = buckets.filter((b) => b.marketValue > 0);
  if (segments.length === 0) {
    return {
      backgroundColor: "transparent",
      series: [],
    };
  }

  const data = segments.map((b) => ({
    name: b.label,
    value: b.allocationPct,
    itemStyle: { color: BUCKET_COLORS[b.bucketId] ?? SLATE[400] },
    _bucket: b,
  }));

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; data: { _bucket: AllocationBucket } };
        const b = p.data?._bucket;
        if (!b) return `${p.name}: ${p.value.toFixed(1)}%`;
        return [
          `<strong>${b.label}</strong>`,
          `Alloc %: ${b.allocationPct.toFixed(1)}%`,
          `Target %: ${b.targetPct.toFixed(1)}%`,
          `Invested: ${formatINR(b.invested)}`,
          `Market Value: ${formatINR(b.marketValue)}`,
          `P&L: ${formatINR(b.pnl)}`,
        ].join("<br/>");
      },
    },
    legend: {
      show: true,
      bottom: 0,
      left: "center",
      type: "scroll",
      textStyle: { fontSize: 12, color: SLATE[600] },
      itemWidth: 12,
      itemHeight: 12,
      icon: "roundRect",
    },
    series: [
      {
        name: "Allocation",
        type: "pie",
        radius: ["40%", "68%"],
        center: ["50%", "48%"],
        avoidLabelOverlap: true,
        labelLayout: { hideOverlap: true },
        itemStyle: {
          borderRadius: 4,
          borderColor: "transparent",
        },
        label: {
          show: true,
          position: "outside",
          formatter: (p: { name: string; percent: number }) => `${p.name}\n${p.percent.toFixed(1)}%`,
          fontSize: 12,
          color: SLATE[600],
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 16,
          lineStyle: { color: "rgba(0,0,0,0.08)" },
        },
        emphasis: {
          scale: true,
          scaleSize: 3,
          itemStyle: { shadowBlur: 0 },
        },
        data,
      },
    ],
  };
}

export function AllocationSnapshotBar() {
  const buckets = useAllocationBuckets();
  const formatINR = useFormatINR();
  const filtered = useMemo(() => buckets.filter((b) => b.marketValue > 0), [buckets]);
  const option = useMemo(() => buildOption(filtered, formatINR), [filtered, formatINR]);

  const CHART_HEIGHT = 320;

  return (
    <div className="rounded-2xl border border-border/60 bg-background shadow-sm p-6 flex flex-col h-full transition-shadow hover:shadow-md">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Allocation snapshot</h3>
        <p className="text-xs text-muted-foreground mt-0.5">By bucket, aligned with table</p>
      </div>
      <div className="flex-1 min-h-[340px]">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg bg-muted/20 text-sm text-muted-foreground h-[320px]">
            No allocation data
          </div>
        ) : (
          <BaseChart
            option={option}
            height={CHART_HEIGHT}
            className="!p-0 !shadow-none !min-h-0"
            style={{ height: CHART_HEIGHT, boxShadow: "none" }}
          />
        )}
      </div>
    </div>
  );
}
