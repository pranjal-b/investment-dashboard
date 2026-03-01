"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePolicyChecks } from "@/lib/store/dashboardStore";

export function ComplianceMonitor() {
  const checks = usePolicyChecks();

  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Policy & Compliance</h2>
        <p className="text-xs text-muted-foreground">Actual vs threshold • Green / Amber / Red</p>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Policy</th>
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Threshold</th>
              <th className="text-right py-2 px-3 font-medium">Actual</th>
              <th className="text-right py-2 px-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.policy} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-2 px-3 font-medium">{c.policy}</td>
                <td className="py-2 px-3 text-muted-foreground">{c.threshold}</td>
                <td className="text-right py-2 px-3 tabular-nums">{c.actualLabel}</td>
                <td className="text-right py-2 px-3">
                  <span
                    className={
                      c.status === "green"
                        ? "text-emerald-600 bg-emerald-500/10"
                        : c.status === "amber"
                          ? "text-amber-600 bg-amber-500/10"
                          : "text-red-600 bg-red-500/10"
                    }
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
