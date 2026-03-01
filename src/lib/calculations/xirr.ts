/**
 * XIRR (Extended Internal Rate of Return) calculation
 * Uses Newton-Raphson method via the xirr package
 * For irregular cashflows - standard for portfolio return calculation
 */

import { differenceInDays } from "date-fns";
import xirr from "xirr";
import type { Transaction } from "@/lib/types";

/**
 * Convert annualized XIRR to period return % for a given date range.
 * Use this when compounding period-by-period (e.g. indexed base 100).
 * Formula: periodReturn = (1 + annualizedIrr)^(days/365) - 1, then periodReturn * 100.
 */
export function periodReturnPctFromXIRR(
  annualizedIrr: number,
  range: [Date, Date]
): number {
  const [start, end] = range;
  const days = Math.max(1, differenceInDays(end, start));
  const periodReturn = Math.pow(1 + annualizedIrr, days / 365) - 1;
  return periodReturn * 100;
}

/**
 * Compute XIRR from an array of transactions
 * XIRR finds the annualized rate of return where NPV = 0
 * @param transactions - Array of {date, amount} - negative = outflow, positive = inflow
 * @param dateRange - Optional date filter [start, end]
 * @returns Annualized return as decimal (0.15 = 15%) or null if insufficient data
 */
export function computeXIRR(
  transactions: Transaction[],
  dateRange?: [Date, Date] | null
): number | null {
  if (!transactions.length) return null;

  let filtered = transactions;
  if (dateRange && dateRange[0] && dateRange[1]) {
    const [start, end] = dateRange;
    filtered = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }

  if (filtered.length < 2) return null;

  // xirr expects { amount, when }
  const xirrInput = filtered.map((t) => ({
    amount: t.amount,
    when: new Date(t.date),
  }));

  try {
    const rate = xirr(xirrInput);
    return rate;
  } catch {
    return null;
  }
}

/**
 * Convert holdings transactions to aggregate cashflows for portfolio XIRR
 * Aggregates all buy/sell/dividend/nav transactions by date
 */
export function aggregateCashflows(
  holdings: { transactions: Transaction[] }[]
): { date: string; amount: number }[] {
  const byDate = new Map<string, number>();

  for (const h of holdings) {
    for (const t of h.transactions) {
      const existing = byDate.get(t.date) ?? 0;
      byDate.set(t.date, existing + t.amount);
    }
  }

  return Array.from(byDate.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
