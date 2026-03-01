"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AllocationDonut, TargetVsActual, ResidualChart } from "@/components/charts";

export function AllocationOverview() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Allocation Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Asset Class Allocation</h3>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <AllocationDonut />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Target vs Actual</h3>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <TargetVsActual />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Residual Allocation</h3>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <ResidualChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
