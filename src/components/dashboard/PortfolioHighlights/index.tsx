"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePortfolioSnapshot, usePolicyChecks } from "@/lib/store/dashboardStore";

export function PortfolioHighlights() {
  const snapshot = usePortfolioSnapshot();
  const checks = usePolicyChecks();
  const highlights: string[] = [];

  if (snapshot.portfolioMarketValue > 0) {
    highlights.push(`Portfolio ${snapshot.absoluteGainPct >= 0 ? "up" : "down"} ${Math.abs(snapshot.absoluteGainPct).toFixed(1)}% (absolute).`);
  }
  if (snapshot.portfolioXIRR != null && snapshot.benchmarkXIRR != null) {
    const excess = snapshot.portfolioXIRR - snapshot.benchmarkXIRR;
    if (Math.abs(excess) > 0.1) {
      highlights.push(excess >= 0 ? `Outperformed benchmark by ${excess.toFixed(1)}% XIRR.` : `Underperformed benchmark by ${Math.abs(excess).toFixed(1)}% XIRR.`);
    }
  }
  const altCheck = checks.find((c) => c.policy.toLowerCase().includes("alternative"));
  if (altCheck && altCheck.status !== "green") {
    highlights.push(`Alternatives ${altCheck.actualLabel} vs policy.`);
  }
  if (highlights.length === 0) highlights.push("No highlights this period.");

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Portfolio Highlights</h2>
        <p className="text-xs text-muted-foreground">Key takeaways</p>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
