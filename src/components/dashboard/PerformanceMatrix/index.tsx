"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePerformanceMatrixData, useDashboardStore } from "@/lib/store/dashboardStore";
import { PERFORMANCE_MATRIX_PERIODS } from "@/lib/analytics/returnEngine";
import {
  getPerformanceMatrixSample,
  PERFORMANCE_MATRIX_SCENARIOS,
  type PerformanceMatrixScenario,
} from "@/data/performance-matrix-sample";

const SAMPLE_PERIOD_KEYS = ["3M", "6M", "1Y", "3Y", "Since Inception"] as const;

function formatPercent(value: number | null, mutedIfNull = false): React.ReactNode {
  if (value === null) {
    return <span className={mutedIfNull ? "text-muted-foreground" : ""}>—</span>;
  }
  const str = `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  return mutedIfNull ? <span className="text-muted-foreground">{str}</span> : str;
}

const PERIOD_HEADERS: Record<string, string> = {
  "3M": "3M",
  "6M": "6M",
  "1Y": "1Y",
  "3Y": "3Y",
  SI: "Since Inception",
};

export function PerformanceMatrix() {
  const scenario = useDashboardStore(
    (s) => (s.filters.performanceMatrixScenario ?? "moderate") as "live" | PerformanceMatrixScenario
  );
  const setFilters = useDashboardStore((s) => s.setFilters);
  const { bucketRows, benchmarkByPeriod, portfolioXIRR } = usePerformanceMatrixData();
  const periods = [...PERFORMANCE_MATRIX_PERIODS];
  const useSample = scenario !== "live";
  const sampleRows = useSample ? getPerformanceMatrixSample(scenario as PerformanceMatrixScenario) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Data
          </span>
          <Select
            value={scenario}
            onValueChange={(v) =>
              setFilters({ performanceMatrixScenario: v as "live" | PerformanceMatrixScenario })
            }
          >
            <SelectTrigger className="h-8 w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live</SelectItem>
              {PERFORMANCE_MATRIX_SCENARIOS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border border-border/60 rounded-xl overflow-hidden shadow-none">
        <CardContent className="overflow-x-auto px-0 pt-4 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                  Bucket / Metric
                </th>
                {useSample
                  ? SAMPLE_PERIOD_KEYS.map((p) => (
                      <th
                        key={p}
                        className="text-right py-2 px-3 font-medium text-muted-foreground"
                      >
                        {p}
                      </th>
                    ))
                  : periods.map((p) => (
                      <th
                        key={p}
                        className="text-right py-2 px-3 font-medium text-muted-foreground"
                      >
                        {PERIOD_HEADERS[p]}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {useSample && sampleRows ? (
                sampleRows.map((row) => (
                  <tr
                    key={row.bucket}
                    className={
                      row.bucket === "Portfolio XIRR"
                        ? "bg-muted/30"
                        : "border-b border-border/50 hover:bg-muted/30"
                    }
                  >
                    <td
                      className={`py-2 px-3 font-medium ${
                        row.bucket === "Benchmark (Nifty 50)" ? "text-muted-foreground" : ""
                      }`}
                    >
                      {row.bucket}
                    </td>
                    {SAMPLE_PERIOD_KEYS.map((p) => (
                      <td key={p} className="text-right py-2 px-3 tabular-nums">
                        {formatPercent(row[p], row[p] === null)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <>
                  {bucketRows.map((row) => (
                    <tr
                      key={row.bucketId}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-2 px-3 font-medium">{row.label}</td>
                      {periods.map((p) => (
                        <td key={p} className="text-right py-2 px-3 tabular-nums">
                          {formatPercent(row.periodReturns[p] ?? null)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium text-muted-foreground">
                      Benchmark
                    </td>
                    {periods.map((p) => (
                      <td
                        key={p}
                        className="text-right py-2 px-3 tabular-nums text-muted-foreground"
                      >
                        {formatPercent(benchmarkByPeriod[p] ?? null)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="py-2 px-3 font-medium">XIRR</td>
                    {periods.map((p, i) => (
                      <td
                        key={p}
                        className="text-right py-2 px-3 tabular-nums font-medium"
                      >
                        {i < periods.length - 1 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          formatPercent(portfolioXIRR)
                        )}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        {useSample
          ? "Sample data (Indian market context). Switch to Live for holdings-based returns."
          : "Bucket-wise period returns (Portfolio) • Benchmark • XIRR in Since Inception"}
      </p>
    </div>
  );
}
