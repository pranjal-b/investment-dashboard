"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMacroAllocation, useFormatINR } from "@/lib/store/dashboardStore";

const BAR_COLORS: Record<string, string> = {
  liquid: "#0ea5e9",
  debt: "#6366f1",
  equity: "#059669",
  alternatives: "#d97706",
  unlisted: "#7c3aed",
};

export function AllocationSnapshotBar() {
  const macro = useMacroAllocation();
  const formatINR = useFormatINR();
  const withValue = useMemo(() => macro.filter((r) => r.value > 0), [macro]);
  const total = useMemo(() => macro.reduce((s, r) => s + r.value, 0), [macro]);

  if (total <= 0) {
    return (
      <Card className="border border-border/60 rounded-xl shadow-none h-full">
        <CardContent className="pt-6 pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sleeve allocation</h3>
          <p className="text-sm text-muted-foreground">No holdings in view.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60 rounded-xl shadow-none h-full flex flex-col">
      <CardContent className="pt-6 pb-4 flex flex-col flex-1 min-h-0">
        <h3 className="text-sm font-semibold text-foreground mb-4">Sleeve allocation (actual %)</h3>
        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {withValue.map((row) => {
            const pct = (row.value / total) * 100;
            return (
              <div key={row.classId} className="space-y-1">
                <div className="flex justify-between text-xs gap-2">
                  <span className="font-medium text-foreground truncate">{row.label}</span>
                  <span className="tabular-nums text-muted-foreground shrink-0">
                    {pct.toFixed(1)}% · {formatINR(row.value)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: BAR_COLORS[row.classId] ?? "#64748b",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
