// app/api/optimizeDeal/route.ts
import { NextResponse } from "next/server";
import dealerSettings from "@/data/dealer.json";
import { evaluateDeal } from "@/lib/underwriting";
import { calculatePaymentDetails } from "@/lib/deals";

export async function POST(req: Request) {
  try {
    const input = await req.json();

    const baseMetrics = calculatePaymentDetails(input);
    const baseVerdict = evaluateDeal(baseMetrics, input, dealerSettings);

    const variants = generateVariants(input, dealerSettings);

    const results = variants.map((variant) => {
      const metrics = calculatePaymentDetails(variant);
      const verdict = evaluateDeal(metrics, variant, dealerSettings);
      return {
        label: variant.label,
        description: variant.description,
        input: variant,
        metrics,
        verdict,
      };
    });

    return NextResponse.json({ base: { metrics: baseMetrics, verdict: baseVerdict }, results });
  } catch (error) {
    console.error("OPTIMIZER ERROR", error);
    return NextResponse.json({ error: "Failed to optimize deal" }, { status: 500 });
  }
}

/**
 * Produce 3 optimized variants:
 * - Lower Payment
 * - Lower Risk
 * - Higher Profit
 */
function generateVariants(input: any, settings: any) {
  const { salePrice, downPayment, termMonths } = input;

  return [
    {
      label: "Lower Payment Structure",
      description: "Reduces PTI and softens the payment to help close the deal.",
      ...input,
      downPayment: downPayment + 300,
      termMonths: Math.min(termMonths + 3, settings.maxTermMonths),
    },
    {
      label: "Lower Risk Structure",
      description: "Shorter term + stronger down to reduce dealer exposure.",
      ...input,
      downPayment: downPayment + 500,
      termMonths: Math.max(termMonths - 3, 12),
      salePrice: salePrice - 300,
    },
    {
      label: "Higher Profit Structure",
      description: "Bumps price + slight term extension to improve gross profit.",
      ...input,
      salePrice: salePrice + 400,
      termMonths: Math.min(termMonths + 2, settings.maxTermMonths),
    },
  ];
}
