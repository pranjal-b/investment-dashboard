"use client";

import { FYPerformanceSection } from "@/components/dashboard/FYPerformance";

export default function FYPerformancePage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          FY Performance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Month-on-month and quarterly returns vs Nifty 50
        </p>
      </div>
      <FYPerformanceSection />
    </>
  );
}
