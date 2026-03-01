"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Portfolio Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Portfolio intelligence — allocation, returns, risk, compliance and rolling performance
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
