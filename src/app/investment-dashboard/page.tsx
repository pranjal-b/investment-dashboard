"use client";

import { useEffect, lazy, Suspense } from "react";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import nifty50History from "@/data/nifty50History.json";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { TopKPIBar } from "@/components/dashboard/TopKPIBar";
import { PerformanceMatrix } from "@/components/dashboard/PerformanceMatrix";
import { StructureMatrix } from "@/components/dashboard/StructureMatrix";
import { AllocationPanel } from "@/components/dashboard/AllocationPanel";
import { FYPerformanceSection } from "@/components/dashboard/FYPerformance";
import { ComplianceMonitor } from "@/components/dashboard/ComplianceMonitor";
import { RiskHygiene } from "@/components/dashboard/RiskHygiene";
import { HoldingsTabs } from "@/components/dashboard/HoldingsTabs";
import { ExposureBifurcation } from "@/components/dashboard/ExposureBifurcation";
import { PortfolioHighlights } from "@/components/dashboard/PortfolioHighlights";
import { RollingPerformanceChart } from "@/components/dashboard/RollingPerformance";
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PerformanceMatrix />
          <StructureMatrix />
        </div>
      </div>
      <SummaryCards />
      <AllocationOverview />
      <AllocationPanel />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">FY Performance</h2>
        <FYPerformanceSection />
      </div>
      <ComplianceMonitor />
      <RiskHygiene />
      <HoldingsTabs />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExposureBifurcation />
        <PortfolioHighlights />
      </div>
      <RollingPerformanceChart />
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
