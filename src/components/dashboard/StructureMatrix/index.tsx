"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioSnapshot } from "@/lib/store/dashboardStore";

export function StructureMatrix() {
  const snapshot = usePortfolioSnapshot();

  const rows = [
    { label: "# Schemes", value: snapshot.numberOfSchemes.toLocaleString() },
    { label: "# Wealth Managers", value: snapshot.numberOfWealthManagers.toLocaleString() },
    { label: "Portfolio TER", value: `${snapshot.portfolioTER.toFixed(2)}%` },
    { label: "% Lock-in", value: `${snapshot.pctLockIn.toFixed(1)}%` },
    { label: "% Direct", value: `${snapshot.pctDirect.toFixed(1)}%` },
    { label: "% Indexed", value: `${snapshot.pctIndexed.toFixed(1)}%` },
    { label: "% Active", value: `${snapshot.pctActive.toFixed(1)}%` },
    { label: "% Alternative", value: `${snapshot.pctAlternative.toFixed(1)}%` },
  ];

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Portfolio Structure</h2>
        <p className="text-xs text-muted-foreground">
          Scheme count, TER, lock-in, direct/indexed/active/alternative mix
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg bg-muted/40 px-3 py-2"
            >
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
