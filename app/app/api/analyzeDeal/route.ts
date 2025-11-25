import { NextRequest, NextResponse } from "next/server";

type DealInput = {
  vehicleCost: number;
  reconCost: number;
  salePrice: number;
  downPayment: number;
  apr: number;
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

function calculateSchedule(input: DealInput): CoreResult {
  const totalCost = input.vehicleCost + input.reconCost;
  const amountFinanced = input.salePrice - input.downPayment;

  // Handle edge case but still keep all fields
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

  const weeksPerYear = 52;
  const ratePerWeek = input.apr / 100 / weeksPerYear;
  const n = input.termWeeks || 1; // avoid divide by zero

  let payment: number;

  if (ratePerWeek === 0) {
    payment = amountFinanced / n;
  } else {
    payment =
      (amountFinanced * ratePerWeek) /
      (1 - Math.pow(1 + ratePerWeek, -n));
  }

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

function basicRiskScore(input: DealInput, payment: number) {
  const monthlyIncome = input.monthlyIncome || 0;
  let paymentToIncome: number | null = null;

  if (monthlyIncome > 0) {
    const weeklyPayment = payment;
    const estimatedMonthlyPayment = weeklyPayment * 4;
    paymentToIncome = estimatedMonthlyPayment / monthlyIncome;
  }

  let score = "Medium";

  if (paymentToIncome !== null) {
    if (paymentToIncome > 0.25) score = "High";
    if (paymentToIncome < 0.15) score = "Low";
  }

  if (input.monthsOnJob !== undefined && input.monthsOnJob < 6) {
    if (score === "Low") score = "Medium";
    else score = "High";
  }

  if (input.pastRepo) {
    score = "High";
  }

  return { paymentToIncome, riskScore: score };
}

async function getAiExplanation(
  input: DealInput,
  core: CoreResult,
  risk: {
    paymentToIncome: number | null;
    riskScore: string;
  }
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not set");
    return "AI is not configured yet. Set OPENAI_API_KEY in Vercel to enable AI.";
  }

  // If nothing is actually financed, no need to call AI
  if (core.amountFinanced <= 0) {
    return "No amount is financed on this deal. Structure looks like a cash or zero-balance deal.";
  }

  const {
    vehicleCost,
    reconCost,
    salePrice,
    downPayment,
    apr,
    termWeeks,
    paymentFrequency,
    monthlyIncome,
    monthsOnJob,
    pastRepo
  } = input;

  const ltv = core.amountFinanced / (vehicleCost || 1);

  const userPrompt = `
You are an experienced buy here pay here dealer and finance manager. Analyze this deal and speak directly to the dealer. Keep it short and practical.

Deal inputs:
- Vehicle cost: ${vehicleCost}
- Recon cost: ${reconCost}
- Total cost: ${core.totalCost}
- Sale price: ${salePrice}
- Down payment: ${downPayment}
- Amount financed: ${core.amountFinanced}
- APR: ${apr}
- Term in weeks: ${termWeeks}
- Payment frequency: ${paymentFrequency}
- Monthly income: ${monthlyIncome ?? "unknown"}
- Months on job: ${monthsOnJob ?? "unknown"}
- Past repo: ${pastRepo ? "yes" : "no"}

Calculated:
- Weekly payment: ${core.payment.toFixed(2)}
- Total interest: ${core.totalInterest.toFixed(2)}
- Total profit including interest: ${core.totalProfit.toFixed(2)}
- Break even week: ${core.breakEvenWeek}
- Payment to income ratio: ${
    risk.paymentToIncome !== null
      ? (risk.paymentToIncome * 100).toFixed(1) + " percent"
      : "unknown"
  }
- Simple risk score: ${risk.riskScore}
- Simple loan to cost ratio: ${(ltv * 100).toFixed(1)} percent

In your answer:
1. Give a one line verdict such as "solid deal", "thin but ok", or "high risk".
2. Explain in two to three short sentences why, using concrete numbers.
3. Suggest one or two simple adjustments (for example change down payment or term) that would improve risk or profit.

Do not talk about being an AI or model. Just talk like a seasoned dealer giving advice to another dealer.
`.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert buy here pay here dealer and finance manager. You are direct, concise, and very practical."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error", text);
      return `AI error from OpenAI: ${text.slice(0, 200)}`;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || "AI did not return a response.";
  } catch (err: any) {
    console.error("Error calling OpenAI", err);
    return `AI request failed: ${err?.message ?? "unknown error"}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DealInput;

    const core = calculateSchedule(body);
    const risk = basicRiskScore(body, core.payment);

    const aiExplanation = await getAiExplanation(body, core, risk);

    return NextResponse.json({
      payment: core.payment,
      totalInterest: core.totalInterest,
      totalProfit: core.totalProfit,
      breakEvenWeek: core.breakEvenWeek,
      paymentToIncome: risk.paymentToIncome,
      riskScore: risk.riskScore,
      aiExplanation
    });
  } catch (err: any) {
    console.error("Handler error", err);
    return NextResponse.json(
      { error: err?.message || "Internal error in analyzer" },
      { status: 500 }
    );
  }
}
