"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BondSplitSlice } from "@/lib/analytics/types";
import { useBondTreasuryDiagnostics, useFormatINR } from "@/lib/store/dashboardStore";
import { createModernTheme, CHART_CONTAINER_CLASS } from "@/lib/charts/chartTheme";

function ratingDistributionBarOption(rows: BondSplitSlice[], pctContext: string) {
  const theme = createModernTheme() as Record<string, unknown>;
  return {
    ...theme,
    grid: { left: 100, right: 24, top: 8, bottom: 24 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const ps = params as { name?: string; axisValue?: string; value?: number; data?: number }[];
        const p = ps[0];
        if (!p) return "";
        const name = String(p.name ?? p.axisValue ?? "");
        const raw = p.value ?? p.data ?? 0;
        const v = typeof raw === "number" ? raw : Number(raw);
        return `${name}<br/>${Number.isFinite(v) ? v.toFixed(1) : raw}% ${pctContext}`;
      },
    },
    xAxis: { type: "value", axisLabel: { formatter: (v: number) => `${v.toFixed(0)}%` } },
    yAxis: {
      type: "category",
      data: rows.map((r) => r.label),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: rows.map((r) => r.pct),
        itemStyle: { color: "#334155", borderRadius: [0, 4, 4, 0] },
      },
    ],
  };
}

const COL_SECURED = "#059669";
const COL_UNSECURED = "#d97706";
const COL_UNKNOWN = "#94a3b8";
const SENIORITY_COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#64748b"];

