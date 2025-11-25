import { NextResponse } from "next/server";
import { listDeals } from "@/lib/deals";

export async function GET() {
  try {
    const deals = await listDeals(100);
    return NextResponse.json({ deals });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
