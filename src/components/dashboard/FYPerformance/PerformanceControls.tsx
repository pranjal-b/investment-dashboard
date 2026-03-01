"use client";

import { useDashboardStore } from "@/lib/store/dashboardStore";
import { getSelectableFYList } from "@/lib/performance/fyEngine";
import { BENCHMARK_LABELS } from "@/lib/performance/benchmarkEngine";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ChevronDown, Info } from "lucide-react";

const BENCHMARK_KEYS = ["nifty50", "nifty500", "sensex", "niftyMidcap"] as const;

const FREQUENCY_OPTIONS = [
  { value: "mom" as const, label: "MoM" },
  { value: "qoq" as const, label: "QoQ" },
  { value: "yoy" as const, label: "YoY" },
];

const Y_AXIS_OPTIONS = [
  { value: "value" as const, label: "Value (₹)" },
  { value: "return" as const, label: "Return %" },
  { value: "indexed" as const, label: "Indexed 100" },
];

const VIEW_BY_OPTIONS = [
  { value: "portfolio" as const, label: "Portfolio" },
  { value: "assetClass" as const, label: "Asset class" },
  { value: "vehicle" as const, label: "Vehicle" },
];

const LABEL_CLASS =
  "text-xs uppercase tracking-wide text-slate-500 font-medium block mb-1";

const SELECT_TRIGGER_CLASS =
  "h-9 min-w-[7rem] border border-slate-200/80 bg-white text-slate-800 rounded-lg text-sm font-normal shadow-none hover:border-slate-300 transition-colors duration-150 focus:ring-1 focus:ring-slate-300";

export function PerformanceControls() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);

  const performanceFY = filters.performanceFY ?? "";
  const performanceFrequency = (filters.performanceFrequency ?? "mom") as
    | "mom"
    | "qoq"
    | "yoy";
  const performanceBenchmarks = filters.performanceBenchmarks ?? ["nifty50"];
  const performanceYAxisMode = (filters.performanceYAxisMode ??
    "indexed") as "value" | "return" | "indexed";
  const performanceViewBy = (filters.performanceViewBy ??
    "portfolio") as "portfolio" | "assetClass" | "vehicle";

  const fyList = getSelectableFYList();

  const toggleBenchmark = (key: string) => {
    const next = performanceBenchmarks.includes(key)
      ? performanceBenchmarks.filter((b) => b !== key)
      : [...performanceBenchmarks, key];
    if (next.length === 0) return;
    setFilters({ performanceBenchmarks: next });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-nowrap items-end gap-6 overflow-x-auto min-w-0 pb-1">
        {/* View by */}
        <div className="flex flex-col gap-1 shrink-0">
          <span className={LABEL_CLASS}>View by</span>
          <Select
            value={performanceViewBy}
            onValueChange={(v) => setFilters({ performanceViewBy: v })}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS + " w-[10rem]"}>
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent>
              {VIEW_BY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* FY */}
        <div className="flex flex-col gap-1 shrink-0">
          <span className={LABEL_CLASS}>FY</span>
          <Select
            value={performanceFY || fyList[0]}
            onValueChange={(v) => setFilters({ performanceFY: v })}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS + " w-[8rem]"}>
              <SelectValue placeholder="Select FY" />
            </SelectTrigger>
            <SelectContent>
              {fyList.map((fy) => (
                <SelectItem key={fy} value={fy}>
                  FY {fy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-1 shrink-0">
          <span className={LABEL_CLASS}>Frequency</span>
          <Select
            value={performanceFrequency}
            onValueChange={(v) => setFilters({ performanceFrequency: v })}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS + " w-[7rem]"}>
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Benchmarks */}
        <div className="flex flex-col gap-1 shrink-0">
          <span className={LABEL_CLASS}>Benchmarks</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={
                  SELECT_TRIGGER_CLASS +
                  " justify-between w-[11rem] cursor-pointer shrink-0"
                }
              >
                <span className="truncate">
                  {performanceBenchmarks.length === 0
                    ? "Select"
                    : performanceBenchmarks.length <= 2
                      ? performanceBenchmarks
                          .map((k) => BENCHMARK_LABELS[k] ?? k)
                          .join(", ")
                      : `${performanceBenchmarks.length} benchmarks`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-52 max-h-[280px] overflow-y-auto rounded-xl border border-slate-200/80 shadow-lg"
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-slate-500">
                Benchmarks
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {BENCHMARK_KEYS.map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={performanceBenchmarks.includes(key)}
                  onCheckedChange={() => toggleBenchmark(key)}
                  className="cursor-pointer"
                >
                  {BENCHMARK_LABELS[key] ?? key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Y-axis */}
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <span className={LABEL_CLASS + " mb-0"}>Y-axis</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex text-slate-400 hover:text-slate-600 cursor-help focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 rounded"
                  tabIndex={0}
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-slate-800 text-slate-100 text-xs font-normal rounded-md px-2.5 py-1.5 max-w-[220px] border-0"
              >
                Rebased to 100 at start of financial year.
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={performanceYAxisMode}
            onValueChange={(v) => setFilters({ performanceYAxisMode: v })}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS + " w-[9rem]"}>
              <SelectValue placeholder="Y-axis" />
            </SelectTrigger>
            <SelectContent>
              {Y_AXIS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </TooltipProvider>
  );
}
