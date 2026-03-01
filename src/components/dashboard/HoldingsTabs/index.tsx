"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFilteredHoldings, useHoldingPeriodReturns, useFormatINR } from "@/lib/store/dashboardStore";
import type { AllocationBucketId } from "@/lib/types";

const BUCKET_ORDER: AllocationBucketId[] = [
  "DirectEquity",
  "EquityMF",
  "DebtMF",
  "PMS",
  "AIF",
  "ETF",
  "IndexFund",
  "AlternativeFOF",
];
const BUCKET_LABELS: Record<string, string> = {
  DirectEquity: "Direct Equity",
  EquityMF: "Equity MF",
  DebtMF: "Debt MF",
  PMS: "PMS",
  AIF: "AIF",
  ETF: "ETF",
  IndexFund: "Index Fund",
  AlternativeFOF: "Alternatives",
};

const ASSET_TO_BUCKET: Record<string, string> = {
  Equity: "DirectEquity",
  MutualFund: "EquityMF",
  DebtMF: "DebtMF",
  PMS: "PMS",
  AIF: "AIF",
  ETF: "ETF",
  IndexFund: "IndexFund",
};

function formatPct(v: number | null): string {
  if (v === null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export function HoldingsTabs() {
  const [activeBucket, setActiveBucket] = useState<string>("DirectEquity");
  const holdings = useFilteredHoldings();
  const holdingReturns = useHoldingPeriodReturns();
  const formatINR = useFormatINR();
  const byBucket = new Map<string, typeof holdings>();
  for (const h of holdings) {
    const b = ASSET_TO_BUCKET[h.assetType] ?? "EquityMF";
    if (!byBucket.has(b)) byBucket.set(b, []);
    byBucket.get(b)!.push(h);
  }
  const returnsByHoldingId = new Map(holdingReturns.map((r) => [r.holdingId, r]));
  const currentHoldings = byBucket.get(activeBucket) ?? [];

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Holdings by Bucket</h2>
        <p className="text-xs text-muted-foreground">Performance by asset bucket</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 border-b border-border pb-2 mb-2">
          {BUCKET_ORDER.filter((b) => byBucket.has(b)).map((bucketId) => (
            <button
              key={bucketId}
              onClick={() => setActiveBucket(bucketId)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeBucket === bucketId
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {BUCKET_LABELS[bucketId] ?? bucketId}
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
