"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectorHeatmap } from "./SectorHeatmap";
import { RollingXIRRChart } from "./RollingXIRRChart";
import { GainWaterfall } from "./GainWaterfall";
import { ConcentrationIndicator } from "./ConcentrationIndicator";

export function AdvancedAnalytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Advanced Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Sector vs Asset Class Heatmap</h3>
            <p className="text-xs text-muted-foreground">
              Overweight / Underweight vs target
            </p>
          </CardHeader>
          <CardContent>
            <SectorHeatmap />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Rolling XIRR</h3>
            <p className="text-xs text-muted-foreground">
              Time-series of portfolio XIRR (simulated)
            </p>
          </CardHeader>
          <CardContent>
            <RollingXIRRChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Gain Contribution Waterfall</h3>
          </CardHeader>
          <CardContent>
            <GainWaterfall />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Concentration Risk</h3>
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
