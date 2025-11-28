import type { DealerSettings } from "@/lib/settings";
import type { UnderwritingResult } from "@/lib/underwriting";

type PaymentFrequency = "monthly" | "biweekly" | "weekly";

export type AiExplanationParams = {
  settings: DealerSettings;
  deal: {
    vehicleCost: number;
    reconCost: number;
    salePrice: number;
    downPayment: number;
    termWeeks: number;
    paymentFrequency: PaymentFrequency;
    apr: number;
    monthlyIncome: number;
    repoCount: number;
  };
  core: {
    totalCost: number;
    amountFinanced: number;
    payment: number;
    totalInterest: number;
    totalProfit: number;
    breakEvenWeek: number;
  };
  risk: {
    paymentToIncome: number | null;
    riskScore: string;
  };
  ltv: number;
  underwriting: UnderwritingResult;
};

export async function buildAiExplanation(
  params: AiExplanationParams
): Promise<string> {
  const { settings, deal, core, risk, ltv, underwriting } = params;

  const apiKey =
    process.env.OPENAI_API_KEY || process.env.PENAI_API_KEY || "";

  if (!apiKey) {
    console.warn("AI disabled: no API key");
    return "AI unavailable: missing API key.";
  }

  const ltvPercent = (ltv * 100).toFixed(1);
  const ptiPercent = risk.paymentToIncome
    ? (risk.paymentToIncome * 100).toFixed(1) + " percent"
    : "N A";

  const prompt = `
You are a senior buy here pay here finance manager.

Dealer policy:
- Default APR: ${settings.defaultAPR}
- Max PTI: ${(settings.maxPTI * 100).toFixed(1)} percent
- Max LTV: ${(settings.maxLTV * 100).toFixed(1)} percent
- Min down: $${settings.minDownPayment}
- Max term: ${settings.maxTermWeeks} weeks

Deal:
- Vehicle cost: ${deal.vehicleCost}
- Recon: ${deal.reconCost}
- Total cost: ${core.totalCost}
- Sale price: ${deal.salePrice}
- Down: ${deal.downPayment}
- Amount financed: ${core.amountFinanced}
- APR used: ${deal.apr}
- Term weeks: ${deal.termWeeks}
- Payment frequency: ${deal.paymentFrequency}
- Reported repo count: ${deal.repoCount}
- Monthly income: ${deal.monthlyIncome}

Calculated:
- Payment: ${core.payment.toFixed(2)}
- Total interest: ${core.totalInterest.toFixed(2)}
- Total profit: ${core.totalProfit.toFixed(2)}
- Break even week: ${core.breakEvenWeek}
- PTI: ${ptiPercent}
- LTV: ${ltvPercent} percent
- Risk: ${risk.riskScore}

Underwriting:
- Verdict: ${underwriting.verdict}
- Reasons: ${underwriting.reasons.join(" | ")}

Instructions:
1. Your verdict must match underwriting.
2. Start with a single line verdict.
3. Then include 2 to 3 short sentences explaining using real numbers.
4. End with one concrete suggestion to improve the structure.
Do not include AI disclaimers.
  `.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a highly experienced BHPH finance manager. Be sharp, concise and practical."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI error", text);
      return `AI error: ${text}`;
    }

    const json = await response.json();
    const content: string =
      json.choices?.[0]?.message?.content?.trim() || "No AI response.";

    return content;
  } catch (err: any) {
    console.error("AI request failed", err);
    return `AI request failed: ${err?.message || "Unknown error"}`;
  }
}
