import { NextRequest, NextResponse } from "next/server";
import type { DealerSettings } from "@/lib/settings";
import { resolveDealerSettings } from "@/lib/dealerSettings";
import { supabaseAdmin } from "@/lib/supabase";
import {
  runUnderwritingEngine,
  type UnderwritingResult,
} from "@/lib/underwriting";

type PaymentFrequency = "monthly" | "biweekly" | "weekly";

type AffordabilityInput = {
  monthlyIncome: number;
  availableDown: number;

  // optional overrides
  apr?: number;
  paymentFrequency?: PaymentFrequency;
  maxPTIOverride?: number;

  termWeeksOptions: number[];

  // for LTV and profit
  vehicleCost: number;
  reconCost?: number;

  // range we will search for sale price
  salePriceMin: number;
  salePriceMax: number;
  salePriceStep?: number;

  // optional target weekly payment for suggested down
  targetWeeklyPayment?: number;

  userId?: string | null;
};

type AffordabilityBestStructure = {
  salePrice: number;
  termWeeks: number;
  weeklyPayment: number;
  pti: number;
  ltv: number;
  totalProfit: number;
  underwriting: UnderwritingResult;
};

type AffordabilityResponse = {
  planType: "free" | "pro";
  settings: DealerSettings;
  input: {
    monthlyIncome: number;
    availableDown: number;
    apr: number;
    paymentFrequency: PaymentFrequency;
    termWeeksOptions: number[];
    salePriceMin: number;
    salePriceMax: number;
    salePriceStep: number;
  };
  bestStructure: AffordabilityBestStructure | null;
  recommendedDownPayment: number | null;
};

function computePaymentAndProfit(args: {
  salePrice: number;
  availableDown: number;
  vehicleCost: number;
  reconCost: number;
  apr: number;
  termWeeks: number;
  paymentFrequency: PaymentFrequency;
}) {
  const {
    salePrice,
    availableDown,
    vehicleCost,
    reconCost,
    apr,
    termWeeks,
    paymentFrequency,
  } = args;

  const totalCost = vehicleCost + reconCost;
  const amountFinanced = salePrice - availableDown;

  if (amountFinanced <= 0) {
    return {
      paymentPerPeriod: 0,
      weeklyPayment: 0,
      totalProfit: salePrice - totalCost,
      totalCost,
      amountFinanced,
    };
  }

  let periodsPerYear: number;
  let periods: number;

  if (paymentFrequency === "monthly") {
    periodsPerYear = 12;
    const termMonths = termWeeks / 4.345;
    periods = Math.max(1, Math.round(termMonths));
  } else if (paymentFrequency === "biweekly") {
    periodsPerYear = 26;
    periods = Math.max(1, Math.round(termWeeks / 2));
  } else {
    periodsPerYear = 52;
    periods = Math.max(1, termWeeks);
  }

  const ratePerPeriod = apr / 100 / periodsPerYear;

  let paymentPerPeriod: number;

  if (ratePerPeriod === 0) {
    paymentPerPeriod = amountFinanced / periods;
  } else {
    paymentPerPeriod =
      (amountFinanced * ratePerPeriod) /
      (1 - Math.pow(1 + ratePerPeriod, -periods));
  }

  const totalPaid = paymentPerPeriod * periods;
  const totalInterest = totalPaid - amountFinanced;
  const totalProfit = salePrice - totalCost + totalInterest;

  let weeklyPayment: number;

  if (paymentFrequency === "monthly") {
    weeklyPayment = paymentPerPeriod / 4.345;
  } else if (paymentFrequency === "biweekly") {
    weeklyPayment = paymentPerPeriod / 2;
  } else {
    weeklyPayment = paymentPerPeriod;
  }

  return {
    paymentPerPeriod,
    weeklyPayment,
    totalProfit,
    totalCost,
    amountFinanced,
  };
}

