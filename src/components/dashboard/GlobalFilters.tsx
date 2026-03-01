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
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-card">
      <span className="text-sm font-medium text-muted-foreground">
        Filters
      </span>

      <div className="flex items-center gap-2">
        <label htmlFor="filter-from" className="text-sm text-muted-foreground whitespace-nowrap">
          From
        </label>
        <input
          id="filter-from"
          type="date"
          value={fromStr}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="filter-to" className="text-sm text-muted-foreground whitespace-nowrap">
          To
        </label>
        <input
          id="filter-to"
          type="date"
          value={toStr}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <Select
        value={filters.assetClasses.join(",") || "all"}
        onValueChange={(v) =>
          setFilters({
            assetClasses: v === "all" ? [] : [v as (typeof ASSET_TYPES)[number]],
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Asset Class" />
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
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sector" />
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

      <Select
        value={filters.marketCaps.join(",") || "all"}
        onValueChange={(v) =>
          setFilters({
            marketCaps: v === "all" ? [] : [v as (typeof MARKET_CAPS)[number]],
          })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Market Cap" />
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

      <Select
        value={filters.gainFilter}
        onValueChange={(v) =>
          setFilters({ gainFilter: v as "all" | "gain" | "loss" })
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="gain">Gainers</SelectItem>
          <SelectItem value="loss">Losers</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.valueMode}
        onValueChange={(v) =>
          setFilters({ valueMode: v as "absolute" | "percentage" })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="absolute">Absolute</SelectItem>
          <SelectItem value="percentage">Percentage</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.inrScale ?? "lac"}
        onValueChange={(v) => setFilters({ inrScale: v as InrScale })}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Value in" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="absolute">Absolute</SelectItem>
          <SelectItem value="lac">Lac</SelectItem>
          <SelectItem value="cr">Cr</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
