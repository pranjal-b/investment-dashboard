"use client";

import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedControlOption<T>[] | readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

function normalizeOptions<T extends string>(
  options: readonly SegmentedControlOption<T>[] | readonly T[]
): { value: T; label: string }[] {
  return options.map((opt) =>
    typeof opt === "object" && opt !== null && "value" in opt
      ? { value: (opt as SegmentedControlOption<T>).value, label: (opt as SegmentedControlOption<T>).label }
      : { value: opt as T, label: String(opt) }
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const normalized = normalizeOptions(options);
  return (
    <div
      className={cn(
        "inline-flex bg-slate-100 rounded-xl p-1 transition-[box-shadow] duration-150",
        className
      )}
      role="group"
      aria-label="Segmented control"
    >
      {normalized.map(({ value: optValue, label }) => {
        const isSelected = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150",
              isSelected
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            )}
            aria-pressed={isSelected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
