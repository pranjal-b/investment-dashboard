/**
 * Centralized ECharts theme for institutional, minimal 2026 fintech aesthetic.
 * Private bank / Bloomberg Terminal modern web / Linear-Vercel tone.
 */


// Professional palette: Slate neutrals
export const SLATE = {
  900: "#0f172a",
  600: "#475569",
  400: "#94a3b8",
  200: "#e2e8f0",
} as const;

// Asset-class accent colors (muted, professional)
export const ASSET_COLORS: Record<string, string> = {
  Equity: "#2563EB",      // Blue 600
  MutualFund: "#059669", // Emerald 600
  PMS: "#7C3AED",        // Violet 600
  AIF: "#DC2626",        // Red 600
  ETF: "#D97706",        // Amber 600
};

// Muted semantic (no pure red/green for gain/loss)
export const SEMANTIC = {
  positive: "#059669",   // Emerald 600
  negative: "#B91C1C",   // Red 700 muted
  neutral: SLATE[600],
};

// Bar/series fallback order
export const CHART_COLORS = [
  ASSET_COLORS.Equity,
  ASSET_COLORS.MutualFund,
  ASSET_COLORS.PMS,
  ASSET_COLORS.AIF,
  ASSET_COLORS.ETF,
];

/** Indian Rupee with grouping (e.g. ₹12.5 Cr) */
export function formatINR(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)} L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

/** Percentage, 1 decimal */
export function formatPct(value: number): string {
  return `${value >= 0 ? "" : ""}${value.toFixed(1)}%`;
}

/**
 * Reusable ECharts theme: transparent bg, subtle grid, dark minimal tooltip,
 * Inter/Geist-friendly text, no gradients.
 */
export function createModernTheme(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: "var(--font-sans), Inter, system-ui, sans-serif",
      fontSize: 12,
      color: SLATE[600],
    },
    title: {
      textStyle: { fontWeight: 600, color: SLATE[900], fontSize: 14 },
      subtextStyle: { color: SLATE[600], fontSize: 12 },
    },
    grid: {
      containLabel: true,
      left: 16,
      right: 16,
      top: 24,
      bottom: 24,
    },
    xAxis: {
      axisLine: { lineStyle: { color: "rgba(0,0,0,0.08)" } },
      axisLabel: { color: SLATE[600], fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: "rgba(0,0,0,0.05)" } },
    },
    yAxis: {
      axisLine: { show: false },
      axisLabel: { color: SLATE[600], fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(0,0,0,0.05)" } },
    },
    tooltip: {
      backgroundColor: "rgba(15,23,42,0.92)",
      borderColor: "transparent",
      textStyle: { color: "#f1f5f9", fontSize: 12 },
      padding: [10, 14],
      confine: true,
      ...overrides?.tooltip,
    },
    legend: {
      bottom: 0,
      type: "scroll",
      textStyle: { color: SLATE[600], fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16,
      icon: "roundRect",
      ...overrides?.legend,
    },
    ...overrides,
  };
}

/** Container options: 16px radius, 24px padding, very subtle shadow */
export const CHART_CONTAINER_CLASS = "rounded-2xl p-6 min-h-[280px]";
export const CHART_CONTAINER_STYLE = {
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