export function BondTreasuryDiagnostics() {
  const d = useBondTreasuryDiagnostics();
  const formatINR = useFormatINR();

  const collateralOption = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    const pieData = [
      { name: "Secured", value: d.securedVsUnsecured.secured.value },
      { name: "Unsecured", value: d.securedVsUnsecured.unsecured.value },
      { name: "Collateral unknown", value: d.securedVsUnsecured.unknownCollateral.value },
    ].filter((x) => x.value > 0);
    return {
      ...theme,
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      series: [
        {
          type: "pie",
          radius: ["42%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 1 },
          label: { fontSize: 11 },
          data: pieData.map((x) => ({
            ...x,
            itemStyle: {
              color:
                x.name === "Secured"
                  ? COL_SECURED
                  : x.name === "Unsecured"
                    ? COL_UNSECURED
                    : COL_UNKNOWN,
            },
          })),
        },
      ],
    };
  }, [d.securedVsUnsecured]);

  const seniorityOption = useMemo(() => {
    const theme = createModernTheme() as Record<string, unknown>;
    const data = d.seniorityBreakdown.map((s) => ({ name: s.label, value: s.value }));
    return {
      ...theme,
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      series: [
        {
          type: "pie",
          radius: ["42%", "70%"],
          data: data.map((x, i) => ({
            ...x,
            itemStyle: { color: SENIORITY_COLORS[i % SENIORITY_COLORS.length] },
          })),
          label: { fontSize: 11 },
        },
      ],
    };
  }, [d.seniorityBreakdown]);

  const fullRatingBarOption = useMemo(
    () => ratingDistributionBarOption(d.ratingDistribution, "of total debt MV"),
    [d.ratingDistribution]
  );

  const unsecuredRatingBarOption = useMemo(
    () => ratingDistributionBarOption(d.unsecuredRatingDistribution, "of unsecured MV"),
    [d.unsecuredRatingDistribution]
  );

  const hasFullRatings = d.ratingDistribution.length > 0;
  const hasUnsecuredRatings = d.unsecuredRatingDistribution.length > 0;
  const showRatingTabs = hasFullRatings && hasUnsecuredRatings;

  if (d.totalDebtValue <= 0) {
    return (
      <Card className="border border-border/60 rounded-xl shadow-none">
        <CardContent className="pt-6 pb-4">
          <h2 className="text-lg font-semibold text-foreground mb-1">Debt investment diagnostics</h2>
          <p className="text-sm text-muted-foreground">{d.overallAssessment}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Debt investment diagnostics</h2>
      <p className="text-sm text-muted-foreground">
        Debt sleeve MV <span className="font-medium text-foreground">{formatINR(d.totalDebtValue)}</span>
        {" · "}
        Unsecured {d.riskSignals.unsecuredPct.toFixed(1)}% · Unspecified seniority{" "}
        {d.riskSignals.unspecifiedSeniorityPct.toFixed(1)}% · Unrated / NR{" "}
        {d.riskSignals.unratedPct.toFixed(1)}%
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="border border-border/60 rounded-xl shadow-none">
          <CardContent className="pt-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Secured vs unsecured
            </h3>
            <div className={`h-[220px] w-full ${CHART_CONTAINER_CLASS}`}>
              <ReactECharts option={collateralOption} style={{ height: 220 }} opts={{ renderer: "canvas" }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unknown collateral treated as a data gap, not “unsecured quality”.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 rounded-xl shadow-none">
          <CardContent className="pt-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Payment seniority
            </h3>
            <div className={`h-[220px] w-full ${CHART_CONTAINER_CLASS}`}>
              <ReactECharts option={seniorityOption} style={{ height: 220 }} opts={{ renderer: "canvas" }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 rounded-xl shadow-none xl:row-span-1">
          <CardContent className="pt-4 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Key risk insights
            </h3>
            <ul className="text-sm space-y-2 list-disc pl-4 text-foreground/90">
              {d.riskSignals.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-border/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Overall assessment
              </p>
              <p className="text-sm text-foreground">{d.overallAssessment}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Indicative, based on filtered holdings and ingested ratings/seniority only — not investment advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 rounded-xl shadow-none">
        <CardContent className="pt-4 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Rating distribution
          </h3>
          {!hasFullRatings && !hasUnsecuredRatings ? (
            <p className="text-sm text-muted-foreground py-6">No rating fields on debt positions.</p>
          ) : showRatingTabs ? (
            <Tabs defaultValue="full" className="w-full">
              <TabsList className="mb-2 h-auto flex-wrap justify-start gap-1 bg-muted/80 p-1">
                <TabsTrigger value="full" className="text-xs sm:text-sm">
                  Full book (% of MV)
                </TabsTrigger>
                <TabsTrigger value="unsecured" className="text-xs sm:text-sm">
                  Unsecured (% of unsecured)
                </TabsTrigger>
              </TabsList>
              <p className="text-xs text-muted-foreground mb-2">
                Same rating buckets; full book uses total debt MV, unsecured tab uses unsecured MV only.
              </p>
              <TabsContent value="full" className="mt-0">
                <div className={`w-full min-h-[200px] ${CHART_CONTAINER_CLASS}`}>
                  <ReactECharts
                    option={fullRatingBarOption}
                    style={{ height: Math.max(200, d.ratingDistribution.length * 28) }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="unsecured" className="mt-0">
                <div className={`w-full min-h-[200px] ${CHART_CONTAINER_CLASS}`}>
                  <ReactECharts
                    option={unsecuredRatingBarOption}
                    style={{ height: Math.max(200, d.unsecuredRatingDistribution.length * 28) }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : hasFullRatings ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">% of total debt sleeve MV.</p>
              <div className={`w-full min-h-[200px] ${CHART_CONTAINER_CLASS}`}>
                <ReactECharts
                  option={fullRatingBarOption}
                  style={{ height: Math.max(200, d.ratingDistribution.length * 28) }}
                  opts={{ renderer: "canvas" }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Unsecured sleeve — each bar is % of unsecured MV (bars sum to ~100%).
              </p>
              <div className={`w-full min-h-[200px] ${CHART_CONTAINER_CLASS}`}>
                <ReactECharts
                  option={unsecuredRatingBarOption}
                  style={{ height: Math.max(200, d.unsecuredRatingDistribution.length * 28) }}
                  opts={{ renderer: "canvas" }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
