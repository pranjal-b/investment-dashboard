"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectorTreemap } from "./SectorTreemap";
import { MarketCapBarChart } from "./MarketCapBarChart";
import { useDashboardStore } from "@/lib/store/dashboardStore";

export function SectorExposureSection() {
  const setSelectedSector = useDashboardStore((s) => s.setSelectedSector);
  const selectedSector = useDashboardStore((s) => s.filters.selectedSector);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Sector & Market Cap Exposure</h2>
        {selectedSector && (
          <button
            onClick={() => setSelectedSector(null)}
            className="text-sm text-primary hover:underline"
          >
            Clear sector filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Sector Treemap</h3>
            <p className="text-xs text-muted-foreground">
              Click a sector to filter
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <SectorTreemap />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Market Cap Exposure</h3>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <MarketCapBarChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
