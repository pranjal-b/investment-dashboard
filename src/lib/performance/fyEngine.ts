/**
 * FY (Financial Year) engine: India Apr–Mar.
 * Pure functions: current FY, range, selectable list. No UI.
 */

/**
 * Current Indian FY string (e.g. "2024-25", "2025-26").
 * If current month >= April (month index 3) → FY = currentYear–(currentYear+1).
 * Else → FY = (currentYear-1)–currentYear.
 */
export function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: Jan=0, Apr=3
  if (month >= 3) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

/**
 * Start and end dates for a given FY string (e.g. "2024-25").
 * Start = Apr 1 of first year, End = Mar 31 of second year.
 */
export function getFYStartEnd(fy: string): { start: Date; end: Date } {
  const parts = fy.split("-").map(Number);
  const y1 = parts[0]!;
  const y2 = parts[1] ?? y1 + 1;
  const startYear = y1 < 100 ? 2000 + y1 : y1;
  const endYear = y2 < 100 ? 2000 + y2 : y2;
  const start = new Date(startYear, 3, 1); // Apr 1
  const end = new Date(endYear, 2, 31); // Mar 31
  return { start, end };
}

/** Number of past FYs to show in selector (excluding current) */
const SELECTABLE_PAST_FY_COUNT = 4;
/** Include next FY in selector (e.g. 2025-26 when current is 2024-25) for sample/forward data */
const INCLUDE_NEXT_FY = true;

/**
 * List of selectable FY strings (e.g. ["2021-22", "2022-23", "2024-25", "2025-26"]).
 * Last N FYs including current, and optionally the next FY for sample data.
 */
export function getSelectableFYList(): string[] {
  const current = getCurrentFY();
  const [startPart] = current.split("-").map(Number);
  const startYear = startPart < 100 ? 2000 + startPart : startPart;
  const list: string[] = [];
  for (let i = SELECTABLE_PAST_FY_COUNT; i >= 0; i--) {
    const y1 = startYear - i;
    const y2 = String(y1 + 1).slice(-2);
    list.push(`${y1}-${y2}`);
  }
  if (INCLUDE_NEXT_FY) {
    const nextY1 = startYear + 1;
    list.push(`${nextY1}-${String(nextY1 + 1).slice(-2)}`);
  }
  return list;
}
