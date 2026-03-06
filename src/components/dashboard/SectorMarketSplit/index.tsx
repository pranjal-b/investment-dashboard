"use client";

import { SectorDonut } from "./SectorDonut";
import { MarketCapDonut } from "./MarketCapDonut";

export function SectorMarketSplit() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">
        Sector & Market Cap Split
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-800 mb-2 border-b border-slate-100 pb-2">
            Sector exposure
          </h3>
          <SectorDonut />
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-800 mb-2 border-b border-slate-100 pb-2">
            Market cap exposure
          </h3>
          <MarketCapDonut />
        </div>
      </div>
    </div>
  );
}
