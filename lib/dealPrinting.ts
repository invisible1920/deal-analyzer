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

  const verdictLower = String(verdictText).toLowerCase();

  let verdictClass = "pill pillNeutral";
  if (verdictLower.includes("approve")) verdictClass = "pill pillGood";
  else if (verdictLower.includes("counter")) verdictClass = "pill pillWarn";
  else if (verdictLower.includes("decline") || verdictLower.includes("deny"))
    verdictClass = "pill pillBad";

  const reasons =
    result.underwriting?.reasons || result.underwritingReasons || [];

  const aiText = result.aiExplanation
    ? String(result.aiExplanation).replace(/</g, "&lt;")
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Underwriting packet</title>
      <meta charset="utf-8" />
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 32px;
          color: #0f172a;
          background: #0b1220;
        }
        .page {
          max-width: 800px;
          margin: 0 auto;
          background: #f8fafc;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.55);
        }
        .pageHeader {
          padding: 20px 28px 18px;
          background: radial-gradient(circle at top left, #38bdf8, #4f46e5 55%, #0f172a);
          color: #e5e7eb;
        }
        .headerTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .dealerName {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: .03em;
        }
        .headerMeta {
          text-align: right;
          font-size: 12px;
          opacity: 0.9;
        }
        .headerMeta span {
          display: block;
        }
        .headerSub {
          margin-top: 8px;
          font-size: 13px;
          opacity: 0.9;
        }
        .pillRow {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .08em;
          border: 1px solid rgba(148, 163, 184, 0.5);
          background: rgba(15, 23, 42, 0.45);
        }
        .pill strong {
          margin-right: 6px;
        }
        .pillGood {
          background: rgba(22, 163, 74, 0.24);
          border-color: rgba(34, 197, 94, 0.7);
          color: #dcfce7;
        }
        .pillWarn {
          background: rgba(202, 138, 4, 0.25);
          border-color: rgba(250, 204, 21, 0.75);
          color: #fefce8;
        }
        .pillBad {
          background: rgba(220, 38, 38, 0.24);
          border-color: rgba(248, 113, 113, 0.9);
          color: #fee2e2;
        }
        .pillNeutral {
          color: #e5e7eb;
        }

        .pageBody {
          padding: 22px 28px 26px;
        }
        h2 {
          font-size: 14px;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #64748b;
        }
        .section {
          margin-bottom: 18px;
        }
        .gridTwo {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .card {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 12px 14px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .label {
          color: #64748b;
        }
        .value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .divider {
          height: 1px;
          border: 0;
          margin: 20px 0 16px;
          background: linear-gradient(to right, rgba(148, 163, 184, 0.25), rgba(148, 163, 184, 0.05));
        }
        ul {
          margin: 0;
          padding-left: 18px;
          font-size: 13px;
          line-height: 1.55;
        }
        .aiBlock {
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-wrap;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f9fafb;
          padding: 12px 14px;
        }
        .footer {
          margin-top: 18px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .footer span {
          display: block;
        }

        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .page {
            max-width: none;
            border-radius: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="pageHeader">
          <div class="headerTop">
            <div>
              <div class="dealerName">${dealerName}</div>
              <div class="headerSub">Underwriting summary for this structure</div>
            </div>
            <div class="headerMeta">
              <span>${new Date().toLocaleDateString()}</span>
              <span>Generated by BHPH Deal Analyzer</span>
            </div>
          </div>
          <div class="pillRow">
            <div class="${verdictClass}">
              <strong>Verdict</strong> ${verdictText}
            </div>
            <div class="pill">
              <strong>PTI</strong> ${ptiPercent}
            </div>
            <div class="pill">
              <strong>LTV</strong> ${ltvPercent}
            </div>
          </div>
        </div>

        <div class="pageBody">
          <div class="section gridTwo">
            <div class="card">
              <h2>Deal summary</h2>
              <div class="row">
                <span class="label">Payment</span>
                <span class="value">$${result.payment.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="label">Total profit</span>
                <span class="value">$${result.totalProfit.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="label">Break even week</span>
                <span class="value">${result.breakEvenWeek}</span>
              </div>
            </div>

            <div class="card">
              <h2>Risk snapshot</h2>
              <div class="row">
                <span class="label">Payment to income</span>
                <span class="value">${ptiPercent}</span>
              </div>
              <div class="row">
                <span class="label">LTV</span>
                <span class="value">${ltvPercent}</span>
              </div>
              <div class="row">
                <span class="label">Risk score</span>
                <span class="value">${result.riskScore || "N A"}</span>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <div class="section">
            <h2>Underwriting reasons</h2>
            ${
              reasons.length
                ? `<ul>${reasons
                    .map((r: string) => `<li>${r}</li>`)
                    .join("")}</ul>`
                : "<p style='font-size:13px;color:#64748b;margin:0;'>No detailed reasons recorded for this decision.</p>"
            }
          </div>

          ${
            aiText
              ? `
          <hr class="divider" />
          <div class="section">
            <h2>AI underwriting commentary</h2>
            <div class="aiBlock">${aiText}</div>
          </div>
          `
              : ""
          }

          <div class="footer">
            <span>
              Internal use only. This packet is a working underwriting view and
              does not replace your written policy or legal review.
            </span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>

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
  const verdictLower = String(verdictText).toLowerCase();

  let verdictClass = "pill pillNeutral";
  if (verdictLower.includes("approve")) verdictClass = "pill pillGood";
  else if (verdictLower.includes("counter")) verdictClass = "pill pillWarn";
  else if (verdictLower.includes("decline") || verdictLower.includes("deny"))
    verdictClass = "pill pillBad";

  const formattedFrequency =
    paymentFrequency === "weekly"
      ? "per week"
      : paymentFrequency === "biweekly"
      ? "every two weeks"
      : paymentFrequency === "monthly"
      ? "per month"
      : `per ${paymentFrequency}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Offer Sheet</title>
      <meta charset="utf-8" />
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 32px;
          color: #0f172a;
          background: #020617;
        }
        .page {
          max-width: 760px;
          margin: 0 auto;
          background: #f8fafc;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.55);
        }
        .header {
          padding: 20px 28px 18px;
          background: radial-gradient(circle at top left, #38bdf8, #4f46e5 55%, #0f172a);
          color: #f9fafb;
        }
        .headerTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .dealerName {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: .03em;
        }
        .headerSub {
          margin-top: 6px;
          font-size: 13px;
          opacity: 0.9;
        }
        .headerMeta {
          text-align: right;
          font-size: 12px;
          opacity: 0.9;
        }
        .headerMeta span {
          display: block;
        }
        .pillRow {
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .08em;
          border: 1px solid rgba(148, 163, 184, 0.5);
          background: rgba(15, 23, 42, 0.45);
        }
        .pill strong {
          margin-right: 6px;
        }
        .pillGood {
          background: rgba(22, 163, 74, 0.24);
          border-color: rgba(34, 197, 94, 0.7);
          color: #dcfce7;
        }
        .pillWarn {
          background: rgba(202, 138, 4, 0.25);
          border-color: rgba(250, 204, 21, 0.75);
          color: #fefce8;
        }
        .pillBad {
          background: rgba(220, 38, 38, 0.24);
          border-color: rgba(248, 113, 113, 0.9);
          color: #fee2e2;
        }
        .pillNeutral {
          color: #e5e7eb;
        }

        .body {
          padding: 22px 28px 26px;
        }
        h2 {
          font-size: 14px;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #64748b;
        }
        .section {
          margin-bottom: 18px;
        }
        .gridTwo {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .card {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 12px 14px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .label {
          color: #64748b;
        }
        .value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .bigNumber {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .kpiLabel {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .10em;
          color: #64748b;
        }
        .divider {
          height: 1px;
          border: 0;
          margin: 20px 0 16px;
          background: linear-gradient(to right, rgba(148, 163, 184, 0.25), rgba(148, 163, 184, 0.05));
        }
        .verdictText {
          font-size: 16px;
          font-weight: 700;
          margin-top: 10px;
        }
        .verdictHint {
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
        }
        .footer {
          margin-top: 18px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .footer span {
          display: block;
        }

        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .page {
            max-width: none;
            border-radius: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="headerTop">
            <div>
              <div class="dealerName">${dealerName}</div>
              <div class="headerSub">Customer payment offer summary</div>
            </div>
            <div class="headerMeta">
              <span>${new Date().toLocaleDateString()}</span>
              <span>Offer generated by BHPH Deal Analyzer</span>
            </div>
          </div>
          <div class="pillRow">
            <div class="${verdictClass}">
              <strong>Verdict</strong> ${verdictText}
            </div>
            <div class="pill">
              <strong>PTI</strong> ${ptiPercent}
            </div>
            <div class="pill">
              <strong>LTV</strong> ${ltvPercent}
            </div>
          </div>
        </div>

        <div class="body">
          <div class="section gridTwo">
            <div class="card">
              <h2>Loan overview</h2>
              <div class="bigNumber">
                $${result.payment.toFixed(2)} <span style="font-size:12px;font-weight:500;color:#64748b;">${formattedFrequency}</span>
              </div>
              <div class="kpiLabel">Estimated payment</div>
              <div style="margin-top:10px;">
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
                  <span class="label">APR</span>
                  <span class="value">${apr.toFixed(2)} percent</span>
                </div>
                <div class="row">
                  <span class="label">Term</span>
                  <span class="value">${termMonths} months</span>
                </div>
              </div>
            </div>

            <div class="card">
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
            </div>
          </div>

          <hr class="divider" />

          <div class="section gridTwo">
            <div class="card">
              <h2>Dealer verdict</h2>
              <div class="verdictText">${verdictText}</div>
              <div class="verdictHint">
                Present this as the current approved structure. If payment or down payment need to move,
                you can use the lot ready scripts inside the app.
              </div>
            </div>

            <div class="card">
              <h2>Notes for customer</h2>
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.55;">
                This offer shows how the payment, down payment and term work together for this vehicle.
                Actual terms can change after verification of income, residence and underwriting review.
              </p>
            </div>
          </div>

          <div class="footer">
            <span>
              This sheet is an estimate only and does not represent a final loan contract.
              All terms are subject to your standard underwriting and legal review.
            </span>
            <span>Page 1 of 1</span>
          </div>
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
