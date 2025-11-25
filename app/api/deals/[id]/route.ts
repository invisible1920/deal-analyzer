import { NextRequest, NextResponse } from "next/server";
import { getDealById } from "@/lib/deals";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deal = await getDealById(params.id);
    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ deal });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
