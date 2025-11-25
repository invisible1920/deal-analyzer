import { NextRequest, NextResponse } from "next/server";
import { loadSettings, type DealerSettings } from "@/lib/settings";
import { NextRequest, NextResponse } from "next/server";
import { loadSettings, type DealerSettings } from "@/lib/settings";
import { runUnderwritingEngine } from "@/lib/underwriting";


type DealInput = {
  vehicleCost: number;
  reconCost: number;
  salePrice: number;
  downPayment: number;
  apr?: number;
  termWeeks: number;
  paymentFrequency: "weekly" | "biweekly";
  monthlyIncome?: number;
  monthsOnJob?: number;
  pastRepo?: boolean;
};

type ScheduleRow = {
  period: number;
  interest: number;
  principal: number;
  balance: number;
};

type CoreResult = {
  payment: number;
  totalInterest: number;
  totalProfit: number;
  breakEvenWeek: number;
  schedule: ScheduleRow[];
  totalCost: number;
  amountFinanced: number;
};

function calculateSchedule(input: DealInput, settings: DealerSettings): CoreResult {
  const totalCost = input.vehicleCost + input.reconCost;
  const amountFinanced = input.salePrice - input.downPayment;

  if (amountFinanced <= 0) {
    return {
      payment: 0,
      totalInterest: 0,
      totalProfit: input.salePrice - totalCost,
      breakEvenWeek: 0,
      schedule: [],
      totalCost,
      amountFinanced
    };
  }

  const apr = input.apr && input.apr > 0 ? input.apr : settings.defaultAPR;
  const cappedTerm =
    input.termWeeks && input.termWeeks > 0
      ? Math.min(input.termWeeks, settings.maxTermWeeks)
      : settings.maxTermWeeks;

  const ratePerWeek = apr / 100 / 52;
  const n = cappedTerm;

  const payment =
    ratePerWeek === 0
      ? amountFinanced / n
      : (amountFinanced * ratePerWeek) /
        (1 - Math.pow(1 + ratePerWeek, -n));

  let balance = amountFinanced;
  let totalInterest = 0;
  const schedule: ScheduleRow[] = [];

  for (let period = 1; period <= n; period++) {
    const interest = balance * ratePerWeek;
    const principal = payment - interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    schedule.push({ period, interest, principal, balance });
  }

  const totalProfit = input.salePrice - totalCost + totalInterest;

  let cumPrincipal = 0;
  let breakEvenWeek = n;

  for (const row of schedule) {
    cumPrincipal += row.principal;
    if (cumPrincipal >= totalCost) {
      breakEvenWeek = row.period;
      break;
    }
  }

  return {
    payment,
    totalInterest,
    totalProfit,
    breakEvenWeek,
    schedule,
    totalCost,
    amountFinanced
  };
}

function basicRiskScore(
  input: DealInput,
  payment: number,
  settings: DealerSettings
) {
  const monthlyIncome = input.monthlyIncome || 0;
  let paymentToIncome: number | null = null;

  if (monthlyIncome > 0) {
    paymentToIncome = (payment * 4) / monthlyIncome;
  }

  let score = "Medium";

  if (paymentToIncome !== null) {
    if (paymentToIncome > settings.maxPTI) score = "High";
    if (paymentToIncome < settings.maxPTI * 0.6) score = "Low";
  }

  if (input.monthsOnJob && input.monthsOnJob < 6) {
    score = score === "Low" ? "Medium" : "High";
  }

  if (input.pastRepo) score = "High";

  return { paymentToIncome, riskScore: score };
}

