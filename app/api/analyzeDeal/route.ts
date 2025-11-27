import { NextRequest, NextResponse } from "next/server";
import type { DealerSettings } from "@/lib/settings";
import {
  runUnderwritingEngine,
  type UnderwritingResult,
} from "@/lib/underwriting";
import { saveDeal } from "@/lib/deals";
import { resolveDealerSettings } from "@/lib/dealerSettings";
import {
  getMonthlyDealCountForUser,
  FREE_DEALS_PER_MONTH,
} from "@/lib/usage";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

type PaymentFrequency = "monthly" | "biweekly" | "weekly";

type DealInput = {
  vehicleCost: number;
  reconCost: number;
  salePrice: number;
  downPayment: number;
  apr?: number;
  termWeeks: number; // FE sends months, but converts to weeks before calling API
  paymentFrequency: PaymentFrequency;
  monthlyIncome?: number;
  monthsOnJob?: number;
  pastRepo?: boolean;
  userId?: string | null;
};

type ScheduleRow = {
  period: number;
  interest: number;
  principal: number;
  balance: number;
};

type CoreResult = {
  payment: number; // payment amount per period (weekly/biweekly/monthly)
  totalInterest: number;
  totalProfit: number;
  breakEvenWeek: number;
  schedule: ScheduleRow[];
  totalCost: number;
  amountFinanced: number;
};

// ============================================================================
// Payment Schedule With Monthly/Biweekly/Weekly Amortization
// ============================================================================

