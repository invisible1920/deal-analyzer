// lib/dealPrinting.ts
import type { FormState } from "@/hooks/useDealAnalyzer";

export function printUnderwritingPacket(result: any) {
  if (!result) return;
  if (typeof window === "undefined") return;

  const dealerName =
    result.dealerSettings?.dealerName || "BHPH Deal Analyzer";

  const ptiPercent =
    typeof result.paymentToIncome === "number"
      ? (result.paymentToIncome * 100).toFixed(1) + " percent"
      : "N A";

  const ltvPercent =
    typeof result.ltv === "number"
      ? (result.ltv * 100).toFixed(1) + " percent"
      : "N A";

  const verdictText =
    result.underwriting?.verdict || result.underwritingVerdict || "PENDING";

  const reasons =
    result.underwriting?.reasons || result.underwritingReasons || [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Underwriting packet</title>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 32px;
          color: #0f172a;
          background: #f8fafc;
        }
        h1 { font-size: 22px; margin: 0; }
        h2 { font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
        .sub { font-size: 13px; color: #64748b; margin-top: 2px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
        .label { color: #64748b; }
        .value { font-weight: 600; }
        .divider { margin: 18px 0; border-top: 1px solid #e2e8f0; }
        ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5; }
        .ai-block { margin-top: 12px; font-size: 13px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>${dealerName}</h1>
      <div class="sub">Underwriting packet</div>

      <div class="divider"></div>

      <h2>Summary</h2>
      <div class="row">
        <span class="label">Payment</span>
        <span class="value">$${result.payment.toFixed(2)}</span>
      </div>
      <div class="row">
        <span class="label">Total profit</span>
        <span class="value">$${result.totalProfit.toFixed(2)}</span>
      </div>
      <div class="row">
        <span class="label">PTI</span>
        <span class="value">${ptiPercent}</span>
      </div>
      <div class="row">
        <span class="label">LTV</span>
        <span class="value">${ltvPercent}</span>
      </div>
      <div class="row">
        <span class="label">Verdict</span>
        <span class="value">${verdictText}</span>
      </div>

      <div class="divider"></div>

      <h2>Underwriting reasons</h2>
      ${
        reasons.length
          ? `<ul>${reasons.map((r: string) => `<li>${r}</li>`).join("")}</ul>`
          : "<p>No detailed reasons recorded.</p>"
      }

      ${
        result.aiExplanation
          ? `
      <div class="divider"></div>
      <h2>AI underwriting commentary</h2>
      <div class="ai-block">${String(result.aiExplanation).replace(
        /</g,
        "&lt;"
      )}</div>
      `
          : ""
      }

      <script>
        window.focus();
        window.print();
      </script>
    </body>
    </html>
  `;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function printOfferSheet(result: any, form: FormState) {
  if (!result) return;
  if (typeof window === "undefined") return;

  const offerWindow = window.open("", "_blank", "width=800,height=1000");
  if (!offerWindow) return;

  const dealerName =
    result.dealerSettings?.dealerName || "BHPH Deal Analyzer";
  const {
    salePrice,
    downPayment,
    vehicleCost,
    reconCost,
    apr,
    termMonths,
    paymentFrequency,
    monthlyIncome
  } = form;

  const amountFinanced = salePrice - downPayment;
  const totalCost = vehicleCost + reconCost;
  const ptiPercent =
    typeof result.paymentToIncome === "number"
      ? (result.paymentToIncome * 100).toFixed(1) + " percent"
      : "N A";
  const ltvPercent =
    typeof result.ltv === "number"
      ? (result.ltv * 100).toFixed(1) + " percent"
      : "N A";

  const verdictText = result.underwriting?.verdict || "PENDING";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Offer Sheet</title>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 32px;
          color: #0f172a;
          background: #f8fafc;
        }
        .sheet {
          max-width: 720px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px 28px;
        }
        h1 { font-size: 22px; margin: 0; }
        h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
        .sub { font-size: 13px; color: #64748b; margin-top: 2px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
        .label { color: #64748b; }
        .value { font-weight: 600; }
        .divider { margin: 18px 0; border-top: 1px solid #e2e8f0; }
        .verdict { font-size: 16px; font-weight: 700; margin-top: 10px; }
        .footer { margin-top: 28px; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <h1>${dealerName}</h1>
        <div class="sub">Customer payment offer summary</div>

        <div class="divider"></div>

        <h2>Loan overview</h2>
        <div class="row">
          <span class="label">Sale price</span>
          <span class="value">$${salePrice.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Down payment</span>
          <span class="value">$${downPayment.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Amount financed</span>
          <span class="value">$${amountFinanced.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Estimated payment</span>
          <span class="value">$${result.payment.toFixed(
            2
          )} per ${paymentFrequency}</span>
        </div>
        <div class="row">
          <span class="label">APR</span>
          <span class="value">${apr.toFixed(2)} percent</span>
        </div>
        <div class="row">
          <span class="label">Term</span>
          <span class="value">${termMonths} months</span>
        </div>

        <div class="divider"></div>

        <h2>Deal strength</h2>
        <div class="row">
          <span class="label">Payment to income</span>
          <span class="value">${ptiPercent}</span>
        </div>
        <div class="row">
          <span class="label">LTV</span>
          <span class="value">${ltvPercent}</span>
        </div>
        <div class="row">
          <span class="label">Monthly income (reported)</span>
          <span class="value">$${monthlyIncome.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Total cost (vehicle plus recon)</span>
          <span class="value">$${totalCost.toFixed(2)}</span>
        </div>

        <div class="divider"></div>

        <h2>Dealer verdict</h2>
        <div class="verdict">${verdictText}</div>

        <div class="footer">
          This sheet is an estimate only and does not represent a final loan contract.
          Terms are subject to verification of income, residency and underwriting approval.
        </div>
      </div>
      <script>
        window.focus();
        window.print();
      </script>
    </body>
    </html>
  `;

  offerWindow.document.open();
  offerWindow.document.write(html);
  offerWindow.document.close();
}
