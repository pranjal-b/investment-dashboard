"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSectorExposure } from "@/lib/store/dashboardStore";
import { useDashboardStore } from "@/lib/store/dashboardStore";

function formatPercent(value: number): string {
  return value.toFixed(1);
}

export function ExposureAttribution() {
  const sectorExposure = useSectorExposure();
  const selectedSector = useDashboardStore((s) => s.filters.selectedSector);

  const displaySectors = useMemo(() => {
    if (selectedSector) {
      const match = sectorExposure.find(
        (s) => s.sector.toLowerCase() === selectedSector.toLowerCase()
      );
      return match ? [match] : sectorExposure.slice(0, 5);
    }
    return sectorExposure.slice(0, 5);
  }, [sectorExposure, selectedSector]);

  if (sectorExposure.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Exposure Attribution</h2>
      <p className="text-sm text-muted-foreground">
        Sector exposure by vehicle (Direct Equity vs Mutual Fund vs AIF vs PMS vs ETF)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displaySectors.map((sector) => {
          const total = sectorExposure.reduce((sum, s) => sum + s.value, 0);
          const byVehicle = sector.byVehicle;

          const parts: string[] = [];
          if ((byVehicle?.Equity ?? 0) > 0) {
            const eqPct = total > 0 ? ((byVehicle.Equity ?? 0) / total) * 100 : 0;
            parts.push(`${formatPercent(eqPct)}% via Direct Equity`);
          }
          if ((byVehicle?.MutualFund ?? 0) > 0) {
            const mfPct = total > 0 ? ((byVehicle.MutualFund ?? 0) / total) * 100 : 0;
            parts.push(`${formatPercent(mfPct)}% via Mutual Funds`);
          }
          if ((byVehicle?.AIF ?? 0) > 0) {
            const aifPct = total > 0 ? ((byVehicle.AIF ?? 0) / total) * 100 : 0;
            parts.push(`${formatPercent(aifPct)}% via AIF`);
          }
          if ((byVehicle?.PMS ?? 0) > 0) {
            const pmsPct = total > 0 ? ((byVehicle.PMS ?? 0) / total) * 100 : 0;
            parts.push(`${formatPercent(pmsPct)}% via PMS`);
          }
          if ((byVehicle?.ETF ?? 0) > 0) {
            const etfPct = total > 0 ? ((byVehicle.ETF ?? 0) / total) * 100 : 0;
            parts.push(`${formatPercent(etfPct)}% via ETF`);
          }

          return (
            <Card key={sector.sector} className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
              <CardHeader className="pb-2">
                <h3 className="text-sm font-medium">{sector.sector}</h3>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatPercent(sector.pct)}%
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {parts.join(" • ") || "No exposure"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