function computeRecommendedDownPayment(args: {
  salePrice: number;
  targetWeeklyPayment: number;
  apr: number;
  termWeeks: number;
  paymentFrequency: PaymentFrequency;
  minDownPayment: number;
}) {
  const {
    salePrice,
    targetWeeklyPayment,
    apr,
    termWeeks,
    paymentFrequency,
    minDownPayment,
  } = args;

  if (!targetWeeklyPayment || targetWeeklyPayment <= 0) {
    return null;
  }

  let periodsPerYear: number;
  let periods: number;
  let desiredPeriodicPayment: number;

  if (paymentFrequency === "monthly") {
    periodsPerYear = 12;
    const termMonths = termWeeks / 4.345;
    periods = Math.max(1, Math.round(termMonths));
    desiredPeriodicPayment = targetWeeklyPayment * 4.345;
  } else if (paymentFrequency === "biweekly") {
    periodsPerYear = 26;
    periods = Math.max(1, Math.round(termWeeks / 2));
    desiredPeriodicPayment = targetWeeklyPayment * 2;
  } else {
    periodsPerYear = 52;
    periods = Math.max(1, termWeeks);
    desiredPeriodicPayment = targetWeeklyPayment;
  }

  const ratePerPeriod = apr / 100 / periodsPerYear;

  let maxAmountFinanced: number;
  if (ratePerPeriod === 0) {
    maxAmountFinanced = desiredPeriodicPayment * periods;
  } else {
    maxAmountFinanced =
      desiredPeriodicPayment *
      ((1 - Math.pow(1 + ratePerPeriod, -periods)) / ratePerPeriod);
  }

  const rawDown = salePrice - maxAmountFinanced;
  let recommended = Math.max(rawDown, minDownPayment);

  if (recommended <= 0) {
    return null;
  }

  recommended = Math.ceil(recommended / 50) * 50;

  return recommended;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AffordabilityInput;

    const userId = body.userId ?? null;

    const settings = await resolveDealerSettings(userId);

    let planType: "free" | "pro" = "free";

    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan_type")
        .eq("id", userId)
        .maybeSingle();

      if (profile && profile.plan_type === "pro") {
        planType = "pro";
      }
    }

    if (planType !== "pro") {
      return NextResponse.json(
        { error: "Affordability mode is available for Pro users only." },
        { status: 403 },
      );
    }

    const monthlyIncome = Number(body.monthlyIncome) || 0;
    const availableDown = Number(body.availableDown) || 0;
    const vehicleCost = Number(body.vehicleCost) || 0;
    const reconCost = Number(body.reconCost) || 0;

    const salePriceMin = Number(body.salePriceMin) || 0;
    const salePriceMax = Number(body.salePriceMax) || 0;
    const salePriceStep = Number(body.salePriceStep) || 500;

    const termWeeksOptions = Array.isArray(body.termWeeksOptions)
      ? body.termWeeksOptions.filter((n) => typeof n === "number" && n > 0)
      : [];

    if (
      !monthlyIncome ||
      !availableDown ||
      !vehicleCost ||
      !salePriceMin ||
      !salePriceMax ||
      termWeeksOptions.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required affordability inputs." },
        { status: 400 },
      );
    }

    const paymentFrequency: PaymentFrequency =
      body.paymentFrequency || "weekly";

    const apr = body.apr ?? settings.defaultAPR;

    const maxPTI =
      typeof body.maxPTIOverride === "number" &&
      body.maxPTIOverride > 0 &&
      body.maxPTIOverride < settings.maxPTI
        ? body.maxPTIOverride
        : settings.maxPTI;

    const rules = {
      maxPTI,
      maxLTV: settings.maxLTV,
      minDownPayment: settings.minDownPayment,
      maxTermWeeks: settings.maxTermWeeks,
    };

    let best: AffordabilityBestStructure | null = null;

    for (
      let salePrice = salePriceMin;
      salePrice <= salePriceMax;
      salePrice += salePriceStep
    ) {
      for (const termWeeks of termWeeksOptions) {
        if (termWeeks > rules.maxTermWeeks) continue;

        const core = computePaymentAndProfit({
          salePrice,
          availableDown,
          vehicleCost,
          reconCost,
          apr,
          termWeeks,
          paymentFrequency,
        });

        const weeklyPayment = core.weeklyPayment;

        if (weeklyPayment <= 0) continue;

        const pti =
          monthlyIncome > 0
            ? (weeklyPayment * 4.345) / monthlyIncome
            : 0;

        if (pti <= 0 || pti > rules.maxPTI) continue;

        const ltv =
          core.totalCost > 0
            ? core.amountFinanced / core.totalCost
            : 0;

        const underwritingInput = {
          income: monthlyIncome,
          salePrice,
          vehicleCost,
          totalCost: core.totalCost,
          downPayment: availableDown,
          apr,
          termWeeks,
          weeklyPayment,
          pti,
          ltv,
          profit: core.totalProfit,
          jobTimeMonths: 12,
          repoCount: 0,
        };

        const underwriting = runUnderwritingEngine(
          underwritingInput,
          rules,
        );

        if (
          underwriting.verdict === "DECLINE"
        ) {
          continue;
        }

        if (
          !best ||
          salePrice > best.salePrice ||
          (salePrice === best.salePrice &&
            termWeeks < best.termWeeks)
        ) {
          best = {
            salePrice,
            termWeeks,
            weeklyPayment,
            pti,
            ltv,
            totalProfit: core.totalProfit,
            underwriting,
          };
        }
      }
    }

    let recommendedDownPayment: number | null = null;

    if (best && body.targetWeeklyPayment && body.targetWeeklyPayment > 0) {
      recommendedDownPayment = computeRecommendedDownPayment({
        salePrice: best.salePrice,
        targetWeeklyPayment: Number(body.targetWeeklyPayment),
        apr,
        termWeeks: best.termWeeks,
        paymentFrequency,
        minDownPayment: settings.minDownPayment,
      });
    }

    const response: AffordabilityResponse = {
      planType,
      settings,
      input: {
        monthlyIncome,
        availableDown,
        apr,
        paymentFrequency,
        termWeeksOptions,
        salePriceMin,
        salePriceMax,
        salePriceStep,
      },
      bestStructure: best,
      recommendedDownPayment,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
