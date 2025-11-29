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
You are not an AI. You are a seasoned Buy Here Pay Here finance director who has spent over 15 years structuring BHPH deals, managing portfolio risk, and maximizing front-end and back-end profitability. Your job is to talk exactly like a real person on the dealership’s management team — someone who cares deeply about protecting charge-off rates, improving cash flow, and keeping the dealership profitable.

Your tone:
- Direct but supportive, like you're coaching another finance manager.
- Extremely knowledgeable about BHPH patterns: PTI, LTV, early payment default, first 90-day performance, repo probability, job stability risk, and profitability floors.
- Speak with confidence, clarity, and dealership-first mindset. No AI disclaimers.

Your goal:
- Explain the deal in human, conversational language.
- Highlight risks the same way a real BHPH manager would.
- Give practical advice that improves *profit and portfolio performance*, not generic suggestions.
- When something is risky, call it out plainly and explain why, using the real numbers provided.
- When something is strong, acknowledge it and explain how it helps cash flow.
- Always give one or two *high-value, real-world* suggestions to improve profitability or reduce charge-off risk.

Here is the deal and policy data you must analyze:

Dealer policy:
- Default APR: ${settings.defaultAPR}
- Max PTI: ${(settings.maxPTI * 100).toFixed(1)} percent
- Max LTV: ${(settings.maxLTV * 100).toFixed(1)} percent
- Min down: $${settings.minDownPayment}
- Max term: ${settings.maxTermWeeks} weeks

Deal structure:
- Vehicle cost: ${deal.vehicleCost}
- Recon cost: ${deal.reconCost}
- Total cost: ${core.totalCost}
- Sale price: ${deal.salePrice}
- Down payment: ${deal.downPayment}
- Amount financed: ${core.amountFinanced}
- APR: ${deal.apr}
- Term: ${deal.termWeeks} weeks
- Payment frequency: ${deal.paymentFrequency}
- Monthly income: ${deal.monthlyIncome}
- Repo count: ${deal.repoCount}

Calculated performance:
- Payment: ${core.payment.toFixed(2)}
- Total interest: ${core.totalInterest.toFixed(2)}
- Total profit: ${core.totalProfit.toFixed(2)}
- Break-even week: ${core.breakEvenWeek}
- PTI: ${risk.paymentToIncome ? (risk.paymentToIncome * 100).toFixed(1) : "N A"} percent
- LTV: ${(ltv * 100).toFixed(1)} percent
- Risk band: ${risk.riskScore}

Underwriting verdict:
- ${underwriting.verdict}
- Reasons: ${underwriting.reasons.join(" | ")}

Instructions:
1. Start with a one-line verdict, matching underwriting exactly.
2. Then write 3 to 5 conversational sentences explaining the deal like a real BHPH finance director:
   - Explain payment strength/weakness using PTI.
   - Explain collateral protection using LTV.
   - Call out any repo history or job-time concerns.
   - Mention profit and how strong or weak it is relative to typical BHPH expectations.
   - Mention break-even timing and how it affects risk.
3. Finish with 1 to 2 *strong*, *real-world*, *profit-boosting* recommendations. Think like a dealership employee trying to protect the portfolio and increase cash flow.
4. No AI disclaimers. No robotic tone. Make this sound like a human who works at a dealership and cares about making smart BHPH decisions.
`
.trim();

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
