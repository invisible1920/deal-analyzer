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

  // Current financed amount
  const currentAdvance = deal.salePrice - deal.downPayment;

  // We will fill this as we go
  const adjustments: UnderwritingResult["adjustments"] = {};

  // PTI check
  if (deal.pti > rules.maxPTI) {
    verdict = "COUNTER";
    reasons.push(
      `Payment to income is ${(deal.pti * 100).toFixed(
        1
      )} percent, dealer max is ${(rules.maxPTI * 100).toFixed(1)} percent.`
    );

    // Suggest a higher down payment that would bring PTI down near the max
    // Assumption: payment is roughly proportional to amount financed
    if (currentAdvance > 0 && deal.pti > 0) {
      const factor = rules.maxPTI / deal.pti; // for example 0.25 / 0.265
      if (factor > 0 && factor < 1) {
        const targetAdvance = currentAdvance * factor;
        const rawNewDown = deal.salePrice - targetAdvance;

        // Respect policy minimum and ensure it is at least a bit higher
        let suggestedDown = Math.max(rawNewDown, rules.minDownPayment);

        if (suggestedDown < deal.downPayment + 50) {
          suggestedDown = deal.downPayment + 50;
        }

        // Do not exceed sale price
        if (suggestedDown > deal.salePrice) {
          suggestedDown = deal.salePrice;
        }

        // Round to nearest 50 for a cleaner number
        const roundedDown = Math.round(suggestedDown / 50) * 50;

        if (roundedDown > deal.downPayment) {
          adjustments.newDownPayment = roundedDown;
        }
      }
    }
  }

  // LTV check
  if (deal.ltv > rules.maxLTV) {
    verdict = "COUNTER";
    reasons.push(
      `LTV is ${(deal.ltv * 100).toFixed(
        1
      )} percent, dealer max is ${(rules.maxLTV * 100).toFixed(1)} percent.`
    );
  }

  // Down payment adequacy vs minimum
  if (deal.downPayment < rules.minDownPayment) {
    verdict = "COUNTER";
    reasons.push(
      `Down payment is ${deal.downPayment.toFixed(
        2
      )}, minimum required is ${rules.minDownPayment.toFixed(2)}.`
    );

    // Only set if we do not already have a PTI based suggestion,
    // or if the PTI suggestion is still below the policy minimum
    if (
      adjustments.newDownPayment === undefined ||
      adjustments.newDownPayment < rules.minDownPayment
    ) {
      adjustments.newDownPayment = rules.minDownPayment;
    }
  }

  // Profitability check
  if (deal.profit < 1500) {
    verdict = "COUNTER";
    reasons.push(
      `Total profit is ${deal.profit.toFixed(
        2
      )}, below the preferred floor of 1500.`
    );
  }

  // Term check
  if (deal.termWeeks > rules.maxTermWeeks) {
    verdict = "COUNTER";
    reasons.push(
      `Term is ${deal.termWeeks} weeks, dealer max is ${rules.maxTermWeeks} weeks.`
    );

    adjustments.newTermWeeks = rules.maxTermWeeks;
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
        "Deal meets dealer criteria for PTI, LTV, down payment, term, and profit.",
      ],
    };
  }

  // If verdict is DECLINE, we still return any adjustments that were computed,
  // but they are suggestions rather than an approved counter.
  return {
    verdict,
    reasons,
    adjustments,
  };
}
