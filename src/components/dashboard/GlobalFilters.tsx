"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import {
  MARKET_CAPS,
  SECTORS,
  type PortfolioFilter,
  type ScopeAssetClass,
  type VehicleFilter,
  type ReportingCurrency,
  type ReportingUnits,
} from "@/lib/types";
import { ChevronDown } from "lucide-react";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const inputBase =
  "h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 min-w-0";

const dateInputClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 w-full min-w-[7rem]";

// Options for dropdowns
const PORTFOLIO_OPTIONS: { value: PortfolioFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Core", label: "Core" },
  { value: "New", label: "Satellite" },
  { value: "Old", label: "Legacy" },
];

const SCOPE_ASSET_CLASS_OPTIONS: { value: ScopeAssetClass; label: string }[] = [
  { value: "all", label: "All" },
  { value: "equity", label: "Equity" },
  { value: "debt", label: "Debt" },
  { value: "alternatives", label: "Alternatives" },
  { value: "cash", label: "Cash" },
];

const VEHICLE_OPTIONS: { value: VehicleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "direct", label: "Direct" },
  { value: "mf", label: "MF" },
  { value: "pms", label: "PMS" },
  { value: "aif", label: "AIF" },
  { value: "etf", label: "ETF" },
  { value: "index", label: "Index" },
  { value: "fof", label: "FOF" },
];

const REPORTING_CURRENCY_OPTIONS: { value: ReportingCurrency; label: string }[] = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
];

const REPORTING_UNITS_OPTIONS: { value: ReportingUnits; label: string }[] = [
  { value: "absolute", label: "Absolute" },
  { value: "lac", label: "Lac" },
  { value: "cr", label: "Cr" },
  { value: "million", label: "Million" },
  { value: "billion", label: "Billion" },
];

