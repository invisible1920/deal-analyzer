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
  const adjustments: UnderwritingResult["adjustments"] = {};

  // These flags decide the final verdict after all checks
  let needsCounter = false;
  let hardDecline = false;

  const ptiPercent = deal.pti * 100;
  const ltvPercent = deal.ltv * 100;

  // Current financed amount
  const currentAdvance = deal.salePrice - deal.downPayment;

  // Effective policy thresholds that get stricter with repos
  let effectiveMaxPTI = rules.maxPTI;
  let effectiveMaxLTV = rules.maxLTV;
  let effectiveMinDown = rules.minDownPayment;
  let effectiveMaxTermWeeks = rules.maxTermWeeks;
  let profitFloor = 1500;

  // Repo based tightening
  if (deal.repoCount === 1) {
    effectiveMaxPTI = Math.max(0, rules.maxPTI - 0.03); // about three points tighter PTI
    effectiveMaxLTV = Math.max(0, rules.maxLTV - 0.10); // about ten points tighter LTV
    effectiveMinDown = Math.max(
      rules.minDownPayment + 300,
      deal.salePrice * 0.10
    ); // at least 10 percent or 300 above min
    effectiveMaxTermWeeks = Math.min(rules.maxTermWeeks, rules.maxTermWeeks - 12); // shorten term by about three months
    profitFloor = 2000;
    reasons.push(
      "One prior repo on file. Using tighter PTI, LTV, down payment, term, and profit targets."
    );
  } else if (deal.repoCount >= 2) {
    // Multiple repos is an auto decline
    hardDecline = true;
    reasons.push(
      `Customer has ${deal.repoCount} prior repos which exceeds risk tolerance.`
    );
  }

  // If income is not provided, PTI based logic is limited
  if (deal.income <= 0) {
    reasons.push("Income not provided. PTI cannot be calculated.");
  } else {
    // PTI rules
    if (deal.pti > effectiveMaxPTI + 0.05) {
      hardDecline = true;
      reasons.push(
        `Payment to income is ${ptiPercent.toFixed(
          1
        )} percent which is more than five points above effective max ${(
          effectiveMaxPTI * 100
        ).toFixed(1)} percent.`
      );
    } else if (deal.pti > effectiveMaxPTI) {
      needsCounter = true;
      reasons.push(
        `Payment to income is ${ptiPercent.toFixed(
          1
        )} percent which is above effective max ${(
          effectiveMaxPTI * 100
        ).toFixed(1)} percent.`
      );
    } else {
      reasons.push(
        `Payment to income is ${ptiPercent.toFixed(
          1
        )} percent which is within effective PTI policy.`
      );
    }
  }

  // LTV rules
  if (deal.ltv > effectiveMaxLTV + 0.15) {
    hardDecline = true;
    reasons.push(
      `LTV is ${ltvPercent.toFixed(
        1
      )} percent which is more than fifteen points over effective max ${(
        effectiveMaxLTV * 100
      ).toFixed(1)} percent.`
    );
  } else if (deal.ltv > effectiveMaxLTV) {
    needsCounter = true;
    reasons.push(
      `LTV is ${ltvPercent.toFixed(
        1
      )} percent which is above effective max ${(
        effectiveMaxLTV * 100
      ).toFixed(1)} percent. More down or lower sale price is needed.`
    );
  } else {
    reasons.push(
      `LTV is ${ltvPercent.toFixed(
        1
      )} percent which is within effective policy limit.`
    );
  }

  // Down payment vs effective minimum
  if (deal.downPayment < effectiveMinDown) {
    needsCounter = true;
    reasons.push(
      `Down payment is ${deal.downPayment.toFixed(
        2
      )}, effective minimum required is ${effectiveMinDown.toFixed(2)}.`
    );

    if (
      adjustments.newDownPayment === undefined ||
      adjustments.newDownPayment < effectiveMinDown
    ) {
      adjustments.newDownPayment = effectiveMinDown;
    }
  }

  // Profitability
  if (deal.profit < profitFloor) {
    needsCounter = true;
    reasons.push(
      `Total profit is ${deal.profit.toFixed(
        2
      )}, below the preferred floor of ${profitFloor.toFixed(0)}.`
    );
  } else {
    reasons.push(
      `Total profit of ${deal.profit.toFixed(
        2
      )} meets the preferred profit floor.`
    );
  }

  // Term rules
  if (deal.termWeeks > effectiveMaxTermWeeks) {
    needsCounter = true;
    reasons.push(
      `Term is ${deal.termWeeks} weeks, effective max term is ${effectiveMaxTermWeeks} weeks.`
    );
    adjustments.newTermWeeks = effectiveMaxTermWeeks;
  }

  // Job time rules
  if (deal.jobTimeMonths < 3) {
    // Very short job time
    if (deal.repoCount >= 1 || deal.pti > effectiveMaxPTI) {
      hardDecline = true;
      reasons.push(
        `Job time is ${deal.jobTimeMonths} months with prior repo or high PTI. Too unstable for this structure.`
      );
    } else {
      needsCounter = true;
      reasons.push(
        `Job time is ${deal.jobTimeMonths} months which is under the usual comfort window. Stronger structure is recommended.`
      );
    }
  } else if (deal.jobTimeMonths < 6) {
    needsCounter = needsCounter || deal.pti > effectiveMaxPTI * 0.9;
    reasons.push(
      `Job time is ${deal.jobTimeMonths} months which is modest. Avoid stretching PTI or term.`
    );
  } else {
    reasons.push(
      `Job time of ${deal.jobTimeMonths} months is acceptable under current policy.`
    );
  }

  // PTI based down payment suggestion
  if (
    currentAdvance > 0 &&
    deal.pti > 0 &&
    deal.income > 0 &&
    deal.pti > effectiveMaxPTI &&
    !hardDecline
  ) {
    const factor = effectiveMaxPTI / deal.pti;
    if (factor > 0 && factor < 1) {
      const targetAdvance = currentAdvance * factor;
      const rawNewDown = deal.salePrice - targetAdvance;

      let suggestedDown = Math.max(rawNewDown, effectiveMinDown);

      if (suggestedDown < deal.downPayment + 50) {
        suggestedDown = deal.downPayment + 50;
      }

      if (suggestedDown > deal.salePrice) {
        suggestedDown = deal.salePrice;
      }

      const roundedDown = Math.round(suggestedDown / 50) * 50;

      if (
        roundedDown > deal.downPayment &&
        (adjustments.newDownPayment === undefined ||
          roundedDown > adjustments.newDownPayment)
      ) {
        adjustments.newDownPayment = roundedDown;
      }
    }
  }

  // One prior repo that did not trigger a hard decline
  if (deal.repoCount === 1 && !hardDecline) {
    needsCounter = true;
    reasons.push(
      "Prior repo on file. Require at least policy level profit and stronger down payment or shorter term."
    );

    if (adjustments.newDownPayment !== undefined) {
      adjustments.newDownPayment = Math.max(
        adjustments.newDownPayment,
        effectiveMinDown + 200
      );
    } else {
      adjustments.newDownPayment = effectiveMinDown + 200;
    }

    if (adjustments.newTermWeeks !== undefined) {
      adjustments.newTermWeeks = Math.min(
        adjustments.newTermWeeks,
        effectiveMaxTermWeeks
      );
    }
  }

  // Hard decline overrides counters
  let verdict: UnderwritingVerdict = "APPROVE";

  if (hardDecline) {
    verdict = "DECLINE";
  } else if (needsCounter) {
    verdict = "COUNTER";
  } else {
    verdict = "APPROVE";
  }

  if (verdict === "APPROVE") {
    return {
      verdict,
      reasons: [
        "Deal meets effective criteria for PTI, LTV, down payment, term, profit, job time, and repo history.",
      ],
    };
  }

  return {
    verdict,
    reasons,
    adjustments,
  };
}
