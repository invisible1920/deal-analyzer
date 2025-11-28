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
import { buildAiExplanation } from "@/lib/aiExplanation";

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

  // New numeric field for repos
  repoCount?: number;

  // Legacy boolean for backward compatibility
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

type ProfitOptimizerVariant = {
  label: string;
  extraProfit: number;
};

type ProfitOptimizerResult = {
  variants: ProfitOptimizerVariant[];
};

type PortfolioComparison = {
  ptiDelta: number;
  ltvDelta: number;
  profitDelta: number;
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

  // Collapse repoCount and legacy pastRepo into a single numeric count
  const repoCount =
    typeof input.repoCount === "number"
      ? input.repoCount
      : input.pastRepo
      ? 1
      : 0;

  if (repoCount === 1) {
    score = score === "Low" ? "Medium" : "High";
  } else if (repoCount >= 2) {
    score = "High";
  }

  return { paymentToIncome, riskScore: score };
}

// ============================================================================
// Derived helpers: risk flags, delinquency, approval score, profit optimizer
// ============================================================================

function buildAdvancedRiskFlags(
  input: DealInput,
  risk: { paymentToIncome: number | null; riskScore: string },
  ltv: number,
  settings: DealerSettings,
  core: CoreResult,
  repoCount: number
): string[] {
  const flags: string[] = [];

  if (risk.paymentToIncome !== null) {
    if (risk.paymentToIncome > settings.maxPTI) {
      flags.push("Payment to income is above your policy comfort range.");
    } else if (risk.paymentToIncome > settings.maxPTI * 0.9) {
      flags.push("Payment to income is close to your max PTI limit.");
    } else {
      flags.push("Payment to income is within normal range.");
    }
  }

  if (ltv > settings.maxLTV) {
    flags.push("LTV is above the policy snapshot for this unit.");
  } else if (ltv > settings.maxLTV * 0.9) {
    flags.push("LTV is near the upper edge of your policy range.");
  } else {
    flags.push("LTV is within normal range for this policy.");
  }

  if (repoCount >= 2) {
    flags.push("Multiple past repos reported, high early default risk.");
  } else if (repoCount === 1) {
    flags.push("Single past repo on file, monitor early payments closely.");
  }

  if (input.monthsOnJob && input.monthsOnJob < 6) {
    flags.push("Short time on job, verify stability before funding.");
  }

  if (
    core.breakEvenWeek >
    Math.min(settings.maxTermWeeks, input.termWeeks) / 2
  ) {
    flags.push("Break even point is late in the term, recover cost slowly.");
  }

  return flags;
}

function buildDelinquencyRiskText(
  input: DealInput,
  risk: { paymentToIncome: number | null; riskScore: string },
  ltv: number,
  repoCount: number
): string {
  const pti = risk.paymentToIncome ?? 0;
  const ptiPercent = (pti * 100).toFixed(1);

  if (repoCount >= 2 || pti > 0.3 || ltv > 1.9) {
    return `This structure carries elevated early payment risk due to PTI around ${ptiPercent} percent, higher LTV and prior repos. Consider stronger down or tighter term.`;
  }

  if (repoCount === 1 || pti > 0.25 || ltv > 1.75) {
    return `This deal sits in a moderate risk band, with PTI near ${ptiPercent} percent or higher advance. Make sure income and stability are well documented before funding.`;
  }

  return `Based on PTI, LTV and limited prior repos, delinquency risk looks typical for a working BHPH customer profile. Still monitor the first six payments closely.`;
}

function buildApprovalScore(
  risk: { paymentToIncome: number | null; riskScore: string },
  ltv: number,
  repoCount: number
): number {
  let score = 80;

  const pti = risk.paymentToIncome ?? 0;

  if (pti > 0.3) score -= 20;
  else if (pti > 0.25) score -= 10;
  else if (pti < 0.18) score += 5;

  if (ltv > 1.9) score -= 15;
  else if (ltv > 1.75) score -= 8;

  if (repoCount >= 2) score -= 25;
  else if (repoCount === 1) score -= 10;

  if (risk.riskScore === "High") score -= 10;
  if (risk.riskScore === "Low") score += 5;

  if (score < 5) score = 5;
  if (score > 98) score = 98;

  return Math.round(score);
}

