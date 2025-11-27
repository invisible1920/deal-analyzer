// app/api/deals/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listDeals } from "@/lib/deals";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;

    const deals = await listDeals(userId, 500);

    const headers = [
      "id",
      "createdAt",
      "salePrice",
      "downPayment",
      "payment",
      "profit",
      "pti",
      "ltv",
      "verdict"
    ];

    const rows = deals.map(d => [
      d.id,
      d.createdAt,
      d.input.salePrice,
      d.input.downPayment,
      d.result.payment,
      d.result.totalProfit,
      d.result.paymentToIncome ?? "",
      d.result.ltv,
      d.result.underwritingVerdict
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map(r => r.join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=deals.csv"
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to export deals" },
      { status: 500 }
    );
  }
}
