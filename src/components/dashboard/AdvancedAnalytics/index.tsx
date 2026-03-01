"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectorHeatmap } from "./SectorHeatmap";
import { RollingXIRRChart } from "./RollingXIRRChart";
import { GainWaterfall } from "./GainWaterfall";
import { ConcentrationIndicator } from "./ConcentrationIndicator";

export function AdvancedAnalytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Advanced Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Sector vs Asset Class Heatmap</h3>
            <p className="text-xs text-muted-foreground">
              Overweight / Underweight vs target
            </p>
          </CardHeader>
          <CardContent>
            <SectorHeatmap />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Rolling XIRR</h3>
            <p className="text-xs text-muted-foreground">
              Time-series of portfolio XIRR (simulated)
            </p>
          </CardHeader>
          <CardContent>
            <RollingXIRRChart />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Gain Contribution Waterfall</h3>
          </CardHeader>
          <CardContent>
            <GainWaterfall />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Concentration Risk</h3>
            <p className="text-xs text-muted-foreground">
              Top 5 exposure alert
            </p>
          </CardHeader>
          <CardContent>
            <ConcentrationIndicator />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
