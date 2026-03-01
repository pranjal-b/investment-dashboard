"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTopHoldingsByDeviation, useFormatINR } from "@/lib/store/dashboardStore";

export function TopHoldingsAllocationTable() {
  const rows = useTopHoldingsByDeviation(10);
  const formatINR = useFormatINR();

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-background p-6 min-h-[200px] flex items-center justify-center text-sm text-muted-foreground">
        No holdings
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border/60 bg-background p-6">
        <h3 className="text-xs font-medium text-muted-foreground mb-3">
          Top holdings · concentration & risk
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Holding</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Weight</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Target</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Deviation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tooltip key={r.holdingId}>
                  <TooltipTrigger asChild>
                    <tr className="border-b border-border/50 hover:bg-muted/30 cursor-default">
                      <td className="py-2 px-2 font-medium truncate max-w-[140px]" title={r.holdingName}>
                        {r.holdingName}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <div
                            className="h-1.5 rounded-sm bg-muted-foreground/20 min-w-[40px] max-w-[60px] overflow-hidden"
                            style={{ width: `${Math.min(100, r.weightPct) * 0.6}px` }}
                          >
                            <div
                              className="h-full rounded-sm bg-primary/60"
                              style={{ width: "100%" }}
                            />
                          </div>
                          <span>{r.weightPct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                        {r.targetPct.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2 px-2 text-right tabular-nums ${
                          r.deviationPct >= 0
                            ? "text-amber-700 dark:text-amber-500"
                            : "text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {r.deviationPct >= 0 ? "+" : ""}
                        {r.deviationPct.toFixed(1)}%
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      <p className="font-medium">{r.holdingName}</p>
                      <p>Invested: {formatINR(r.invested)}</p>
                      <p>Market value: {formatINR(r.value)}</p>
                      <p>Gain: {formatINR(r.gain)}</p>
                      <p>Target: {r.targetPct.toFixed(1)}%</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}
