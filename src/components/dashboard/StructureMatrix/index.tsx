"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioSnapshot } from "@/lib/store/dashboardStore";

export function StructureMatrix() {
  const snapshot = usePortfolioSnapshot();

  const items = [
    { label: "# Portfolios", value: snapshot.numberOfPortfolios.toLocaleString() },
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Portfolio Structure</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {items.map((item) => (
          <Card
            key={item.label}
            className="border border-border/60 rounded-xl overflow-hidden shadow-none"
          >
            <CardHeader className="pb-1 pt-3 px-3">
              <h3 className="text-xs font-medium text-muted-foreground truncate">
                {item.label}
              </h3>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <p className="text-lg font-semibold tabular-nums truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
