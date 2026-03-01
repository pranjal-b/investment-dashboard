"use client";

import { useEffect, lazy, Suspense } from "react";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { SummaryCards } from "@/components/dashboard/KPICards/SummaryCards";
import { AllocationOverview } from "@/components/dashboard/AllocationOverview";
import { ExposureAttribution } from "@/components/dashboard/ExposureAttribution";

const SectorExposureSection = lazy(
  () =>
    import("@/components/dashboard/SectorExposure").then((m) => ({
      default: m.SectorExposureSection,
    }))
);
const HoldingsTable = lazy(
  () =>
    import("@/components/dashboard/InvestmentTable/HoldingsTable").then((m) => ({
      default: m.HoldingsTable,
    }))
);
const AdvancedAnalytics = lazy(
  () =>
    import("@/components/dashboard/AdvancedAnalytics").then((m) => ({
      default: m.AdvancedAnalytics,
    }))
);

export default function InvestmentDashboardPage() {
  const setHoldings = useDashboardStore((s) => s.setHoldings);

  useEffect(() => {
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => setHoldings(data.holdings ?? []))
      .catch(() => setHoldings([]));
  }, [setHoldings]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Portfolio Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Indian markets • Prototype with dummy data
        </p>
      </div>

      <GlobalFilters />
      <SummaryCards />
      <AllocationOverview />
      <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-muted" />}>
        <SectorExposureSection />
      </Suspense>
      <ExposureAttribution />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <HoldingsTable />
      </Suspense>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-muted" />}>
        <AdvancedAnalytics />
      </Suspense>
    </>
  );
}
