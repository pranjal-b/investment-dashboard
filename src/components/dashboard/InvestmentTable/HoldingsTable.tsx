"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useFilteredHoldings } from "@/lib/store/dashboardStore";
import { computeAssetMetrics } from "@/lib/calculations/metrics";
import type { Holding } from "@/lib/types";
import { RowExpandableContent } from "./RowExpandableContent";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

const columnHelper = createColumnHelper<Holding>();

export function HoldingsTable() {
  const holdings = useFilteredHoldings();
  const dateRange = useDashboardStore((s) => s.filters.dateRange);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<Holding, any>[]>(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) => {
          const id = row.original.id;
          const isExpanded = expandedRows.has(id);
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setExpandedRows((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          );
        },
      },
      columnHelper.accessor("assetName", {
        header: "Asset Name",
        cell: (info) => (
          <span className="font-medium text-slate-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("assetType", {
        header: "Type",
        cell: (info) => (
          <span className="text-slate-500 text-sm">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("investedAmount", {
        header: "Invested",
        cell: (info) => (
          <span className="text-slate-800 tabular-nums">{formatCurrency(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor("currentValue", {
        header: "Current Value",
        cell: (info) => (
          <span className="text-slate-800 tabular-nums">{formatCurrency(info.getValue())}</span>
        ),
      }),
      {
        id: "gainPct",
        header: "Gain %",
        cell: ({ row }) => {
          const m = computeAssetMetrics(row.original, dateRange ?? undefined);
          const pct = m.gainPercent;
          const className =
            pct === null
              ? "text-slate-500"
              : pct >= 0
                ? "text-emerald-600 font-medium"
                : "text-rose-600 font-medium";
          return <span className={className}>{formatPercent(pct)}</span>;
        },
      },
      {
        id: "xirr",
        header: "XIRR",
        cell: ({ row }) => {
          const m = computeAssetMetrics(row.original, dateRange ?? undefined);
          return (
            <span className="text-slate-800 tabular-nums">{formatPercent(m.xirrPct)}</span>
          );
        },
      },
      columnHelper.accessor("sector", {
        header: "Sector",
        cell: (info) => (
          <span className="text-slate-500 text-sm">{info.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("marketCap", {
        header: "Market Cap",
        cell: (info) => (
          <span className="text-slate-500 text-sm">{info.getValue() ?? "—"}</span>
        ),
      }),
    ],
    [dateRange, expandedRows]
  );

  const table = useReactTable({
    data: holdings,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const numericColumnIds = new Set(["investedAmount", "currentValue", "gainPct", "xirr"]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Investment Table</h2>
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-56 pl-9 pr-3 rounded-lg border-slate-300 text-sm"
          />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                {headerGroup.headers.map((header) => {
                  const isNumeric = numericColumnIds.has(header.column.id);
                  const widthClass =
                    header.column.id === "expand"
                      ? "w-12"
                      : header.column.id === "assetName"
                        ? "min-w-[180px]"
                        : header.column.id === "assetType"
                          ? "w-24"
                          : header.column.id === "sector" || header.column.id === "marketCap"
                            ? "min-w-[80px]"
                            : header.column.id === "investedAmount" || header.column.id === "currentValue"
                              ? "min-w-[100px]"
                              : header.column.id === "gainPct" || header.column.id === "xirr"
                                ? "min-w-[72px]"
                                : "";
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-xs uppercase tracking-wide text-slate-500 font-medium h-10 px-6",
                        isNumeric && "text-right",
                        widthClass
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <>
                <TableRow
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => {
                    const isNumeric = numericColumnIds.has(cell.column.id);
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "py-3 px-6",
                          isNumeric && "text-right tabular-nums"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {expandedRows.has(row.original.id) && (
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableCell
                      colSpan={columns.length}
                      className="bg-slate-50 p-0 border-t border-slate-200"
                    >
                      <div className="p-6 pl-10">
                        <RowExpandableContent holding={row.original} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-slate-500">
        {holdings.length} holdings
      </p>
    </div>
  );
}
