import { NextRequest, NextResponse } from "next/server";
import { listDeals } from "@/lib/deals";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;

    const deals = await listDeals(userId ?? undefined, 50);

    return NextResponse.json({ deals });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load deals" },
      { status: 500 }
    );
  }
}
