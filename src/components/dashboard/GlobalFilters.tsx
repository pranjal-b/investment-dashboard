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
import { useDashboardStore } from "@/lib/store/dashboardStore";
import { ASSET_TYPES, MARKET_CAPS, type InrScale } from "@/lib/types";
import { X } from "lucide-react";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const inputBase =
  "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function FilterCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export function GlobalFilters() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);
  const selectedSector = useDashboardStore((s) => s.filters.selectedSector);
  const dateRange = filters.dateRange;
  const fromStr = dateRange ? toDateString(dateRange[0]) : "";
  const toStr = dateRange ? toDateString(dateRange[1]) : "";

  const sectorOptions = useMemo(
    () => [
      "Banking",
      "IT",
      "Pharma",
      "FMCG",
      "Auto",
      "CapitalGoods",
      "Energy",
      "Infra",
      "Consumption",
      "Chemicals",
    ],
    []
  );

  const hasActiveFilters =
    filters.assetClasses.length > 0 ||
    filters.sectors.length > 0 ||
    filters.marketCaps.length > 0 ||
    filters.gainFilter !== "all" ||
    selectedSector;

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
    <section className="rounded-xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <header className="border-b px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          Filters
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Date range, asset class, sector, and display options
        </p>
      </header>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-x-6 gap-y-5">
          <FilterCell label="From">
            <input
              id="filter-from"
              type="date"
              value={fromStr}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputBase}
            />
          </FilterCell>
          <FilterCell label="To">
            <input
              id="filter-to"
              type="date"
              value={toStr}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputBase}
            />
          </FilterCell>

          <FilterCell label="Asset Class">
            <Select
              value={filters.assetClasses.join(",") || "all"}
              onValueChange={(v) =>
                setFilters({
                  assetClasses: v === "all" ? [] : [v as (typeof ASSET_TYPES)[number]],
                })
              }
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Asset Classes</SelectItem>
                {ASSET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterCell>

          <FilterCell label="Sector">
            <Select
              value={filters.sectors.join(",") || selectedSector || "all"}
              onValueChange={(v) => {
                if (v === "all") {
                  setFilters({ sectors: [], selectedSector: null });
                } else {
                  setFilters({ sectors: [v], selectedSector: v });
                }
              }}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectorOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterCell>

          <FilterCell label="Market Cap">
            <Select
              value={filters.marketCaps.join(",") || "all"}
              onValueChange={(v) =>
                setFilters({
                  marketCaps: v === "all" ? [] : [v as (typeof MARKET_CAPS)[number]],
                })
              }
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Market Caps</SelectItem>
                {MARKET_CAPS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterCell>

          <FilterCell label="Gain / Loss">
            <Select
              value={filters.gainFilter}
              onValueChange={(v) =>
                setFilters({ gainFilter: v as "all" | "gain" | "loss" })
              }
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="gain">Gainers</SelectItem>
                <SelectItem value="loss">Losers</SelectItem>
              </SelectContent>
            </Select>
          </FilterCell>

          <FilterCell label="Value Mode">
            <Select
              value={filters.valueMode}
              onValueChange={(v) =>
                setFilters({ valueMode: v as "absolute" | "percentage" })
              }
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absolute">Absolute</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </FilterCell>

          <FilterCell label="INR Scale">
            <Select
              value={filters.inrScale ?? "lac"}
              onValueChange={(v) => setFilters({ inrScale: v as InrScale })}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Lac" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absolute">Absolute</SelectItem>
                <SelectItem value="lac">Lac</SelectItem>
                <SelectItem value="cr">Cr</SelectItem>
              </SelectContent>
            </Select>
          </FilterCell>

          <FilterCell label="Actions">
            <div className="flex items-end h-9">
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="w-full text-muted-foreground border-dashed"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground/70 py-2">
                  —
                </span>
              )}
            </div>
          </FilterCell>
        </div>
      </div>
    </section>
  );
}
