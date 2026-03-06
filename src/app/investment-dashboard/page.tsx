"use client";

import { useEffect, lazy, Suspense } from "react";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import nifty50History from "@/data/nifty50History.json";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { TopKPIBar } from "@/components/dashboard/TopKPIBar";
import { PerformanceMatrix } from "@/components/dashboard/PerformanceMatrix";
import { FYPerformanceSection } from "@/components/dashboard/FYPerformance";
import { AllocationOverview } from "@/components/dashboard/AllocationOverview";
import { SectorMarketSplit } from "@/components/dashboard/SectorMarketSplit";

const HoldingsTable = lazy(
  () =>
    import("@/components/dashboard/InvestmentTable/HoldingsTable").then((m) => ({
      default: m.HoldingsTable,
    }))
);
export default function InvestmentDashboardPage() {
  const setHoldings = useDashboardStore((s) => s.setHoldings);
  const setBenchmarkSeries = useDashboardStore((s) => s.setBenchmarkSeries);

  useEffect(() => {
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => setHoldings(data.holdings ?? []))
      .catch(() => setHoldings([]));
  }, [setHoldings]);

  useEffect(() => {
    setBenchmarkSeries(nifty50History.series ?? []);
  }, [setBenchmarkSeries]);

  return (
    <>
      <GlobalFilters />
      <div className="space-y-4">
        <TopKPIBar />
        <AllocationOverview />
        <SectorMarketSplit />
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Performance Matrix</h2>
          <PerformanceMatrix />
          <FYPerformanceSection />
        </div>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <HoldingsTable />
      </Suspense>
    </>
  );
}