function buildProfitOptimizer(
  input: DealInput,
  settings: DealerSettings,
  core: CoreResult,
  ltv: number,
  risk: { paymentToIncome: number | null; riskScore: string },
  repoCount: number
): ProfitOptimizerResult {
  const variants: ProfitOptimizerVariant[] = [];

  const baseProfit = core.totalProfit;

  // Helper to test a structure
  function testVariant(
    label: string,
    override: Partial<DealInput>
  ): void {
    const nextInput: DealInput = {
      ...input,
      ...override,
    };

    const nextCore = calculateSchedule(nextInput, settings);

    const nextLtv =
      nextCore.totalCost > 0 ? nextCore.amountFinanced / nextCore.totalCost : 0;

    const weeklyPaymentForRisk =
      nextInput.paymentFrequency === "monthly"
        ? nextCore.payment / 4.345
        : nextInput.paymentFrequency === "biweekly"
        ? nextCore.payment / 2
        : nextCore.payment;

    const nextRisk = basicRiskScore(
      nextInput,
      weeklyPaymentForRisk,
      settings
    );

    const nextPti = nextRisk.paymentToIncome ?? 0;

    const withinPolicy =
      nextPti <= settings.maxPTI &&
      nextLtv <= settings.maxLTV &&
      nextInput.termWeeks <= settings.maxTermWeeks;

    if (!withinPolicy) return;

    const extraProfit = nextCore.totalProfit - baseProfit;
    if (extraProfit > 50) {
      variants.push({
        label,
        extraProfit: Math.round(extraProfit),
      });
    }
  }

  // Variant 1: slightly stronger down
  testVariant("Ask for about five hundred more down", {
    downPayment: input.downPayment + 500,
  });

  // Variant 2: slightly longer term
  testVariant("Stretch term by about three months", {
    termWeeks: input.termWeeks + Math.round(4.345 * 3),
  });

  // Variant 3: small price bump
  testVariant("Hold one to two hundred more on price", {
    salePrice: input.salePrice + 200,
  });

  return { variants };
}

// ============================================================================
// Main POST Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DealInput;
    const userId = body.userId ?? null;

    const settings = await resolveDealerSettings(userId);

    // Resolve repo count from new or legacy field
    const repoCount =
      typeof body.repoCount === "number"
        ? body.repoCount
        : body.pastRepo
        ? 1
        : 0;

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
      repoCount: repoCount,
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
      aiExplanation = await buildAiExplanation({
        settings,
        deal: {
          vehicleCost: body.vehicleCost,
          reconCost: body.reconCost,
          salePrice: body.salePrice,
          downPayment: body.downPayment,
          termWeeks: body.termWeeks,
          paymentFrequency: body.paymentFrequency,
          apr: effectiveApr,
          monthlyIncome: body.monthlyIncome || 0,
          repoCount,
        },
        core: {
          totalCost: core.totalCost,
          amountFinanced: core.amountFinanced,
          payment: core.payment,
          totalInterest: core.totalInterest,
          totalProfit: core.totalProfit,
          breakEvenWeek: core.breakEvenWeek,
        },
        risk,
        ltv,
        underwriting,
      });
    } else {
      aiExplanation =
        "Upgrade to Pro to unlock full AI deal opinion with numbers, risk explanation, and structure suggestions.";
    }

    // Derived extras used in the UI
    const advancedRiskFlags = buildAdvancedRiskFlags(
      body,
      risk,
      ltv,
      settings,
      core,
      repoCount
    );

    const delinquencyRisk = buildDelinquencyRiskText(
      body,
      risk,
      ltv,
      repoCount
    );

    const approvalScore = buildApprovalScore(risk, ltv, repoCount);

    const profitOptimizer: ProfitOptimizerResult | null = isPro
      ? buildProfitOptimizer(body, settings, core, ltv, risk, repoCount)
      : null;

    // Simple placeholder portfolio comparison for now
    const portfolioComparison: PortfolioComparison | null = null;

    const complianceFlags: string[] = [
      "Check your state maximum rate and term against this structure.",
      "Verify that doc fees and add ons follow local disclosure rules.",
    ];

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
        // saveDeal still expects a boolean pastRepo field
        pastRepo: repoCount > 0,
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
      // New fields used by the upgraded UI
      advancedRiskFlags,
      delinquencyRisk,
      approvalScore,
      profitOptimizer,
      portfolioComparison,
      complianceFlags,
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
