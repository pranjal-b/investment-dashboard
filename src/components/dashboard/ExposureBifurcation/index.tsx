"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioSnapshot, useAllocationBuckets } from "@/lib/store/dashboardStore";

export function ExposureBifurcation() {
  const snapshot = usePortfolioSnapshot();
  const buckets = useAllocationBuckets();
  const total = snapshot.portfolioMarketValue || 1;
  const direct = buckets.filter((b) => b.bucketId === "DirectEquity").reduce((s, b) => s + b.marketValue, 0);
  const indirect = total - direct;
  const equity = buckets.filter((b) => ["DirectEquity", "EquityMF", "ETF", "IndexFund"].includes(b.bucketId)).reduce((s, b) => s + b.marketValue, 0);
  const debt = buckets.filter((b) => b.bucketId === "DebtMF").reduce((s, b) => s + b.marketValue, 0);
  const alternative = buckets.filter((b) => b.bucketId === "AIF").reduce((s, b) => s + b.marketValue, 0);

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Exposure Bifurcation</h2>
        <p className="text-xs text-muted-foreground">Direct/Indirect, Equity/Debt/Alt</p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Direct vs Indirect</p>
          <p className="text-sm font-semibold mt-1">Direct {(direct / total * 100).toFixed(1)}%</p>
          <p className="text-sm font-semibold">Indirect {(indirect / total * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Equity / Debt / Alt</p>
          <p className="text-sm font-semibold mt-1">E {(equity/total*100).toFixed(1)}% D {(debt/total*100).toFixed(1)}% A {(alternative/total*100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Active vs Passive</p>
          <p className="text-sm font-semibold mt-1">Active {snapshot.pctActive.toFixed(1)}% Passive {(100 - snapshot.pctActive).toFixed(1)}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
