"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { BaseChart } from "@/components/charts/BaseChart";
import type { PolicyAllocationTreeNode } from "@/lib/analytics/policyAllocationTree";
import { useFormatINR, usePolicyAllocationTree } from "@/lib/store/dashboardStore";
import { CHART_COLORS, SLATE } from "@/lib/charts/chartTheme";

const DONUT_COLORS = [
  ...CHART_COLORS,
  "#0EA5E9",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#CA8A04",
  "#0891B2",
];

type PieDatum = {
  name: string;
  value: number;
  pathKey: string;
  drillable: boolean;
  allocPct: number;
  targetPct: number;
  itemStyle: { color: string };
};

export function AllocationPctDonutChart() {
  const tree = usePolicyAllocationTree();
  const formatINR = useFormatINR();
  const [stack, setStack] = useState<PolicyAllocationTreeNode[]>([]);

  const currentParent = stack.length > 0 ? stack[stack.length - 1] : null;
  const sourceNodes = useMemo(() => {
    if (stack.length === 0) return tree;
    const last = stack[stack.length - 1];
    return last?.children ?? [];
  }, [tree, stack]);

  const visibleNodes = useMemo(
    () =>
      [...sourceNodes]
        .filter((n) => n.marketValue > 0)
        .sort((a, b) => b.allocationPct - a.allocationPct),
    [sourceNodes]
  );

  const pieData: PieDatum[] = useMemo(
    () =>
      visibleNodes.map((n, i) => ({
        name: n.label,
        value: n.marketValue,
        pathKey: n.pathKey,
        drillable: n.children.some((c) => c.marketValue > 0),
        allocPct: n.allocationPct,
        targetPct: n.targetPct,
        itemStyle: { color: DONUT_COLORS[i % DONUT_COLORS.length] },
      })),
    [visibleNodes]
  );

  const centerLines = useMemo(() => {
    if (currentParent) {
      return {
        primary: `${currentParent.allocationPct.toFixed(1)}%`,
        secondary: currentParent.label,
        tertiary: formatINR(currentParent.marketValue),
      };
    }
    const totalMv = visibleNodes.reduce((s, n) => s + n.marketValue, 0);
    return {
      primary: "100%",
      secondary: "Portfolio",
      tertiary: formatINR(totalMv),
    };
  }, [currentParent, visibleNodes, formatINR]);

  const option = useMemo(() => {
    if (pieData.length === 0) {
      return {
        backgroundColor: "transparent",
        series: [{ type: "pie", data: [] }],
      };
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: {
          name: string;
          percent: number;
          data: PieDatum;
        }) => {
          const d = params.data;
          if (!d) return "";
          const drill = d.drillable ? "<br/><span style=\"opacity:0.85\">Click to break down</span>" : "";
          return (
            `<strong>${params.name}</strong><br/>` +
            `Alloc: <strong>${d.allocPct.toFixed(1)}%</strong> of portfolio<br/>` +
            `Target: ${d.targetPct.toFixed(1)}%<br/>` +
            `MV: ${formatINR(d.value)} · ${params.percent.toFixed(1)}% of this view` +
            drill
          );
        },
      },
      series: [
        {
          type: "pie",
          radius: ["52%", "78%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          minAngle: 2,
          data: pieData,
          itemStyle: {
            borderRadius: 4,
            borderColor: "rgba(255,255,255,0.85)",
            borderWidth: 1,
          },
          label: {
            show: true,
            fontSize: 11,
            color: SLATE[600],
            formatter: (p: { name: string; percent: number }) =>
              `${p.name}\n${p.percent.toFixed(1)}%`,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 12,
            lineStyle: { width: 1, color: "#cbd5e1" },
          },
          emphasis: {
            scale: true,
            scaleSize: 4,
            itemStyle: { borderWidth: 2 },
          },
          labelLayout: { hideOverlap: true },
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "42%",
          style: {
            text: centerLines.primary,
            fontSize: 20,
            fontWeight: 600,
            fill: SLATE[900],
          },
        },
        {
          type: "text",
          left: "center",
          top: "52%",
          style: {
            text: centerLines.secondary,
            fontSize: 12,
            fill: SLATE[600],
          },
        },
        {
          type: "text",
          left: "center",
          top: "59%",
          style: {
            text: centerLines.tertiary,
            fontSize: 11,
            fill: SLATE[600],
          },
        },
      ],
    };
  }, [pieData, formatINR, centerLines]);

  const onSliceClick = useCallback(
    (params: { data?: PieDatum }) => {
      const d = params.data;
      if (!d?.drillable) return;
      const node = visibleNodes.find((n) => n.pathKey === d.pathKey);
      if (node) setStack((s) => [...s, node]);
    },
    [visibleNodes]
  );

  const goToLevel = useCallback((level: number) => {
    setStack((s) => (level <= 0 ? [] : s.slice(0, level)));
  }, []);

  const CHART_HEIGHT = 320;

  if (tree.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background shadow-sm p-6 flex flex-col h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        No holdings in view.
      </div>
    );
  }

  if (pieData.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background shadow-sm p-6 flex flex-col h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        No allocation slices for this level.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background shadow-sm p-6 flex flex-col h-full transition-shadow hover:shadow-md min-w-0">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">Allocation %</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Share of portfolio market value by policy category (click a slice to drill into sub-categories)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-2 min-h-[1.5rem]">
        <button
          type="button"
          onClick={() => goToLevel(0)}
          className={`rounded-md px-2 py-0.5 transition-colors ${
            stack.length === 0
              ? "font-medium text-foreground bg-muted/60"
              : "hover:bg-muted hover:text-foreground"
          }`}
        >
          All
        </button>
        {stack.map((node, i) => (
          <span key={node.pathKey} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="text-border">
              /
            </span>
            <button
              type="button"
              onClick={() => goToLevel(i + 1)}
              className={`rounded-md px-2 py-0.5 truncate max-w-[10rem] transition-colors ${
                i === stack.length - 1
                  ? "font-medium text-foreground bg-muted/60"
                  : "hover:bg-muted hover:text-foreground"
              }`}
              title={node.label}
            >
              {node.label}
            </button>
          </span>
        ))}
      </div>

      {stack.length > 0 ? (
        <button
          type="button"
          onClick={() => setStack((s) => s.slice(0, -1))}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground w-fit"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Back up one level
        </button>
      ) : null}

      <div className="flex-1 min-h-[340px]">
        <BaseChart
          option={option}
          height={CHART_HEIGHT}
          className="!p-0 !shadow-none !min-h-0 cursor-pointer"
          style={{ height: CHART_HEIGHT, boxShadow: "none" }}
          onEvents={{ click: onSliceClick }}
        />
      </div>
    </div>
  );
}
