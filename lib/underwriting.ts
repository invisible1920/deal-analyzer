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
  maxPTI: number;
  maxLTV: number;
  minDownPayment: number;
  maxTermWeeks: number;
}

interface DealInput {
  income: number;
  salePrice: number;
  vehicleCost: number;
  down: number;
  apr: number;
  termWeeks: number;
  pti: number;
  ltv: number;
  profit: number;
  jobTimeMonths: number;
  repoCount: number;
}

export function runUnderwritingEngine(
  deal: DealInput,
  rules: DealerRules
): UnderwritingResult {
  const reasons: string[] = [];
  let verdict: UnderwritingVerdict = "APPROVE";

  // PTI check
  if (deal.pti > rules.maxPTI) {
    verdict = "COUNTER";
    reasons.push(`PTI is too high at ${deal.pti}. Allowed is ${rules.maxPTI}.`);
  }

  // LTV check
  if (deal.ltv > rules.maxLTV) {
    verdict = "COUNTER";
    reasons.push(`LTV is too high at ${deal.ltv}. Allowed is ${rules.maxLTV}.`);
  }

  // Down payment adequacy
  if (deal.down < rules.minDownPayment) {
    verdict = "COUNTER";
    reasons.push(
      `Down payment is too low. Minimum required is ${rules.minDownPayment}.`
    );
  }

  // Profitability check
  if (deal.profit < 1500) {
    verdict = "COUNTER";
    reasons.push(`Profit is low at ${deal.profit}.`);
  }

  // Term check
  if (deal.termWeeks > rules.maxTermWeeks) {
    verdict = "COUNTER";
    reasons.push(
      `Term exceeds maximum of ${rules.maxTermWeeks} weeks. Currently ${deal.termWeeks}.`
    );
  }

  // Job time
  if (deal.jobTimeMonths < 3) {
    verdict = "COUNTER";
    reasons.push(`Job time is short at ${deal.jobTimeMonths} months.`);
  }

  // Repo history
  if (deal.repoCount >= 2) {
    verdict = "DECLINE";
    reasons.push(`Customer has ${deal.repoCount} repos.`);
  }

  // Upgraded decline rules
  if (deal.pti > rules.maxPTI + 5) {
    verdict = "DECLINE";
    reasons.push(`PTI is far over acceptable levels.`);
  }

  if (deal.ltv > rules.maxLTV + 15) {
    verdict = "DECLINE";
    reasons.push(`LTV is far over acceptable levels.`);
  }

  // If no reasons exist and initial verdict was approve
  if (verdict === "APPROVE") {
    return {
      verdict,
      reasons: ["Deal meets dealer criteria and profitability requirement"]
    };
  }

  // COUNTER OFFER LOGIC
  const adjustments: UnderwritingResult["adjustments"] = {};

  // Raise down payment
  if (deal.down < rules.minDownPayment) {
    adjustments.newDownPayment = rules.minDownPayment;
  }

  // Reduce term
  if (deal.termWeeks > rules.maxTermWeeks) {
    adjustments.newTermWeeks = rules.maxTermWeeks;
  }

  // Reduce sale price when LTV is high
  if (deal.ltv > rules.maxLTV) {
    const allowedSalePrice = deal.vehicleCost * (rules.maxLTV / 100);
    adjustments.newSalePrice = Math.round(allowedSalePrice);
  }

  return {
    verdict,
    reasons,
    adjustments
  };
}
