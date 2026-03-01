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
import { ASSET_TYPES, MARKET_CAPS } from "@/lib/types";
import { X } from "lucide-react";

export function GlobalFilters() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);
  const selectedSector = useDashboardStore((s) => s.filters.selectedSector);

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

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-card">
      <span className="text-sm font-medium text-muted-foreground">
        Filters
      </span>

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
