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
import { ChevronDown, ChevronRight } from "lucide-react";
import { useFilteredHoldings } from "@/lib/store/dashboardStore";
import { computeAssetMetrics } from "@/lib/calculations/metrics";
import type { Holding } from "@/lib/types";
import { RowExpandableContent } from "./RowExpandableContent";
import { useDashboardStore } from "@/lib/store/dashboardStore";

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
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("assetType", {
        header: "Type",
      }),
      columnHelper.accessor("investedAmount", {
        header: "Invested",
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor("currentValue", {
        header: "Current Value",
        cell: (info) => formatCurrency(info.getValue()),
      }),
      {
        id: "gainPct",
        header: "Gain %",
        cell: ({ row }) => {
          const m = computeAssetMetrics(row.original, dateRange ?? undefined);
          return (
            <span
              className={
                m.gainPercent >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {formatPercent(m.gainPercent)}
            </span>
          );
        },
      },
      {
        id: "xirr",
        header: "XIRR",
        cell: ({ row }) => {
          const m = computeAssetMetrics(row.original, dateRange ?? undefined);
          return formatPercent(m.xirrPct);
        },
      },
      columnHelper.accessor("sector", {
        header: "Sector",
      }),
      columnHelper.accessor("marketCap", {
        header: "Market Cap",
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Investment Table</h2>
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <>
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {expandedRows.has(row.original.id) && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="bg-muted/30 p-4"
                    >
                      <RowExpandableContent holding={row.original} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        {holdings.length} holdings
      </p>
    </div>
  );
}
