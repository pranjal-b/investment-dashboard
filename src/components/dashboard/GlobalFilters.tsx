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
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import {
  MARKET_CAPS,
  SECTORS,
  type InrScale,
  type PortfolioFilter,
  type PrimaryAssetClass,
} from "@/lib/types";
import { ChevronDown } from "lucide-react";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const inputBase =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all duration-150";

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </span>
      {children}
    </div>
  );
}

const ASSET_CLASS_OPTIONS: { value: PrimaryAssetClass; label: string }[] = [
  { value: "all", label: "All" },
  { value: "equity", label: "Equity" },
  { value: "mf", label: "MF" },
  { value: "pms", label: "PMS" },
  { value: "aif", label: "AIF" },
  { value: "etf", label: "ETF" },
];

const MARKET_CAP_OPTIONS = [
  { value: "all", label: "All" },
  ...MARKET_CAPS.map((c) => ({ value: c, label: c })),
] as const;

const GAIN_LOSS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "gain", label: "Gainers" },
  { value: "loss", label: "Losers" },
] as const;

const VALUE_MODE_OPTIONS = [
  { value: "absolute", label: "₹ Absolute" },
  { value: "percentage", label: "% Percentage" },
] as const;

export function GlobalFilters() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);
  const dateRange = filters.dateRange;
  const fromStr = dateRange ? toDateString(dateRange[0]) : "";
  const toStr = dateRange ? toDateString(dateRange[1]) : "";

  const primaryAssetClass = (filters.primaryAssetClass ?? "all") as PrimaryAssetClass;
  const marketCapValue =
    filters.marketCaps.length === 0 ? "all" : (filters.marketCaps[0] as "all" | "Large" | "Mid" | "Small");
  const gainFilter = filters.gainFilter;
  const valueMode = filters.valueMode;

  const hasActiveFilters =
    primaryAssetClass !== "all" ||
    (filters.portfolioFilter && filters.portfolioFilter !== "all") ||
    filters.sectors.length > 0 ||
    filters.marketCaps.length > 0 ||
    filters.gainFilter !== "all" ||
    filters.valueMode !== "absolute" ||
    (filters.inrScale && filters.inrScale !== "lac");

  const filterSummaryParts = useMemo(() => {
    const parts: string[] = [];
    if (primaryAssetClass !== "all") {
      const label = ASSET_CLASS_OPTIONS.find((o) => o.value === primaryAssetClass)?.label ?? primaryAssetClass;
      parts.push(label);
    }
    if (filters.marketCaps.length > 0) parts.push(`${filters.marketCaps[0]} Cap`);
    if (filters.gainFilter === "gain") parts.push("Gainers");
    if (filters.gainFilter === "loss") parts.push("Losers");
    if (filters.sectors.length > 0) parts.push(filters.sectors.join(", "));
    if (filters.portfolioFilter && filters.portfolioFilter !== "all") parts.push(filters.portfolioFilter);
    return parts;
  }, [
    primaryAssetClass,
    filters.marketCaps,
    filters.gainFilter,
    filters.sectors,
    filters.portfolioFilter,
  ]);

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

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      {/* Primary Toggle Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <FilterGroup title="Asset Class">
          <SegmentedControl
            options={ASSET_CLASS_OPTIONS}
            value={primaryAssetClass}
            onChange={(v) => setFilters({ primaryAssetClass: v as PrimaryAssetClass })}
          />
        </FilterGroup>
        <FilterGroup title="Market Cap">
          <SegmentedControl
            options={MARKET_CAP_OPTIONS}
            value={marketCapValue}
            onChange={(v) =>
              setFilters({
                marketCaps: v === "all" ? [] : [v as (typeof MARKET_CAPS)[number]],
              })
            }
          />
        </FilterGroup>
        <FilterGroup title="Gain / Loss">
          <SegmentedControl
            options={GAIN_LOSS_OPTIONS}
            value={gainFilter}
            onChange={(v) =>
              setFilters({ gainFilter: v as "all" | "gain" | "loss" })
            }
          />
        </FilterGroup>
        <FilterGroup title="Value Mode">
          <SegmentedControl
            options={VALUE_MODE_OPTIONS}
            value={valueMode}
            onChange={(v) =>
              setFilters({ valueMode: v as "absolute" | "percentage" })
            }
          />
        </FilterGroup>
      </div>

      {/* Secondary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <FilterGroup title="Sector">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-9 justify-between font-normal rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                {filters.sectors.length === 0
                  ? "All Sectors"
                  : filters.sectors.length <= 2
                    ? filters.sectors.join(", ")
                    : `${filters.sectors.length} sectors`}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 max-h-[280px] overflow-y-auto rounded-xl"
            >
              <DropdownMenuLabel>Sectors</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SECTORS.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={filters.sectors.includes(s)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...filters.sectors, s]
                      : filters.sectors.filter((x) => x !== s);
                    setFilters({
                      sectors: next,
                      selectedSector: next.length === 1 ? next[0] : null,
                    });
                  }}
                >
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </FilterGroup>

        <FilterGroup title="Date Range">
          <div className="flex items-center gap-2">
            <input
              id="filter-from"
              type="date"
              value={fromStr}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputBase + " flex-1 min-w-0"}
            />
            <span className="text-slate-400 text-sm">→</span>
            <input
              id="filter-to"
              type="date"
              value={toStr}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputBase + " flex-1 min-w-0"}
            />
          </div>
        </FilterGroup>

        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-4 h-9">
            <Select
              value={filters.inrScale ?? "lac"}
              onValueChange={(v) => setFilters({ inrScale: v as InrScale })}
            >
              <SelectTrigger className="h-9 w-[7rem] rounded-lg border-slate-200 bg-white">
                <SelectValue placeholder="Lac" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="absolute">Absolute</SelectItem>
                <SelectItem value="lac">Lac</SelectItem>
                <SelectItem value="cr">Cr</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.portfolioFilter ?? "all"}
              onValueChange={(v) =>
                setFilters({ portfolioFilter: v as PortfolioFilter })
              }
            >
              <SelectTrigger className="h-9 w-[6rem] rounded-lg border-slate-200 bg-white">
                <SelectValue placeholder="Portfolio" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Core">Core</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Old">Old</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors duration-150"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active filter summary */}
      {hasActiveFilters && filterSummaryParts.length > 0 && (
        <p className="text-xs text-slate-500 border-t border-slate-100 pt-4">
          Filtered by: {filterSummaryParts.join(" • ")}
        </p>
      )}
    </section>
  );
}
