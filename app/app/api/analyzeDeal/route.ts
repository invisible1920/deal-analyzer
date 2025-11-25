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

  if (!isFinite(totalCost) || !isFinite(amountFinanced)) {
    throw new Error("Invalid numeric input");
  }

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
  const n = input.termWeeks && input.termWeeks > 0 ? input.termWeeks : 1;

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

function buildExplanation(input: DealInput, core: CoreResult, risk: { paymentToIncome: number | null; riskScore: string }) {
  const pti = risk.paymentToIncome;
  const ptiText =
    pti !== null ? `${(pti * 100).toFixed(1)} percent of income` : "unknown vs income";

  const profit = core.totalProfit;
  const beWeek = core.breakEvenWeek;
  const riskScore = risk.riskScore;

  let verdict: string;
  if (riskScore === "Low" && profit >= 4000) {
    verdict = "solid deal";
  } else if (riskScore === "High" && profit < 3000) {
    verdict = "very thin, high risk deal";
  } else if (riskScore === "High") {
    verdict = "high risk deal";
  } else if (profit < 2500) {
    verdict = "thin but acceptable deal";
  } else {
    verdict = "workable deal";
  }

  const lines: string[] = [];

  lines.push(
    `Verdict: ${verdict}. Weekly payment is ${core.payment.toFixed(
      2
    )}, total profit about ${profit.toFixed(0)}, and break even is around week ${beWeek}.`
  );

  lines.push(
    `Payment takes ${ptiText}, simple risk score reads as ${riskScore}.`
  );

  const tweaks: string[] = [];

  if (pti !== null && pti > 0.25) {
    tweaks.push("drop the payment-to-income by either shortening term or adding to down payment");
  }
  if (profit < 3000) {
    tweaks.push("raise price slightly or push for a bit more down to get profit closer to 3500–4000");
  }
  if (input.pastRepo) {
    tweaks.push("consider a GPS, tighter follow-up, or a little extra down due to past repo");
  }

  if (tweaks.length > 0) {
    lines.push("Suggested tweaks: " + tweaks.join("; ") + ".");
  }

  return lines.join(" ");
}

// GET /api/analyzeDeal?vehicleCost=...&reconCost=... etc
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const p = url.searchParams;

    const input: DealInput = {
      vehicleCost: Number(p.get("vehicleCost") ?? 0),
      reconCost: Number(p.get("reconCost") ?? 0),
      salePrice: Number(p.get("salePrice") ?? 0),
      downPayment: Number(p.get("downPayment") ?? 0),
      apr: Number(p.get("apr") ?? 0),
      termWeeks: Number(p.get("termWeeks") ?? 0),
      paymentFrequency:
        (p.get("paymentFrequency") as "weekly" | "biweekly") || "weekly",
      monthlyIncome: p.get("monthlyIncome")
        ? Number(p.get("monthlyIncome"))
        : undefined,
      monthsOnJob: p.get("monthsOnJob")
        ? Number(p.get("monthsOnJob"))
        : undefined,
      pastRepo: p.get("pastRepo") === "true"
    };

    const core = calculateSchedule(input);
    const risk = basicRiskScore(input, core.payment);
    const aiExplanation = buildExplanation(input, core, risk);

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
