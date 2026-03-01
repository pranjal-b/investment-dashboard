"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRiskMetrics, useDebtRisk } from "@/lib/store/dashboardStore";

export function RiskHygiene() {
  const risk = useRiskMetrics();
  const debt = useDebtRisk();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <h2 className="text-base font-semibold">Portfolio Risk & Hygiene</h2>
          <p className="text-xs text-muted-foreground">
            Concentration, liquidity, lock-in, expense drag
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Herfindahl</p>
              <p className="text-sm font-semibold tabular-nums">{risk.herfindahl.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Top 5 Concentration</p>
              <p className="text-sm font-semibold tabular-nums">{risk.top5ConcentrationPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">% Overconcentration</p>
              <p className="text-sm font-semibold tabular-nums">{risk.pctOverconcentration.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">% Low Liquidity</p>
              <p className="text-sm font-semibold tabular-nums">{risk.pctLowLiquidity.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">% Lock-in</p>
              <p className="text-sm font-semibold tabular-nums">{risk.pctLockIn.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Expense Drag</p>
              <p className="text-sm font-semibold tabular-nums">{risk.expenseDrag.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <h2 className="text-base font-semibold">Debt Risk</h2>
          <p className="text-xs text-muted-foreground">
            Credit breakdown, duration, YTM
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">AAA %</p>
              <p className="text-sm font-semibold tabular-nums">{debt.aaaPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">AA %</p>
              <p className="text-sm font-semibold tabular-nums">{debt.aaPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Below AA %</p>
              <p className="text-sm font-semibold tabular-nums">{debt.belowAAPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Modified Duration</p>
              <p className="text-sm font-semibold tabular-nums">{debt.modifiedDuration.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 col-span-2">
              <p className="text-xs text-muted-foreground">Yield to Maturity</p>
              <p className="text-sm font-semibold tabular-nums">{debt.yieldToMaturity.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