export function GlobalFilters() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);
  const dateRange = filters.dateRange;
  const fromStr = dateRange ? toDateString(dateRange[0]) : "";
  const toStr = dateRange ? toDateString(dateRange[1]) : "";

  const portfolioFilter = filters.portfolioFilter ?? "all";
  const scopeAssetClass = (filters.scopeAssetClass ?? "all") as ScopeAssetClass;
  const vehicleFilter = (filters.vehicleFilter ?? "all") as VehicleFilter;
  const marketCapValue =
    filters.marketCaps.length === 0 ? "all" : (filters.marketCaps[0] as "all" | "Large" | "Mid" | "Small");
  const reportingCurrency = (filters.reportingCurrency ?? "INR") as ReportingCurrency;
  const reportingUnits = (filters.reportingUnits ?? filters.inrScale ?? "lac") as ReportingUnits;

  const hasActiveFilters =
    scopeAssetClass !== "all" ||
    vehicleFilter !== "all" ||
    (portfolioFilter && portfolioFilter !== "all") ||
    filters.sectors.length > 0 ||
    filters.marketCaps.length > 0 ||
    (filters.reportingCurrency && filters.reportingCurrency !== "INR") ||
    (filters.reportingUnits && filters.reportingUnits !== "lac");

  const filterSummaryParts = useMemo(() => {
    const parts: string[] = [];
    if (portfolioFilter !== "all") parts.push(PORTFOLIO_OPTIONS.find((o) => o.value === portfolioFilter)?.label ?? portfolioFilter);
    if (scopeAssetClass !== "all") parts.push(SCOPE_ASSET_CLASS_OPTIONS.find((o) => o.value === scopeAssetClass)?.label ?? scopeAssetClass);
    if (vehicleFilter !== "all") parts.push(VEHICLE_OPTIONS.find((o) => o.value === vehicleFilter)?.label ?? vehicleFilter);
    if (filters.marketCaps.length > 0) parts.push(`${filters.marketCaps[0]} Cap`);
    if (filters.sectors.length > 0) parts.push(filters.sectors.join(", "));
    return parts;
  }, [portfolioFilter, scopeAssetClass, vehicleFilter, filters.marketCaps, filters.sectors]);

  const setDateFrom = (value: string) => {
    const from = value ? new Date(value + "T00:00:00") : (dateRange?.[0] ?? new Date());
    const to = dateRange?.[1] ?? new Date();
    setFilters({ dateRange: [from, to > from ? to : from] });
  };
  const setDateTo = (value: string) => {
    const from = dateRange?.[0] ?? new Date();
    const to = value ? new Date(value + "T23:59:59") : new Date();
    setFilters({ dateRange: [from, to >= from ? to : from] });
  };

  const selectTriggerClass = "h-9 min-w-[6rem] border-slate-200 bg-white text-slate-800 rounded-lg text-sm font-normal";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 overflow-x-auto">
      <div className="grid grid-cols-10 gap-3 items-end min-w-[800px]">
        {/* Column 1: Date Range (From / To) - extra width for two inputs */}
        <div className="flex flex-col gap-1.5 min-w-0 col-span-2">
          <span className={labelClass}>Date Range</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromStr}
              onChange={(e) => setDateFrom(e.target.value)}
              className={dateInputClass}
              title="From"
              aria-label="From date"
            />
            <span className="text-slate-400 text-sm font-medium shrink-0">→</span>
            <input
              type="date"
              value={toStr}
              onChange={(e) => setDateTo(e.target.value)}
              className={dateInputClass}
              title="To"
              aria-label="To date"
            />
          </div>
        </div>

        {/* Column 2: Portfolio */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Portfolio</span>
          <Select value={portfolioFilter} onValueChange={(v) => setFilters({ portfolioFilter: v as PortfolioFilter })}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {PORTFOLIO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column 3: Asset Class */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Asset Class</span>
          <Select value={scopeAssetClass} onValueChange={(v) => setFilters({ scopeAssetClass: v as ScopeAssetClass })}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_ASSET_CLASS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column 4: Vehicle */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Vehicle</span>
          <Select value={vehicleFilter} onValueChange={(v) => setFilters({ vehicleFilter: v as VehicleFilter })}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column 5: Sector (multi-select dropdown) */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Sector</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={selectTriggerClass + " justify-between"}>
                {filters.sectors.length === 0 ? "All Sectors" : filters.sectors.length <= 2 ? filters.sectors.join(", ") : `${filters.sectors.length} sectors`}
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[280px] overflow-y-auto rounded-lg">
            <DropdownMenuLabel>Sectors</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SECTORS.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={filters.sectors.includes(s)}
                onCheckedChange={(checked) => {
                  const next = checked ? [...filters.sectors, s] : filters.sectors.filter((x) => x !== s);
                  setFilters({ sectors: next, selectedSector: next.length === 1 ? next[0] : null });
                }}
              >
                {s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Column 6: Market Cap */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Market Cap</span>
          <Select
            value={marketCapValue}
            onValueChange={(v) => setFilters({ marketCaps: v === "all" ? [] : [v as (typeof MARKET_CAPS)[number]] })}
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {MARKET_CAPS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column 7: Reporting Currency */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Currency</span>
          <Select value={reportingCurrency} onValueChange={(v) => setFilters({ reportingCurrency: v as ReportingCurrency })}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="INR" />
            </SelectTrigger>
            <SelectContent>
              {REPORTING_CURRENCY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column 8: Reporting Units */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Units</span>
          <Select value={reportingUnits} onValueChange={(v) => setFilters({ reportingUnits: v as ReportingUnits })}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Lac" />
            </SelectTrigger>
            <SelectContent>
              {REPORTING_UNITS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column 9: Reset */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className={labelClass}>Actions</span>
          <div className="flex items-center justify-end h-9">
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="text-sm text-slate-500 hover:text-slate-800 whitespace-nowrap">
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {hasActiveFilters && filterSummaryParts.length > 0 && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          Filtered by: {filterSummaryParts.join(" • ")}
        </p>
      )}
    </section>
  );
}
