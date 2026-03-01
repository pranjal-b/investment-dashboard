"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFYPerformance } from "@/lib/store/dashboardStore";

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function FYPerformanceSection() {
  const { fy, monthOnMonth, quarterly } = useFYPerformance();
  const [showIrr] = useState(true);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <h2 className="text-base font-semibold">FY {fy} — Month on Month</h2>
          <p className="text-xs text-muted-foreground">
            Portfolio Return, Nifty 50 Return, Excess
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  Month
                </th>
                <th className="text-right py-2 px-3 font-medium">
                  Portfolio Return
                </th>
                <th className="text-right py-2 px-3 font-medium">
                  Nifty 50 Return
                </th>
                <th className="text-right py-2 px-3 font-medium">
                  Excess
                </th>
              </tr>
            </thead>
            <tbody>
              {monthOnMonth.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="py-2 px-3 font-medium">{row.month}</td>
                  <td className="text-right py-2 px-3 tabular-nums">
                    {formatPercent(row.portfolioReturn)}
                  </td>
                  <td className="text-right py-2 px-3 tabular-nums text-muted-foreground">
                    {formatPercent(row.benchmarkReturn)}
                  </td>
                  <td
                    className={`text-right py-2 px-3 tabular-nums ${
                      row.excessReturn >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatPercent(row.excessReturn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <h2 className="text-base font-semibold">FY {fy} — Quarterly</h2>
          <p className="text-xs text-muted-foreground">
            {showIrr ? "IRR" : "Absolute %"} • Q1–Q4, H1, Full Year
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  Period
                </th>
                <th className="text-right py-2 px-3 font-medium">
                  {showIrr ? "IRR" : "Absolute %"}
                </th>
              </tr>
            </thead>
            <tbody>
              {quarterly.map((row) => (
                <tr
                  key={row.period}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="py-2 px-3 font-medium">{row.period}</td>
                  <td className="text-right py-2 px-3 tabular-nums">
                    {showIrr
                      ? row.irr != null
                        ? formatPercent(row.irr)
                        : "—"
                      : row.absolutePct != null
                        ? formatPercent(row.absolutePct)
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
