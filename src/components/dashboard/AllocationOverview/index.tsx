"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AssetClassDonut } from "./AssetClassDonut";
import { TargetVsActualDonut } from "./TargetVsActualDonut";
import { ResidualDonut } from "./ResidualDonut";

export function AllocationOverview() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Allocation Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Asset Class Allocation</h3>
          </CardHeader>
          <CardContent>
            <AssetClassDonut />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Target vs Actual</h3>
          </CardHeader>
          <CardContent>
            <TargetVsActualDonut />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium">Residual Allocation</h3>
          </CardHeader>
          <CardContent>
            <ResidualDonut />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
