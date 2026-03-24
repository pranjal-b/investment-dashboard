"use client";

import type { Holding } from "@/lib/types";
import { getAllocationSleeve } from "@/lib/classification/sleeveClassifier";

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "number" ? value.toLocaleString("en-IN") : String(value);
  return (
    <div className="flex justify-between gap-4 text-xs border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 text-right font-medium break-all">{display}</span>
    </div>
  );
}

function inferSubtypeLabel(h: Holding): string {
  if (h.instrumentSubtype) return h.instrumentSubtype.replace(/_/g, " ");
  const sleeve = getAllocationSleeve(h);
  if (h.assetType === "Equity") return "direct equity (inferred)";
  if (h.assetType === "DebtMF" && sleeve === "liquid") return "liquid / cash-like (inferred)";
  if (h.assetType === "AIF") return "unlisted AIF (inferred)";
  return `${h.assetType} · ${sleeve}`;
}

export function SubtypeFolioPanel({ holding: h }: { holding: Holding }) {
  const sleeve = getAllocationSleeve(h);
  const st = h.instrumentSubtype;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h4 className="text-sm font-semibold text-slate-900">Line-item detail</h4>
        <span className="text-xs rounded-full bg-slate-200/80 px-2 py-0.5 text-slate-700 capitalize">
          {sleeve}
        </span>
        <span className="text-xs text-slate-500">{inferSubtypeLabel(h)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(st === "liquid_fund" || st === "arbitrage" || st === "credit_fund" || h.fundFolio) && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Fund folio
            </p>
            <Row label="Folio no." value={h.fundFolio?.folioNumber} />
            <Row label="Investment date" value={h.fundFolio?.investmentDate} />
            <Row label="As of" value={h.fundFolio?.valuationAsOfDate} />
            <Row label="Script / ISIN" value={h.fundFolio?.scriptCode} />
            <Row label="Fund house" value={h.fundFolio?.fundHouse} />
            <Row label="Advisor" value={h.fundFolio?.advisorName} />
            <Row label="DP" value={h.fundFolio?.depositoryParticipant} />
            <Row label="Units" value={h.fundFolio?.units} />
            <Row label="Avg cost" value={h.fundFolio?.averageCostPerUnit} />
            <Row label="NAV" value={h.fundFolio?.nav} />
            <Row label="IRR (rough) %" value={h.fundFolio?.irrRoughPct} />
            <Row label="Entity" value={h.fundFolio?.entityName ?? h.fundFolio?.legalEntityId} />
          </div>
        )}

        {st === "bank_balance" && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Bank balance
            </p>
            <Row label="Bank" value={h.bankAccount?.bankName} />
            <Row label="Entity" value={h.bankAccount?.entityName} />
            <Row label="Balance" value={h.bankAccount?.currentBalance} />
            <Row label="As of" value={h.bankAccount?.balanceAsOfDate} />
          </div>
        )}

        {(st === "short_maturity_bond" || h.shortMaturityBond) && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Short maturity bond
            </p>
            <Row label="Maturity" value={h.shortMaturityBond?.maturityDate} />
            <Row label="YTM at inv. %" value={h.shortMaturityBond?.ytmAtInvestmentPct} />
            <Row label="Collateral" value={h.bondCollateralType} />
            <Row label="Seniority" value={h.bondSeniority} />
            <Row label="Rating" value={h.creditRating} />
            <Row label="Script" value={h.shortMaturityBond?.scriptCode} />
          </div>
        )}

        {st === "direct_equity" && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Direct equity
            </p>
            <Row label="Portfolio" value={h.directEquity?.portfolioLabel} />
            <Row label="Mandate" value={h.equityMandate} />
            <Row label="Advisor" value={h.directEquity?.advisorName} />
            <Row label="DP" value={h.directEquity?.depositoryParticipant} />
            <Row label="Pledged" value={h.directEquity?.isPledged === true ? "Yes" : h.directEquity?.isPledged === false ? "No" : undefined} />
          </div>
        )}

        {(st === "equity_etf" || st === "gold_etf") && h.equityEtf && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              {st === "gold_etf" ? "Gold ETF" : "Equity ETF"}
            </p>
            <Row label="Folio" value={h.equityEtf.folioNumber} />
            <Row label="Script" value={h.equityEtf.scriptCode} />
            <Row label="Fund house" value={h.equityEtf.fundHouse} />
            <Row label="Units" value={h.equityEtf.units} />
            <Row label="NAV" value={h.equityEtf.nav} />
          </div>
        )}

        {st === "gold_etf" && h.goldEtf && !h.equityEtf && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Gold ETF</p>
            <Row label="Scripts" value={h.goldEtf.scriptCodes?.join(", ")} />
            <Row label="Primary ISIN" value={h.goldEtf.scriptCode} />
            <Row label="Fund house" value={h.goldEtf.fundHouse} />
            <Row label="Units" value={h.goldEtf.units} />
            <Row label="NAV" value={h.goldEtf.nav} />
          </div>
        )}

        {(st === "reit" || st === "invit") && h.reitInvit && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              REIT / InvIT
            </p>
            <Row label="Scripts" value={h.reitInvit.scriptCodes?.join(", ")} />
            <Row label="Advisor" value={h.reitInvit.advisorName} />
            <Row label="DP" value={h.reitInvit.depositoryParticipant} />
            <Row label="Units" value={h.reitInvit.units} />
            <Row label="NAV" value={h.reitInvit.nav} />
          </div>
        )}

        {(st === "feeder_fund" || h.feederFund) && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Feeder / offshore</p>
            <Row label="Scripts" value={h.feederFund?.scriptCodes?.join(", ")} />
            <Row label="Fund house" value={h.feederFund?.fundHouse} />
            <Row label="Advisor" value={h.feederFund?.advisorName} />
          </div>
        )}

        {(st === "equity_mf" || h.equityMf) && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Equity MF</p>
            <Row label="Custodian bank" value={h.equityMf?.custodianBankName} />
            <Row label="DP" value={h.equityMf?.depositoryParticipant} />
            <Row label="Scheme tag" value={h.equityMf?.equitySchemeTag} />
          </div>
        )}

        {(st === "pms" || (h.assetType === "PMS" && !st)) && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">PMS</p>
            <Row label="Subtype" value={st ?? "pms (vehicle)"} />
            <Row label="TER %" value={h.ter} />
          </div>
        )}

        {(st === "pe_direct_early" || st === "pe_growth" || h.peDirectEarly || h.peGrowth) && (
          <div className="bg-white rounded-lg border border-slate-200 p-3 md:col-span-2">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Unlisted · PE / direct
            </p>
            <Row label="Stage" value={h.unlistedStage} />
            <Row label="SOA date" value={h.peDirectEarly?.soaAsOfDate ?? h.peGrowth?.soaAsOfDate} />
            <Row label="Profit ₹" value={h.peDirectEarly?.profitRs ?? h.peGrowth?.profitRs} />
            <Row label="Income ₹" value={h.peDirectEarly?.incomeRs ?? h.peGrowth?.incomeRs} />
            <Row label="Capital ₹" value={h.peDirectEarly?.capitalRs ?? h.peGrowth?.capitalRs} />
            <Row label="Remaining DD" value={h.peDirectEarly?.remainingDrawdownCommitment ?? h.peGrowth?.remainingDrawdownCommitment} />
            <Row label="DIS / dist. value" value={h.peGrowth?.distributionsCurrentValue} />
            <Row label="SOA reconciled" value={h.peGrowth?.soaReconciled === true ? "Yes" : h.peGrowth?.soaReconciled === false ? "No" : undefined} />
          </div>
        )}

        {(h.bondCollateralType || h.bondSeniority) && st !== "short_maturity_bond" && sleeve === "debt" && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Credit structure</p>
            <Row label="Collateral" value={h.bondCollateralType} />
            <Row label="Seniority" value={h.bondSeniority} />
            <Row label="Rating" value={h.creditRating} />
          </div>
        )}
      </div>
    </div>
  );
}
