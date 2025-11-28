"use client";

import { CSSProperties } from "react";
import type { FormState } from "@/hooks/useDealAnalyzer";

type Props = {
  form: FormState;
  handleChange: (field: keyof FormState, value: string | number) => void;
  runAnalysis: (form: FormState) => Promise<void>;
  loading: boolean;
  authLoaded: boolean;
  userId: string | null;
  colors: any;
};

export function DealForm({
  form,
  handleChange,
  runAnalysis,
  loading,
  authLoaded,
  userId,
  colors
}: Props) {
  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)"
  };

  const formGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16
  };

  const fieldHeader: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8
  };

  const labelStyle: CSSProperties = {
    fontSize: 11,
    marginBottom: 0,
    display: "block",
    fontWeight: 600,
    color: colors.textSecondary,
    letterSpacing: ".08em",
    textTransform: "uppercase"
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: colors.text,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    fontVariantNumeric: "tabular-nums"
  };

  const btn: CSSProperties = {
    padding: "12px 22px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    fontSize: 14,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.3)",
    transition: "transform 0.1s ease, box-shadow 0.1s ease"
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runAnalysis(form);
  }

  return (
    <section style={panel}>
      {/* tooltip styles copied from original page */}
      <style jsx>{`
        .tooltip {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .infoIcon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-size: 11px;
          font-weight: 700;
          color: #4f46e5;
          cursor: default;
        }

        .tooltipBubble {
          position: absolute;
          top: 120%;
          right: 0;
          width: 240px;
          background: #0f172a;
          color: #f9fafb;
          padding: 8px 10px;
          border-radius: 8px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.35);
          font-size: 11px;
          line-height: 1.45;
          z-index: 30;
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          transition: opacity 0.15s ease, transform 0.15s ease,
            visibility 0.15s ease;
        }

        .tooltipBubble::before {
          content: "";
          position: absolute;
          top: -5px;
          right: 10px;
          border-width: 0 5px 5px 5px;
          border-style: solid;
          border-color: transparent transparent #0f172a transparent;
        }

        .tooltip:hover .tooltipBubble {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>

      {authLoaded && !userId && (
        <div
          style={{
            background: "#fde68a22",
            border: "1px solid #facc15aa",
            padding: "8px 14px",
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
            color: "#92400e"
          }}
        >
          Not logged in, deals will not be saved.
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>
        <div style={formGrid}>
          {/* vehicleCost */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="vehicleCost" style={labelStyle}>
                Vehicle cost
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  What you paid to acquire the vehicle, including auction price
                  and buyer fee. Used to calculate your true cost and profit.
                </div>
              </div>
            </div>
            <input
              id="vehicleCost"
              type="number"
              style={inputStyle}
              value={form.vehicleCost}
              onChange={e => handleChange("vehicleCost", e.target.value)}
            />
          </div>

          {/* reconCost */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="reconCost" style={labelStyle}>
                Recon cost
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  Total reconditioning cost for this unit. Parts, labor and
                  detail that you invest before the sale.
                </div>
              </div>
            </div>
            <input
              id="reconCost"
              type="number"
              style={inputStyle}
              value={form.reconCost}
              onChange={e => handleChange("reconCost", e.target.value)}
            />
          </div>

          {/* salePrice */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="salePrice" style={labelStyle}>
                Sale price
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  Retail selling price of the vehicle before taxes and separate
                  fees. Drives gross profit and LTV.
                </div>
              </div>
            </div>
            <input
              id="salePrice"
              type="number"
              style={inputStyle}
              value={form.salePrice}
              onChange={e => handleChange("salePrice", e.target.value)}
            />
          </div>

          {/* downPayment */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="downPayment" style={labelStyle}>
                Down payment
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  Cash collected from the customer at delivery. This reduces the
                  amount financed and risk.
                </div>
              </div>
            </div>
            <input
              id="downPayment"
              type="number"
              style={inputStyle}
              value={form.downPayment}
              onChange={e => handleChange("downPayment", e.target.value)}
            />
          </div>

          {/* apr */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="apr" style={labelStyle}>
                APR
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  Annual percentage rate on the note. Many BHPH stores use
                  between nineteen and twenty nine point nine nine percent.
                </div>
              </div>
            </div>
            <input
              id="apr"
              type="number"
              style={inputStyle}
              value={form.apr}
              onChange={e => handleChange("apr", e.target.value)}
            />
          </div>

          {/* termMonths */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="termMonths" style={labelStyle}>
                Term months
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  Length of the contract in months. The policy also enforces a
                  maximum term in weeks.
                </div>
              </div>
            </div>
            <input
              id="termMonths"
              type="number"
              style={inputStyle}
              value={form.termMonths}
              onChange={e => handleChange("termMonths", e.target.value)}
            />
          </div>

          {/* paymentFrequency */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="paymentFrequency" style={labelStyle}>
                Payment frequency
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  How often the customer makes payments. Matching their pay
                  cycle usually gives a cleaner PTI.
                </div>
              </div>
            </div>
            <select
              id="paymentFrequency"
              style={inputStyle}
              value={form.paymentFrequency}
              onChange={e => handleChange("paymentFrequency", e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="biweekly">Biweekly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* monthlyIncome */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="monthlyIncome" style={labelStyle}>
                Monthly income
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  Customer gross monthly income before taxes. Used to compute
                  payment to income percentage.
                </div>
              </div>
            </div>
            <input
              id="monthlyIncome"
              type="number"
              style={inputStyle}
              value={form.monthlyIncome}
              onChange={e => handleChange("monthlyIncome", e.target.value)}
            />
          </div>

          {/* monthsOnJob */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="monthsOnJob" style={labelStyle}>
                Months on job
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  How long the customer has been at their current job in months.
                  Helps with stability and risk scoring.
                </div>
              </div>
            </div>
            <input
              id="monthsOnJob"
              type="number"
              style={inputStyle}
              value={form.monthsOnJob}
              onChange={e => handleChange("monthsOnJob", e.target.value)}
            />
          </div>

          {/* repoCount */}
          <div>
            <div style={fieldHeader}>
              <label htmlFor="repoCount" style={labelStyle}>
                Number of past repos
              </label>
              <div className="tooltip">
                <span className="infoIcon">?</span>
                <div className="tooltipBubble">
                  Total number of prior repossessions on the bureau or credit
                  app. Two or more often results in a hard decline.
                </div>
              </div>
            </div>
            <input
              id="repoCount"
              type="number"
              min={0}
              style={inputStyle}
              value={form.repoCount}
              onChange={e => handleChange("repoCount", e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" style={btn} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze deal"}
          </button>
        </div>
      </form>
    </section>
  );
}
