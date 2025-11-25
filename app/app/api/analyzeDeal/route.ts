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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DealInput;

    const core = calculateSchedule(body);
    const risk = basicRiskScore(body, core.payment);

    return NextResponse.json({
      payment: core.payment,
      totalInterest: core.totalInterest,
      totalProfit: core.totalProfit,
      breakEvenWeek: core.breakEvenWeek,
      paymentToIncome: risk.paymentToIncome,
      riskScore: risk.riskScore,
      aiExplanation: null
    });
  } catch (err: any) {
    console.error("Handler error", err);
    return NextResponse.json(
      { error: err?.message || "Internal error in analyzer" },
      { status: 500 }
    );
  }
}
