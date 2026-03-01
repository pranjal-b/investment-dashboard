"use client";

import { useRef, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const normalized = normalizeOptions(options);

  useEffect(() => {
    if (!selectedRef.current || !scrollRef.current) return;
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [value]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex overflow-x-auto overflow-y-hidden gap-1 w-full min-w-0 bg-slate-100 rounded-xl p-0.5 scroll-smooth",
        "touch-pan-x overscroll-x-contain",
        className
      )}
      style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      role="group"
      aria-label="Segmented control"
    >
      {normalized.map(({ value: optValue, label }) => {
        const isSelected = value === optValue;
        return (
          <button
            key={optValue}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => onChange(optValue)}
            className={cn(
              "px-2.5 py-1.5 min-h-9 text-sm font-medium rounded-lg transition-all duration-150 shrink-0 whitespace-nowrap",
              "touch-manipulation select-none",
              isSelected
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-800 active:bg-slate-200/50"
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
