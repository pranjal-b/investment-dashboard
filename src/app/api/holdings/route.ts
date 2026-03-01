import { NextResponse } from "next/server";
import holdingsData from "@/data/mock-holdings.json";
import type { Holding } from "@/lib/types";

const PORTFOLIO_TYPES = ["Core", "New", "Old"] as const;

export async function GET() {
  const raw = holdingsData.holdings as Holding[];
  const total = raw.length;
  const holdings = raw.map((h, i) => {
    const bucket = Math.floor((i / total) * 3) % 3;
    return { ...h, portfolioType: PORTFOLIO_TYPES[bucket] as "Core" | "New" | "Old" };
  });
  return NextResponse.json({ holdings });
}
