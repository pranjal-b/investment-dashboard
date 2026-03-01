"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useSectorExposure } from "@/lib/store/dashboardStore";
import { useDashboardStore } from "@/lib/store/dashboardStore";

import { CHART_COLORS, createModernTheme, formatINR, formatPct } from "@/lib/charts/chartTheme";

export function SectorTreemap() {
  const sectorExposure = useSectorExposure();
  const setSelectedSector = useDashboardStore((s) => s.setSelectedSector);
  const selectedSector = useDashboardStore((s) => s.filters.selectedSector);

  const children = useMemo(() => {
    const bySector: Record<string, { sector: string; value: number; byType: Record<string, number> }> = {};
    sectorExposure.forEach((s) => {
      const sectorKey = s.sector;
      if (!bySector[sectorKey]) {
        bySector[sectorKey] = {
          sector: sectorKey,
          value: 0,
          byType: {},
        };
      }
      bySector[sectorKey].value += s.value;
      Object.entries(s.byVehicle ?? {}).forEach(([type, val]) => {
        if (val > 0) {
          bySector[sectorKey].byType[type] =
            (bySector[sectorKey].byType[type] ?? 0) + val;
        }
      });
    });

    return Object.values(bySector).map((s, i) => ({
      name: s.sector,
      value: s.value,
      itemStyle: {
        color: CHART_COLORS[i % CHART_COLORS.length],
        borderColor: selectedSector === s.sector ? "#fff" : "transparent",
        borderWidth: selectedSector === s.sector ? 2 : 0,
      },
      children: Object.entries(s.byType)
        .filter(([, v]) => v > 0)
        .map(([type, val]) => ({ name: type, value: val })),
    }));
  }, [sectorExposure, selectedSector]);

  const option = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    return {
      ...theme,
      tooltip: {
        ...(theme.tooltip as object),
        formatter: (info: { data: { name: string; value: number }; treePathInfo: { name: string }[] }) => {
          const pct = info.treePathInfo.length === 1
            ? sectorExposure.find((s) => s.sector === info.data.name)?.pct ?? 0
            : 0;
          return `${info.data.name}: ${formatINR(info.data.value)} (${formatPct(pct)})`;
        },
      },
      series: [
        {
          type: "treemap",
          width: "100%",
          height: 280,
          roam: false,
          nodeClick: "zoomToNode",
          breadcrumb: { show: false },
          levels: [
            { itemStyle: { borderWidth: 2, borderColor: "#fff" } },
            { itemStyle: { borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" } },
          ],
          data: children,
          emphasis: { focus: "ancestor" },
        },
      ],
    };
  }, [children, sectorExposure]);

  const onEvents = useMemo(
    () => ({
      click: (params: { data: { name: string }; componentType: string }) => {
        if (params.componentType === "series" && params.data?.name) {
          const name = params.data.name;
          const sectorNames = sectorExposure.map((s) => s.sector);
          if (sectorNames.includes(name)) {
            setSelectedSector(selectedSector === name ? null : name);
          }
        }
      },
    }),
    [sectorExposure, selectedSector, setSelectedSector]
  );

  if (sectorExposure.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 min-h-[280px]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <ReactECharts
        option={option}
        style={{ height: 320 }}
        opts={{ renderer: "canvas" }}
        onEvents={onEvents}
      />
    </div>
  );
}
