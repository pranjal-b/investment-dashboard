"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { simulateFDLiquidationFromHoldings } from "@/lib/analytics";
import {
  useDashboardStore,
  useFormatINR,
  useLiquidEquivalentsAnalytics,
} from "@/lib/store/dashboardStore";
import { createModernTheme, CHART_CONTAINER_CLASS } from "@/lib/charts/chartTheme";

const FD_DONUT_COLORS = ["#1d4ed8", "#7c3aed", "#db2777", "#ea580c", "#0d9488", "#64748b"];

export function LiquidEquivalentsSection() {
  const hydrateLiquidityFromStorage = useDashboardStore((s) => s.hydrateLiquidityFromStorage);
  const setLiquiditySettings = useDashboardStore((s) => s.setLiquiditySettings);
  const liquiditySettings = useDashboardStore((s) => s.liquiditySettings);
  const holdings = useDashboardStore((s) => s.holdings);

  const le = useLiquidEquivalentsAnalytics();
  const formatINR = useFormatINR();

  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    hydrateLiquidityFromStorage();
  }, [hydrateLiquidityFromStorage]);

  const [liqPct, setLiqPct] = useState(10);
  const [penaltyInput, setPenaltyInput] = useState(String(liquiditySettings.defaultPrematurePenaltyAnnualPct));

  useEffect(() => {
    setPenaltyInput(String(liquiditySettings.defaultPrematurePenaltyAnnualPct));
  }, [liquiditySettings.defaultPrematurePenaltyAnnualPct]);

  const fdDonutOption = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    const slices = le.fdAllocationByBank.filter((s) => s.marketValueINR > 0);
    if (!slices.length) {
      return {
        ...theme,
        graphic: {
          type: "text",
          left: "center",
          top: "middle",
          style: { text: "No FDs", fill: "#94a3b8", fontSize: 14 },
        },
        series: [{ type: "pie", radius: ["42%", "70%"], data: [] }],
      };
    }
    return {
      ...theme,
      tooltip: {
        trigger: "item",
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}: ${formatINR(p.value)} (${p.percent.toFixed(1)}%)`,
      },
      series: [
        {
          type: "pie",
          radius: ["42%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 1 },
          label: { fontSize: 10 },
          data: slices.map((x, i) => ({
            name: x.bankName,
            value: x.marketValueINR,
            itemStyle: { color: FD_DONUT_COLORS[i % FD_DONUT_COLORS.length] },
          })),
        },
      ],
    };
  }, [le.fdAllocationByBank, formatINR]);

  const penaltyPct = Number(String(penaltyInput).replace(/,/g, ""));
  const penaltyOk = Number.isFinite(penaltyPct) && penaltyPct >= 0;
  const liquidationSim = useMemo(() => {
    if (!penaltyOk) return null;
    return simulateFDLiquidationFromHoldings({
      holdings,
      amountPctOfTotalFD: Math.max(0, Math.min(100, liqPct)),
      penaltyAnnualPct: penaltyPct,
    });
  }, [holdings, liqPct, penaltyPct, penaltyOk]);

  function commitDefaultPenalty() {
    const n = Number(String(penaltyInput).replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) return;
    setLiquiditySettings({ defaultPrematurePenaltyAnnualPct: n });
  }

  const hasLE = le.summary.totalMarketValueINR > 0;

  if (!hasLE) {
    return (
      <Card className="border border-border/60 rounded-xl shadow-none">
        <CardContent className="pt-6 pb-4">
          <h2 className="text-lg font-semibold text-foreground mb-1">Liquid &amp; equivalents</h2>
          <p className="text-sm text-muted-foreground">
            No liquid &amp; equivalents in this snapshot. Holdings need one of:{" "}
            <span className="font-mono text-xs">
              liquid_fund, arbitrage, fixed_deposit, bank_balance
            </span>{" "}
            as <span className="font-mono text-xs">instrumentSubtype</span>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const summaryRows = le.summary.rows;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Liquid &amp; equivalents</h2>
        <p className="text-sm text-muted-foreground">
          Treasury cash, liquid funds, arbitrage, FDs, and bank balances — full portfolio book (not
          narrowed by asset-class filters).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryRows.map((row) => (
          <Card key={row.segment} className="border border-border/60 rounded-xl shadow-none">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              <p className="text-lg font-semibold tabular-nums">{formatINR(row.marketValueINR)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {row.pctOfTotal != null ? `${row.pctOfTotal.toFixed(2)}% of L&E` : "—"} · {row.count}{" "}
                position{row.count !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card className="border border-border/60 rounded-xl shadow-none ring-1 ring-border/40">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total L&amp;E
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {formatINR(le.summary.totalMarketValueINR)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Combined market value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border border-border/60 rounded-xl shadow-none">
          <CardContent className="pt-4 pb-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              FD allocation by bank
            </h3>
            <div className={CHART_CONTAINER_CLASS}>
              <ReactECharts option={fdDonutOption} style={{ height: 260 }} notMerge lazyUpdate />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 rounded-xl shadow-none">
          <CardContent className="pt-4 pb-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              FD callable split
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Callable</p>
                <p className="text-base font-semibold tabular-nums">
                  {formatINR(le.fdCallableSplit.callable.marketValueINR)}
                </p>
                <p className="text-xs text-muted-foreground">{le.fdCallableSplit.callable.count} FDs</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Non-callable</p>
                <p className="text-base font-semibold tabular-nums">
                  {formatINR(le.fdCallableSplit.nonCallable.marketValueINR)}
                </p>
                <p className="text-xs text-muted-foreground">{le.fdCallableSplit.nonCallable.count} FDs</p>
              </div>
            </div>

            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Segment</TableHead>
                    <TableHead className="text-xs text-right">XIRR</TableHead>
                    <TableHead className="text-xs text-right">Unrealized P&amp;L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {le.leReturnsSplit.map((r) => (
                    <TableRow key={r.segment}>
                      <TableCell className="text-xs">{r.label}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        {r.valueWeightedXirrPct != null ? `${r.valueWeightedXirrPct.toFixed(2)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        {formatINR(r.unrealizedPLNIR)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 rounded-xl shadow-none">
        <CardContent className="pt-4 pb-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            FD liquidation scenario (illustrative)
          </h3>
          <p className="text-xs text-muted-foreground">
            {liquidationSim?.formulaDescription ??
              "Model uses applied amount × penalty % as a simple charge; post cash adds net proceeds to idle bank. Not advice — confirm with your bank."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <div className="space-y-1 min-w-[200px] flex-1">
              <label className="text-xs text-muted-foreground">
                Break % of total FD MV: {liqPct.toFixed(0)}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={liqPct}
                onChange={(e) => setLiqPct(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground">Penalty (% p.a. shorthand)</label>
              <div className="flex gap-2">
                <Input
                  className="font-mono text-sm w-24"
                  value={penaltyInput}
                  onChange={(e) => setPenaltyInput(e.target.value)}
                  onBlur={commitDefaultPenalty}
                />
                <Button type="button" variant="secondary" size="sm" onClick={commitDefaultPenalty}>
                  Save default
                </Button>
              </div>
            </div>
          </div>
          {liquidationSim && penaltyOk && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Idle bank (before)</p>
                <p className="font-semibold tabular-nums">{formatINR(liquidationSim.idleBankBeforeINR)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Applied / penalty / net to bank</p>
                <p className="font-semibold tabular-nums">
                  {formatINR(liquidationSim.appliedINR)} − {formatINR(liquidationSim.penaltyINR)} ={" "}
                  {formatINR(liquidationSim.appliedINR - liquidationSim.penaltyINR)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Post scenario bank cash</p>
                <p className="font-semibold tabular-nums">
                  {formatINR(liquidationSim.postLiquidationBankINR)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Remaining FD MV · lost coupon (indic.)</p>
                <p className="font-semibold tabular-nums">
                  {formatINR(liquidationSim.remainingFDMVINR)} ·{" "}
                  {formatINR(liquidationSim.indicativeLostAnnualCouponINR)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Blended coupon {liquidationSim.blendedCouponAnnualPctApplied.toFixed(2)}% p.a.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
