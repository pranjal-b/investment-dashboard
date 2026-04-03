"use client";

import { useEffect, lazy, Suspense } from "react";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { TopKPIBar } from "@/components/dashboard/TopKPIBar";
import { PerformanceMatrix } from "@/components/dashboard/PerformanceMatrix";
import { FYPerformanceSection } from "@/components/dashboard/FYPerformance";
import { AllocationOverview } from "@/components/dashboard/AllocationOverview";
import { SectorMarketSplit } from "@/components/dashboard/SectorMarketSplit";
import { BondTreasuryDiagnostics } from "@/components/dashboard/BondTreasuryDiagnostics";
import { LiquidEquivalentsSection } from "@/components/dashboard/LiquidEquivalents";

const HoldingsTable = lazy(() =>
  import("@/components/dashboard/InvestmentTable/HoldingsTable").then((m) => ({
    default: m.HoldingsTable,
  }))
);

export default function InvestmentDashboardPage() {
  const setHoldings = useDashboardStore((s) => s.setHoldings);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setHoldings(data.holdings ?? []);
      })
      .catch(() => {
        /* Keep pre-hydrated demo holdings from store if request fails */
      });
    return () => {
      cancelled = true;
    };
  }, [setHoldings]);

  return (
    <>
      <GlobalFilters />
      <div className="space-y-4">
        <TopKPIBar />
        <AllocationOverview />
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Performance</h2>
          <PerformanceMatrix />
          <FYPerformanceSection />
        </div>
        <LiquidEquivalentsSection />
        <BondTreasuryDiagnostics />
        <SectorMarketSplit />
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <HoldingsTable />
      </Suspense>
    </>
  );
}
