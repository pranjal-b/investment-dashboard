"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PerformanceControls } from "./PerformanceControls";
import { PerformanceChart } from "./PerformanceChart";

export function FYPerformanceSection() {
  return (
    <Card className="border border-border/60 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <h3 className="text-sm font-semibold text-foreground">Performance trend</h3>
        <PerformanceControls />
        <div className="border-t border-border/60 pt-6">
          <PerformanceChart />
        </div>
      </CardContent>
    </Card>
  );
}
