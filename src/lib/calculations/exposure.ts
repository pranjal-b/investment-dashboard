/**
 * Exposure analytics: allocation, sector, market cap, vehicle attribution
 */

import type {
  Holding,
  AssetAllocation,
  SectorExposure,
  MarketCapExposure,
  AssetType,
} from "@/lib/types";

/**
 * Compute asset class allocation (% and value)
 */
export function computeAllocation(
  holdings: Holding[]
): { assetType: AssetType; actualPct: number; targetPct: number; value: number }[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (total === 0) return [];

  const byType = new Map<
    AssetType,
    { value: number; targetWeighted: number; count: number }
  >();

  for (const h of holdings) {
    const existing = byType.get(h.assetType) ?? {
      value: 0,
      targetWeighted: 0,
      count: 0,
    };
    existing.value += h.currentValue;
    existing.targetWeighted +=
      (h.targetAllocationPct / 100) * total; // Approx target contribution
    existing.count += 1;
    byType.set(h.assetType, existing);
  }

  // Target allocation: weighted avg of holdings' targetAllocationPct for that asset type
  const result: { assetType: AssetType; actualPct: number; targetPct: number; value: number }[] = [];
  for (const [assetType, data] of Array.from(byType.entries())) {
    const actualPct = total > 0 ? (data.value / total) * 100 : 0;
    const typeHoldings = holdings.filter((h) => h.assetType === assetType);
    const targetPct =
      data.value > 0
        ? typeHoldings.reduce(
            (sum, h) =>
              sum + h.targetAllocationPct * (h.currentValue / data.value),
            0
          )
        : 0;
    result.push({
      assetType,
      actualPct,
      targetPct: Math.min(100, Math.max(0, targetPct)),
      value: data.value,
    });
  }

  return result.sort((a, b) => b.value - a.value);
}

/**
 * Residual allocation = actual % - target % per asset class
 */
export function computeResidualAllocation(
  holdings: Holding[]
): AssetAllocation[] {
  const alloc = computeAllocation(holdings);
  return alloc.map((a) => ({
    ...a,
    residualPct: a.actualPct - a.targetPct,
  }));
}

/**
 * Sector exposure with breakdown by vehicle (Equity, MF, AIF, PMS, ETF)
 */
export function computeSectorExposure(
  holdings: Holding[]
): SectorExposure[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (total === 0) return [];

  const bySector = new Map<
    string,
    { value: number; byVehicle: Record<AssetType, number> }
  >();

  const initVehicle = (): Record<AssetType, number> => ({
    Equity: 0,
    MutualFund: 0,
    AIF: 0,
    PMS: 0,
    ETF: 0,
  });

  for (const h of holdings) {
    // Direct holdings: full value to sector
    const sectors: { sector: string; weight: number }[] = h.sectorSplit
      ? Object.entries(h.sectorSplit).map(([sector, weight]) => ({
          sector,
          weight: weight / 100,
        }))
      : [{ sector: h.sector, weight: 1 }];

    for (const { sector, weight } of sectors) {
      const contrib = h.currentValue * weight;
      const existing = bySector.get(sector) ?? {
        value: 0,
        byVehicle: initVehicle(),
      };
      existing.value += contrib;
      existing.byVehicle[h.assetType] =
        (existing.byVehicle[h.assetType] ?? 0) + contrib;
      bySector.set(sector, existing);
    }
  }

  return Array.from(bySector.entries())
    .map(([sector, data]) => ({
      sector,
      pct: total > 0 ? (data.value / total) * 100 : 0,
      value: data.value,
      byVehicle: data.byVehicle,
    }))
    .filter((s) => s.pct > 0.01)
    .sort((a, b) => b.pct - a.pct);
}

/**
 * Market cap exposure
 */
export function computeMarketCapExposure(
  holdings: Holding[]
): MarketCapExposure[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (total === 0) return [];

  const byCap = new Map<string, number>();
  for (const h of holdings) {
    const v = byCap.get(h.marketCap) ?? 0;
    byCap.set(h.marketCap, v + h.currentValue);
  }

  return Array.from(byCap.entries())
    .map(([marketCap, value]) => ({
      marketCap: marketCap as "Large" | "Mid" | "Small",
      pct: total > 0 ? (value / total) * 100 : 0,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Exposure by vehicle for a specific sector
 */
export function computeExposureByVehicle(
  sector: string,
  holdings: Holding[]
): Record<AssetType, number> {
  const exposures = computeSectorExposure(holdings);
  const match = exposures.find(
    (e) => e.sector.toLowerCase() === sector.toLowerCase()
  );
  return match?.byVehicle ?? {
    Equity: 0,
    MutualFund: 0,
    AIF: 0,
    PMS: 0,
    ETF: 0,
  };
}
