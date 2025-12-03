// app/api/deals/export/route.ts

import { NextRequest } from "next/server";
import { listDeals } from "@/lib/deals";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const deals = await listDeals(userId, 500); // cap at 500 rows by default

    const header = [
      "id",
      "createdAt",
      "vehicleCost",
      "reconCost",
      "salePrice",
      "downPayment",
      "apr",
      "termWeeks",
      "paymentFrequency",
      "monthlyIncome",
      "monthsOnJob",
      "pastRepo",
      "payment",
      "totalInterest",
      "totalProfit",
      "breakEvenWeek",
      "paymentToIncome",
      "ltv",
      "riskScore",
      "underwritingVerdict"
    ];

    const escape = (value: unknown): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = deals.map(deal => {
      const input = deal.input;
      const result = deal.result;

      return [
        deal.id,
        deal.createdAt,
        input.vehicleCost,
        input.reconCost,
        input.salePrice,
        input.downPayment,
        input.apr,
        input.termWeeks,
        input.paymentFrequency,
        input.monthlyIncome,
        input.monthsOnJob,
        input.pastRepo,
        result.payment,
        result.totalInterest,
        result.totalProfit,
        result.breakEvenWeek,
        result.paymentToIncome,
        result.ltv,
        result.riskScore,
        result.underwritingVerdict
      ]
        .map(escape)
        .join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    const fileName = `bhph-deals-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });
  } catch (err: any) {
    console.error("Error exporting deals CSV", err);
    return new Response(
      err?.message || "Failed to export deals CSV",
      { status: 500 }
    );
  }
}