async function getAiOpinion(
  input: DealInput,
  core: CoreResult,
  risk: { paymentToIncome: number | null; riskScore: string },
  settings: DealerSettings
) {
  const apiKey =
    process.env.OPENAI_API_KEY || process.env.PENAI_API_KEY || "";

  if (!apiKey) {
    console.warn("MISSING OPENAI_API_KEY / PENAI_API_KEY");
    return "AI unavailable: missing API key.";
  }

  const apr = input.apr && input.apr > 0 ? input.apr : settings.defaultAPR;

  const prompt = `
You are an experienced buy-here-pay-here finance manager.

Dealer policy:
- Dealer name: ${settings.dealerName}
- Default APR: ${settings.defaultAPR}
- Max PTI: ${(settings.maxPTI * 100).toFixed(1)} percent
- Max LTV: ${(settings.maxLTV * 100).toFixed(1)} percent
- Min down payment: $${settings.minDownPayment}
- Max term: ${settings.maxTermWeeks} weeks

Deal inputs:
- Vehicle cost: ${input.vehicleCost}
- Recon cost: ${input.reconCost}
- Total cost: ${core.totalCost}
- Sale price: ${input.salePrice}
- Down payment: ${input.downPayment}
- Amount financed: ${core.amountFinanced}
- APR used: ${apr}
- Term weeks: ${input.termWeeks}
- Income: ${input.monthlyIncome}
- Months on job: ${input.monthsOnJob}
- Past repo: ${input.pastRepo}

Calculated:
- Weekly payment: ${core.payment.toFixed(2)}
- Total interest: ${core.totalInterest.toFixed(2)}
- Total profit: ${core.totalProfit.toFixed(2)}
- Break-even week: ${core.breakEvenWeek}
- Payment to income: ${
    risk.paymentToIncome
      ? (risk.paymentToIncome * 100).toFixed(1) + "%"
      : "N/A"
  }
- Risk score: ${risk.riskScore}

Instructions:
Give:
1. One-line verdict (“solid deal”, “thin but ok”, etc)
2. 2–3 sentence breakdown using real numbers
3. One improvement suggestion (tweak down, price, or term)
Do NOT mention AI or models.
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
              "You are a senior BHPH finance manager. Be concise, direct, and practical."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return `AI error: ${text.substring(0, 200)}`;
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content?.trim() || "No AI response.";
  } catch (err: any) {
    return `AI request failed: ${err.message}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DealInput;
    const settings = loadSettings();

    const core = calculateSchedule(body, settings);
    const risk = basicRiskScore(body, core.payment, settings);
    // PTI ratio from the same logic as basicRiskScore
const paymentToIncome =
  body.monthlyIncome && body.monthlyIncome > 0
    ? (core.payment * 4) / body.monthlyIncome
    : null;

// LTV ratio, using amount financed against total cost in the car
const ltv =
  core.totalCost > 0 ? core.amountFinanced / core.totalCost : 0;

// Ensure APR is resolved the same way everywhere
const effectiveApr =
  body.apr && body.apr > 0 ? body.apr : settings.defaultAPR;

// Build underwriting input
const underwritingInput = {
  income: body.monthlyIncome || 0,
  salePrice: body.salePrice,
  vehicleCost: body.vehicleCost,
  totalCost: core.totalCost,
  downPayment: body.downPayment,
  apr: effectiveApr,
  termWeeks: body.termWeeks,
  weeklyPayment: core.payment,
  pti: paymentToIncome || 0,
  ltv,
  profit: core.totalProfit,
  jobTimeMonths: body.monthsOnJob || 0,
  repoCount: body.pastRepo ? 1 : 0
};

const rules = {
  maxPTI: settings.maxPTI,
  maxLTV: settings.maxLTV,
  minDownPayment: settings.minDownPayment,
  maxTermWeeks: settings.maxTermWeeks
};

const underwriting = runUnderwritingEngine(underwritingInput, rules);

    const aiExplanation = await getAiOpinion(body, core, risk, settings);

    return NextResponse.json({
  payment: core.payment,
  totalInterest: core.totalInterest,
  totalProfit: core.totalProfit,
  breakEvenWeek: core.breakEvenWeek,
  paymentToIncome: risk.paymentToIncome,
  ltv,
  riskScore: risk.riskScore,
  underwriting,
  aiExplanation,
  dealerSettings: settings
});

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
