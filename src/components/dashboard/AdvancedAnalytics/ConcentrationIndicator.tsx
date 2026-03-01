"use client";

import { useMemo } from "react";
import { useFilteredHoldings } from "@/lib/store/dashboardStore";
import { AlertTriangle } from "lucide-react";

export function ConcentrationIndicator() {
  const holdings = useFilteredHoldings();

  const { top5, herfindahl, isConcentrated } = useMemo(() => {
    const total = holdings.reduce((s, h) => s + h.currentValue, 0);
    if (total === 0) {
      return { top5: [], herfindahl: 0, isConcentrated: false };
    }

    const sorted = [...holdings].sort(
      (a, b) => b.currentValue - a.currentValue
    );
    const top5 = sorted.slice(0, 5).map((h) => ({
      name: h.assetName,
      pct: (h.currentValue / total) * 100,
    }));

    const shares = holdings.map((h) => h.currentValue / total);
    const herfindahl = shares.reduce((s, x) => s + x * x, 0) * 100;

    return {
      top5,
      herfindahl,
      isConcentrated: top5[0]?.pct > 20 || herfindahl > 15,
    };
  }, [holdings]);

  if (holdings.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Herfindahl Index:</span>
        <span
          className={
            herfindahl > 15
              ? "text-amber-600 dark:text-amber-400 font-medium"
              : "text-muted-foreground"
          }
        >
          {herfindahl.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">
          (higher = more concentrated)
        </span>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Top 5 Exposure</h4>
        <ul className="space-y-1">
          {top5.map((item) => (
            <li
              key={item.name}
              className="flex justify-between text-sm"
            >
              <span className="truncate max-w-[200px]">{item.name}</span>
              <span className="tabular-nums">{item.pct.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>

      {isConcentrated && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Portfolio concentration is high. Consider diversifying across more
            holdings.
          </p>
        </div>
      )}
    </div>
  );
}
