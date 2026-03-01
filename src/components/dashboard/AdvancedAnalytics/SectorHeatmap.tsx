"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useSectorExposure } from "@/lib/store/dashboardStore";
import { useAllocation } from "@/lib/store/dashboardStore";

export function SectorHeatmap() {
  const sectorExposure = useSectorExposure();
  const allocation = useAllocation();

  const sectors = useMemo(
    () => Array.from(new Set(sectorExposure.map((s) => s.sector))),
    [sectorExposure]
  );

  const assetTypes = useMemo(
    () => allocation.map((a) => a.assetType),
    [allocation]
  );

  const data = useMemo(() => {
    const result: [number, number, number][] = [];
    sectors.forEach((sector, i) => {
      assetTypes.forEach((assetType, j) => {
        const sectorData = sectorExposure.find((se) => se.sector === sector);
        const allocData = allocation.find((a) => a.assetType === assetType);
        const exposure =
          sectorData?.byVehicle?.[assetType as keyof typeof sectorData.byVehicle] ?? 0;
        const total = sectorExposure.reduce((sum, s) => sum + s.value, 0);
        const pct = total > 0 ? (exposure / total) * 100 : 0;
        const target = allocData?.targetPct ?? 0;
        const residual = pct - (target * (sectorData?.pct ?? 0)) / 100;
        result.push([j, i, residual]);
      });
    });
    return result;
  }, [sectors, assetTypes, sectorExposure, allocation]);

  const option = useMemo(
    () => ({
      tooltip: {
        position: "top",
        formatter: (params: { value: [number, number, number] }) => {
          const [j, i, val] = params.value;
          const sector = sectors[i];
          const asset = assetTypes[j];
          return `${sector} / ${asset}: ${val >= 0 ? "+" : ""}${val.toFixed(1)}% vs target`;
        },
      },
      grid: { left: 80, top: 40, right: 20, bottom: 60 },
      xAxis: {
        type: "category",
        data: assetTypes,
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: sectors,
        splitArea: { show: false },
      },
      visualMap: {
        min: -5,
        max: 5,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        inRange: {
          color: ["#dc2626", "#fef3c7", "#059669"],
        },
      },
      series: [
        {
          type: "heatmap",
          data,
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.5)" },
          },
        },
      ],
    }),
    [data, sectors, assetTypes]
  );

  if (sectorExposure.length === 0 || allocation.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 280 }}
      opts={{ renderer: "canvas" }}
    />
  );
}
