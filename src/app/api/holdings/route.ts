import { NextResponse } from "next/server";
import holdingsData from "@/data/mock-holdings.json";
import type { Holding } from "@/lib/types";

export async function GET() {
  const holdings = holdingsData.holdings as Holding[];
  return NextResponse.json({ holdings });
}