function calculateSchedule(
  input: DealInput,
  settings: DealerSettings
): CoreResult {
  const totalCost = input.vehicleCost + input.reconCost;
  const amountFinanced = input.salePrice - input.downPayment;

  // If there is nothing to finance
  if (amountFinanced <= 0) {
    return {
      payment: 0,
      totalInterest: 0,
      totalProfit: input.salePrice - totalCost,
      breakEvenWeek: 0,
      schedule: [],
      totalCost,
      amountFinanced,
    };
  }

  // APR
  const apr = input.apr && input.apr > 0 ? input.apr : settings.defaultAPR;

  // Silent cap on term
  const cappedTermWeeks =
    input.termWeeks && input.termWeeks > 0
      ? Math.min(input.termWeeks, settings.maxTermWeeks)
      : settings.maxTermWeeks;

  // Convert based on frequency
  let periods: number;
  let ratePerPeriod: number;

  // ========================================================================
  // Monthly Payments
  // ========================================================================
  if (input.paymentFrequency === "monthly") {
    const termMonths = cappedTermWeeks / 4.345;
    periods = Math.round(termMonths);
    if (periods < 1) periods = 1;

    ratePerPeriod = apr / 100 / 12;

    const payment =
      ratePerPeriod === 0
        ? amountFinanced / periods
        : (amountFinanced * ratePerPeriod) /
          (1 - Math.pow(1 + ratePerPeriod, -periods));

    // Build amort schedule (monthly)
    let balance = amountFinanced;
    let totalInterest = 0;
    const schedule: ScheduleRow[] = [];

    for (let period = 1; period <= periods; period++) {
      const interest = balance * ratePerPeriod;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      totalInterest += interest;
      schedule.push({ period, interest, principal, balance });
    }

    // Profit
    const totalProfit = input.salePrice - totalCost + totalInterest;

    // Break even in weeks, convert months to weeks for uniformity
    let cumPrincipal = 0;
    let breakEvenWeek = cappedTermWeeks;

    for (let i = 0; i < schedule.length; i++) {
      cumPrincipal += schedule[i].principal;
      if (cumPrincipal >= totalCost) {
        breakEvenWeek = Math.round((i + 1) * 4.345);
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
      amountFinanced,
    };
  }

  // ========================================================================
  // Biweekly Payments
  // ========================================================================
  if (input.paymentFrequency === "biweekly") {
    periods = Math.round(cappedTermWeeks / 2);
    if (periods < 1) periods = 1;

    ratePerPeriod = apr / 100 / 26;

    const payment =
      ratePerPeriod === 0
        ? amountFinanced / periods
        : (amountFinanced * ratePerPeriod) /
          (1 - Math.pow(1 + ratePerPeriod, -periods));

    let balance = amountFinanced;
    let totalInterest = 0;
    const schedule: ScheduleRow[] = [];

    for (let period = 1; period <= periods; period++) {
      const interest = balance * ratePerPeriod;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      totalInterest += interest;
      schedule.push({ period, interest, principal, balance });
    }

    const totalProfit = input.salePrice - totalCost + totalInterest;

    let cumPrincipal = 0;
    let breakEvenWeek = cappedTermWeeks;

    for (let i = 0; i < schedule.length; i++) {
      cumPrincipal += schedule[i].principal;
      if (cumPrincipal >= totalCost) {
        breakEvenWeek = (i + 1) * 2;
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
      amountFinanced,
    };
  }

  // ========================================================================
  // Weekly Payments (default)
  // ========================================================================
  periods = cappedTermWeeks;
  if (periods < 1) periods = 1;

  ratePerPeriod = apr / 100 / 52;

  const payment =
    ratePerPeriod === 0
      ? amountFinanced / periods
      : (amountFinanced * ratePerPeriod) /
        (1 - Math.pow(1 + ratePerPeriod, -periods));

  let balance = amountFinanced;
  let totalInterest = 0;
  const schedule: ScheduleRow[] = [];

  for (let period = 1; period <= periods; period++) {
    const interest = balance * ratePerPeriod;
    const principal = payment - interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    schedule.push({ period, interest, principal, balance });
  }

  const totalProfit = input.salePrice - totalCost + totalInterest;

  let cumPrincipal = 0;
  let breakEvenWeek = cappedTermWeeks;

  for (const row of schedule) {
    cumPrincipal += row.principal;
    if (cumPrincipal >= totalCost) break;
  }

  return {
    payment,
    totalInterest,
    totalProfit,
    breakEvenWeek,
    schedule,
    totalCost,
    amountFinanced,
  };
}

// ============================================================================
// Basic Risk and PTI
// ============================================================================

function basicRiskScore(
  input: DealInput,
  weeklyPayment: number,
  settings: DealerSettings
) {
  const monthlyIncome = input.monthlyIncome || 0;

  let paymentToIncome: number | null = null;

  if (monthlyIncome > 0) {
    paymentToIncome = (weeklyPayment * 4.345) / monthlyIncome;
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

// ============================================================================
// AI Underwriting Commentary
// ============================================================================

async function getAiOpinion(
  input: DealInput,
  core: CoreResult,
  risk: { paymentToIncome: number | null; riskScore: string },
  settings: DealerSettings,
  ltv: number,
  underwriting: UnderwritingResult
) {
  const apiKey =
    process.env.OPENAI_API_KEY || process.env.PENAI_API_KEY || "";

  if (!apiKey) {
    console.warn("AI disabled: no API key");
    return "AI unavailable: missing API key.";
  }

  const apr = input.apr && input.apr > 0 ? input.apr : settings.defaultAPR;

  const ltvPercent = (ltv * 100).toFixed(1);
  const ptiPercent = risk.paymentToIncome
    ? (risk.paymentToIncome * 100).toFixed(1) + "%"
    : "N/A";

  const prompt = `
You are a senior buy here pay here finance manager.

Dealer policy:
- Default APR: ${settings.defaultAPR}
- Max PTI: ${(settings.maxPTI * 100).toFixed(1)}%
- Max LTV: ${(settings.maxLTV * 100).toFixed(1)}%
- Min down: $${settings.minDownPayment}
- Max term: ${settings.maxTermWeeks} weeks

Deal:
- Vehicle cost: ${input.vehicleCost}
- Recon: ${input.reconCost}
- Total cost: ${core.totalCost}
- Sale price: ${input.salePrice}
- Down: ${input.downPayment}
- Amount financed: ${core.amountFinanced}
- APR used: ${apr}
- Term weeks: ${input.termWeeks}
- Payment frequency: ${input.paymentFrequency}

Calculated:
- Payment: ${core.payment.toFixed(2)}
- Total interest: ${core.totalInterest.toFixed(2)}
- Total profit: ${core.totalProfit.toFixed(2)}
- BE week: ${core.breakEvenWeek}
- PTI: ${ptiPercent}
- LTV: ${ltvPercent}%
- Risk: ${risk.riskScore}

Underwriting:
- Verdict: ${underwriting.verdict}
- Reasons: ${underwriting.reasons.join(" | ")}

Instructions:
1. Your verdict must match underwriting.
2. Start with a one line verdict.
3. Include 2 to 3 sentences explaining using real numbers.
4. End with one suggestion to improve structure.
No AI disclaimers.
  `.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a highly experienced BHPH finance manager. Be sharp, concise, and practical.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return `AI error: ${await response.text()}`;
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content?.trim() || "No AI response.";
  } catch (err: any) {
    return `AI request failed: ${err.message}`;
  }
}

// ============================================================================
// Main POST Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DealInput;
    const userId = body.userId ?? null;

    const settings = await resolveDealerSettings(userId);

    // Plan type
    let planType: "free" | "pro" = "free";
    let freeDealsPerMonth = FREE_DEALS_PER_MONTH;

    // Fetch user profile if logged in
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan_type, free_deals_per_month")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        if (profile.plan_type === "pro") planType = "pro";
        if (
          typeof profile.free_deals_per_month === "number" &&
          !Number.isNaN(profile.free_deals_per_month)
        ) {
          freeDealsPerMonth = profile.free_deals_per_month;
        }
      }
    }

    const isPro = planType === "pro";

    // Usage limit
    const dealsThisMonth = await getMonthlyDealCountForUser(userId);

    if (
      userId &&
      planType === "free" &&
      dealsThisMonth >= freeDealsPerMonth
    ) {
      return NextResponse.json(
        {
          error:
            "Free tier limit reached. Upgrade to Pro for unlimited deal analyses.",
          dealsThisMonth,
          freeDealsPerMonth,
          planType,
        },
        { status: 403 }
      );
    }

    // ======================================================================
    // Core calculations
    // ======================================================================

    const core = calculateSchedule(body, settings);

    const ltv =
      core.totalCost > 0 ? core.amountFinanced / core.totalCost : 0;

    // Weekly payment for PTI risk
    const weeklyPaymentForRisk =
      body.paymentFrequency === "monthly"
        ? core.payment / 4.345
        : body.paymentFrequency === "biweekly"
        ? core.payment / 2
        : core.payment;

    const risk = basicRiskScore(body, weeklyPaymentForRisk, settings);

    const effectiveApr =
      body.apr && body.apr > 0 ? body.apr : settings.defaultAPR;

    const underwritingInput = {
      income: body.monthlyIncome || 0,
      salePrice: body.salePrice,
      vehicleCost: body.vehicleCost,
      totalCost: core.totalCost,
      downPayment: body.downPayment,
      apr: effectiveApr,
      termWeeks: body.termWeeks,
      weeklyPayment: weeklyPaymentForRisk,
      pti: risk.paymentToIncome || 0,
      ltv,
      profit: core.totalProfit,
      jobTimeMonths: body.monthsOnJob || 0,
      repoCount: body.pastRepo ? 1 : 0,
    };

    const rules = {
      maxPTI: settings.maxPTI,
      maxLTV: settings.maxLTV,
      minDownPayment: settings.minDownPayment,
      maxTermWeeks: settings.maxTermWeeks,
    };

    const underwriting = runUnderwritingEngine(
      underwritingInput,
      rules
    );

    // AI explanation is Pro only
    let aiExplanation: string;

    if (isPro) {
      aiExplanation = await getAiOpinion(
        body,
        core,
        risk,
        settings,
        ltv,
        underwriting
      );
    } else {
      aiExplanation =
        "Upgrade to Pro to unlock full AI deal opinion with numbers, risk explanation, and structure suggestions.";
    }

    // Underwriting returned to client is richer for Pro
    const responseUnderwriting:
      | UnderwritingResult
      | { verdict: string; reasons: string[] } = isPro
      ? underwriting
      : {
          verdict: underwriting.verdict,
          reasons: [
            "Basic policy check complete.",
            "Upgrade to Pro to see detailed underwriting reasons, PTI and LTV violations, and recommended counter terms.",
          ],
        };

    // ======================================================================
    // Save deal to DB
    // ======================================================================

    await saveDeal({
      userId,
      input: {
        vehicleCost: body.vehicleCost,
        reconCost: body.reconCost,
        salePrice: body.salePrice,
        downPayment: body.downPayment,
        apr: effectiveApr,
        termWeeks: body.termWeeks,
        paymentFrequency: body.paymentFrequency,
        monthlyIncome: body.monthlyIncome ?? null,
        monthsOnJob: body.monthsOnJob ?? null,
        pastRepo: Boolean(body.pastRepo),
      },
      result: {
        payment: core.payment,
        totalInterest: core.totalInterest,
        totalProfit: core.totalProfit,
        breakEvenWeek: core.breakEvenWeek,
        paymentToIncome: risk.paymentToIncome ?? null,
        ltv,
        riskScore: risk.riskScore,
        underwritingVerdict: underwriting.verdict,
        underwritingReasons: underwriting.reasons,
        aiExplanation,
      },
    });

    // Build schedule preview for UI
    const schedulePreview = core.schedule.slice(0, 12);

    // ======================================================================
    // Response
    // ======================================================================

    return NextResponse.json({
      payment: core.payment,
      totalInterest: core.totalInterest,
      totalProfit: core.totalProfit,
      breakEvenWeek: core.breakEvenWeek,
      paymentToIncome: risk.paymentToIncome,
      ltv,
      riskScore: risk.riskScore,
      underwriting: responseUnderwriting,
      aiExplanation,
      dealerSettings: settings,
      dealsThisMonth,
      freeDealsPerMonth,
      planType,
      schedulePreview,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
