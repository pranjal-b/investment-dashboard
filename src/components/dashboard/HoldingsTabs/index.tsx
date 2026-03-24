"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFilteredHoldings, useHoldingPeriodReturns, useFormatINR } from "@/lib/store/dashboardStore";
import type { AllocationSleeve } from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";

const SLEEVE_ORDER: AllocationSleeve[] = [
  "liquid",
  "debt",
  "equity",
  "alternatives",
  "unlisted",
];

const SLEEVE_LABELS: Record<AllocationSleeve, string> = {
  liquid: "Liquid & equivalents",
  debt: "Debt",
  equity: "Equity",
  alternatives: "Alternatives",
  unlisted: "Unlisted",
};

function formatPct(v: number | null): string {
  if (v === null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export function HoldingsTabs() {
  const holdings = useFilteredHoldings();
  const holdingReturns = useHoldingPeriodReturns();
  const formatINR = useFormatINR();

  const bySleeve = useMemo(() => {
    const m = new Map<AllocationSleeve, typeof holdings>();
    for (const s of SLEEVE_ORDER) m.set(s, []);
    for (const h of holdings) {
      const s = getAllocationSleeve(h);
      m.get(s)!.push(h);
    }
    return m;
  }, [holdings]);

  const [activeSleeve, setActiveSleeve] = useState<AllocationSleeve>("equity");

  const returnsByHoldingId = useMemo(
    () => new Map(holdingReturns.map((r) => [r.holdingId, r])),
    [holdingReturns]
  );

  const visibleTabs = SLEEVE_ORDER.filter((s) => (bySleeve.get(s) ?? []).length > 0);
  const displaySleeve =
    visibleTabs.includes(activeSleeve) ? activeSleeve : visibleTabs[0] ?? activeSleeve;
  const currentHoldings = bySleeve.get(displaySleeve) ?? [];

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Holdings by sleeve</h2>
        <p className="text-xs text-muted-foreground">Performance grouped by allocation sleeve</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 border-b border-border pb-2 mb-2">
          {visibleTabs.map((sleeveId) => (
            <button
              key={sleeveId}
              onClick={() => setActiveSleeve(sleeveId)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                displaySleeve === sleeveId
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {SLEEVE_LABELS[sleeveId]}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                <th className="text-right py-2 px-3 font-medium">Invested</th>
                <th className="text-right py-2 px-3 font-medium">Value</th>
                <th className="text-right py-2 px-3 font-medium">P&L</th>
                <th className="text-right py-2 px-3 font-medium">XIRR</th>
                <th className="text-right py-2 px-3 font-medium">3M</th>
                <th className="text-right py-2 px-3 font-medium">1Y</th>
                <th className="text-right py-2 px-3 font-medium">3Y</th>
              </tr>
            </thead>
            <tbody>
              {currentHoldings.map((h) => {
                const ret = returnsByHoldingId.get(h.id);
                const pnl = h.currentValue - (h.costValue ?? h.investedAmount);
                return (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{h.assetName}</td>
                    <td className="text-right py-2 px-3 tabular-nums">{formatINR(h.costValue ?? h.investedAmount)}</td>
                    <td className="text-right py-2 px-3 tabular-nums">{formatINR(h.currentValue)}</td>
                    <td className={`text-right py-2 px-3 tabular-nums ${pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatINR(pnl)}</td>
                    <td className="text-right py-2 px-3 tabular-nums">{formatPct(ret?.xirrPct ?? null)}</td>
                    <td className="text-right py-2 px-3 tabular-nums">{formatPct(ret?.periodReturns.find((p) => p.period === "3M")?.returnPct ?? null)}</td>
                    <td className="text-right py-2 px-3 tabular-nums">{formatPct(ret?.periodReturns.find((p) => p.period === "1Y")?.returnPct ?? null)}</td>
                    <td className="text-right py-2 px-3 tabular-nums">{formatPct(ret?.periodReturns.find((p) => p.period === "3Y")?.returnPct ?? null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
