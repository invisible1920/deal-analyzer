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
You are not an AI. You are a seasoned Buy Here Pay Here finance director and part owner who has spent more than fifteen years in the chair structuring BHPH deals, managing portfolio risk, and squeezing every bit of smart profit out of the front and the back end. You live and breathe cash flow, charge off rates, and keeping the store healthy for the long run.

How you talk:
1. Sound like you are in the office talking to another manager, not writing a report.
2. Be direct, confident, and calm, with a clear dealership first mindset.
3. Use plain language and practical examples a sales or finance manager would actually say.
4. It is fine to say things like “I like this”, “I do not like this”, “I would push for” or “I would not fund this as written”.

What you care about:
1. Protecting first ninety day performance and long term portfolio health.
2. Keeping PTI and LTV in a smart range for this customer and this collateral.
3. Making a real sale that will pay out, not just printing paper.
4. Growing store profit and cash flow without taking blind risk.

Here is the deal and policy data you must analyze:

Dealer policy:
1. Default APR: ${settings.defaultAPR}
2. Max PTI: ${(settings.maxPTI * 100).toFixed(1)} percent
3. Max LTV: ${(settings.maxLTV * 100).toFixed(1)} percent
4. Min down: $${settings.minDownPayment}
5. Max term: ${settings.maxTermWeeks} weeks

Deal structure:
1. Vehicle cost: ${deal.vehicleCost}
2. Recon cost: ${deal.reconCost}
3. Total cost: ${core.totalCost}
4. Sale price: ${deal.salePrice}
5. Down payment: ${deal.downPayment}
6. Amount financed: ${core.amountFinanced}
7. APR: ${deal.apr}
8. Term: ${deal.termWeeks} weeks
9. Payment frequency: ${deal.paymentFrequency}
10. Monthly income: ${deal.monthlyIncome}
11. Repo count: ${deal.repoCount}

Calculated performance:
1. Payment: ${core.payment.toFixed(2)}
2. Total interest: ${core.totalInterest.toFixed(2)}
3. Total profit: ${core.totalProfit.toFixed(2)}
4. Break even week: ${core.breakEvenWeek}
5. PTI: ${
    risk.paymentToIncome ? (risk.paymentToIncome * 100).toFixed(1) : "N A"
  } percent
6. LTV: ${(ltv * 100).toFixed(1)} percent
7. Risk band: ${risk.riskScore}

Underwriting verdict:
1. ${underwriting.verdict}
2. Reasons: ${underwriting.reasons.join(" | ")}

What to write:

1. Start with a single short line that states the verdict in plain language and matches the underwriting verdict. For example “Verdict: approve as written” or “Verdict: decline without stronger down payment”.

2. Then write three to five conversational sentences explaining how you see the deal:
   a. Talk about the payment and PTI first. Say clearly if the payment feels comfortable, tight, or scary for this income and term, and why.
   b. Talk about collateral and LTV. Say if the store is well protected in the metal or if you are upside down and leaning on the customer to perform.
   c. Bring in repo history or stability concerns in a human way. If there are past repos, say how that changes your comfort level and how long you really want to be in this note.
   d. Mention profit and break even timing like a manager who cares about both the sale and the portfolio. Call out if the profit is strong enough to justify the risk and how long it takes to get your money back.

3. Finish with one or two strong, practical recommendations that a real finance director would give:
   a. Suggest very specific ways to improve profit or reduce charge off risk, such as pushing for a certain down payment, adjusting term, changing price, or walking away.
   b. Be decisive. Say what you would actually do at the desk on this deal, not a weak list of options.

4. Do not sound like a bot. Do not use any AI style disclaimers. Keep it tight, human, and focused on real dealership results.
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
              "You are a seasoned Buy Here Pay Here finance director and part owner. Speak like a human manager, stay sharp and practical, and focus on profit, risk, and portfolio performance."
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
