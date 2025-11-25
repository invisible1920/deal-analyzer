export type UnderwritingVerdict = "APPROVE" | "COUNTER" | "DECLINE";

export interface UnderwritingResult {
  verdict: UnderwritingVerdict;
  reasons: string[];
  adjustments?: {
    newDownPayment?: number;
    newTermWeeks?: number;
    newApr?: number;
    newSalePrice?: number;
  };
}

interface DealerRules {
  // Stored as ratios, for example 0.25 for 25 percent and 1.40 for 140 percent
  maxPTI: number;
  maxLTV: number;
  minDownPayment: number;
  maxTermWeeks: number;
}

// This matches exactly what route.ts sends as underwritingInput
export interface UnderwritingDealInput {
  income: number;
  salePrice: number;
  vehicleCost: number;
  totalCost: number;
  downPayment: number;
  apr: number;
  termWeeks: number;
  weeklyPayment: number;
  pti: number;        // ratio, for example 0.25 for 25 percent
  ltv: number;        // ratio, for example 1.20 for 120 percent
  profit: number;
  jobTimeMonths: number;
  repoCount: number;
}

export function runUnderwritingEngine(
  deal: UnderwritingDealInput,
  rules: DealerRules
): UnderwritingResult {
  const reasons: string[] = [];
  let verdict: UnderwritingVerdict = "APPROVE";

  // PTI check
  if (deal.pti > rules.maxPTI) {
    verdict = "COUNTER";
    reasons.push(
      `Payment to income is ${(deal.pti * 100).toFixed(1)} percent, dealer max is ${(rules.maxPTI * 100).toFixed(1)} percent.`
    );
  }

  // LTV check
  if (deal.ltv > rules.maxLTV) {
    verdict = "COUNTER";
    reasons.push(
      `LTV is ${(deal.ltv * 100).toFixed(1)} percent, dealer max is ${(rules.maxLTV * 100).toFixed(1)} percent.`
    );
  }

  // Down payment adequacy
  if (deal.downPayment < rules.minDownPayment) {
    verdict = "COUNTER";
    reasons.push(
      `Down payment is ${deal.downPayment.toFixed(2)}, minimum required is ${rules.minDownPayment.toFixed(2)}.`
    );
  }

  // Profitability check
  if (deal.profit < 1500) {
    verdict = "COUNTER";
    reasons.push(
      `Total profit is ${deal.profit.toFixed(2)}, below the preferred floor of 1500.`
    );
  }

  // Term check
  if (deal.termWeeks > rules.maxTermWeeks) {
    verdict = "COUNTER";
    reasons.push(
      `Term is ${deal.termWeeks} weeks, dealer max is ${rules.maxTermWeeks} weeks.`
    );
  }

  // Job time
  if (deal.jobTimeMonths < 3) {
    verdict = "COUNTER";
    reasons.push(
      `Job time is ${deal.jobTimeMonths} months which is under the usual comfort window.`
    );
  }

  // Repo history
  if (deal.repoCount >= 2) {
    verdict = "DECLINE";
    reasons.push(`Customer has ${deal.repoCount} prior repos.`);
  }

  // Hard decline for very high PTI
  if (deal.pti > rules.maxPTI + 0.05) {
    verdict = "DECLINE";
    reasons.push(
      `Payment to income is far above policy, even for a counter structure.`
    );
  }

  // Hard decline for very high LTV
  if (deal.ltv > rules.maxLTV + 0.15) {
    verdict = "DECLINE";
    reasons.push(
      `LTV is far above acceptable limits, even with additional down payment.`
    );
  }

  // If still approve
  if (verdict === "APPROVE") {
    return {
      verdict,
      reasons: [
        "Deal meets dealer criteria for PTI, LTV, down payment, term, and profit."
      ]
    };
  }

  // Counter offer suggestions
  const adjustments: UnderwritingResult["adjustments"] = {};

  // Suggest raising down payment
  if (deal.downPayment < rules.minDownPayment) {
    adjustments.newDownPayment = rules.minDownPayment;
  }

  // Suggest reducing term
  if (deal.termWeeks > rules.maxTermWeeks) {
    adjustments.newTermWeeks = rules.maxTermWeeks;
  }

  // Suggest reducing sale price when LTV is high
  if (deal.ltv > rules.maxLTV) {
    const allowedAdvance = deal.vehicleCost * rules.maxLTV;
    const suggestedSalePrice = allowedAdvance + deal.downPayment;
    adjustments.newSalePrice = Math.round(suggestedSalePrice);
  }

  return {
    verdict,
    reasons,
    adjustments
  };
}
