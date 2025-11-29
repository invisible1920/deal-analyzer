"use client";

import { CSSProperties } from "react";
import type { FormState } from "@/hooks/useDealAnalyzer";
import {
  printOfferSheet,
  printUnderwritingPacket
} from "@/lib/dealPrinting";

type PlanType = "free" | "pro" | null;

type Props = {
  result: any;
  error: string | null;
  isPro: boolean;
  policy: { maxPTI: number; maxLTV: number; maxTermWeeks: number };
  colors: any;
  loading: boolean;
  form: FormState;
  applySuggestedStructure: () => Promise<void>;
  planType: PlanType;
};

export function ResultsDashboard(props: Props) {
  const {
    result,
    error,
    isPro,
    policy,
    colors,
    loading,
    form,
    applySuggestedStructure,
    planType
  } = props;

  // shared styles

  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)"
  };

  const lockedPanelInner: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    paddingBottom: 12
  };

  const blurOverlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(15,23,42,0.82)",
    color: "#f9fafb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: 13,
    padding: 16,
    backdropFilter: "blur(6px)",
    pointerEvents: "auto"
  };

  const blurOverlayTitle: CSSProperties = {
    fontWeight: 600,
    marginBottom: 6,
    fontSize: 14
  };

  const smallUpsell: CSSProperties = {
    marginTop: 10,
    fontSize: 12,
    color: colors.textSecondary
  };

  const summaryRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 14,
    padding: "2px 0"
  };

  const summaryLabel: CSSProperties = {
    color: colors.textSecondary,
    fontWeight: 500
  };

  const summaryValue: CSSProperties = {
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums"
  };

  const summaryBar: CSSProperties = {
    marginTop: 24,
    padding: "14px 20px",
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    background: "rgba(15, 23, 42, 0.96)",
    color: "#e5e7eb",
    display: "flex",
    flexWrap: "wrap",
    gap: 24,
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 16,
    zIndex: 10,
    backdropFilter: "blur(14px)"
  };

  const summaryChipLabel: CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    opacity: 0.85
  };

  const summaryChipValue: CSSProperties = {
    fontSize: 16,
    fontWeight: 600
  };

  const summaryChipGroup: CSSProperties = {
    display: "flex",
    gap: 28,
    flexWrap: "wrap"
  };

  const btnSecondary: CSSProperties = {
    padding: "8px 16px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    fontSize: 13,
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.22)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const resultsGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 20,
    marginTop: 24,
    alignItems: "stretch"
  };

  // derived metrics

  const ptiDisplay =
    result && typeof result.paymentToIncome === "number"
      ? `${(result.paymentToIncome * 100).toFixed(1)} percent`
      : "N A";

  const ptiValue =
    result && typeof result.paymentToIncome === "number"
      ? result.paymentToIncome
      : null;

  const ptiLimit = policy.maxPTI;

  const ptiFillPercent =
    ptiValue !== null && ptiLimit > 0
      ? Math.min((ptiValue / ptiLimit) * 100, 120)
      : 0;

  const ptiBarOuter: CSSProperties = {
    marginTop: 8,
    height: 6,
    borderRadius: 999,
    background: "#e5e7eb"
  };

  const ptiBarInner: CSSProperties = {
    height: "100%",
    borderRadius: 999,
    width: `${ptiFillPercent}%`,
    maxWidth: "100%",
    background:
      ptiFillPercent <= 80
        ? "#22c55e"
        : ptiFillPercent <= 100
        ? "#eab308"
        : "#ef4444",
    transition: "width 0.25s ease"
  };

  const riskChipStyle = (riskScore: string): CSSProperties => {
    const base: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600
    };

    if (riskScore.toLowerCase().includes("low")) {
      return { ...base, background: "#dcfce7", color: "#166534" };
    }
    if (riskScore.toLowerCase().includes("medium")) {
      return { ...base, background: "#fef9c3", color: "#854d0e" };
    }
    return { ...base, background: "#fee2e2", color: "#b91c1c" };
  };

  const verdictChipStyle = (verdict: string): CSSProperties => {
    const base: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: ".08em"
    };

    const v = verdict.toLowerCase();
    if (v.includes("approve")) {
      return { ...base, background: "#dcfce7", color: "#166534" };
    }
    if (v.includes("counter")) {
      return { ...base, background: "#fef9c3", color: "#854d0e" };
    }
    if (v.includes("decline") || v.includes("deny")) {
      return { ...base, background: "#fee2e2", color: "#b91c1c" };
    }
    return { ...base, background: "#e5e7eb", color: "#111827" };
  };

  const verdictText =
    result?.underwriting?.verdict || result?.underwriting?.status || "Pending";

  const approvalScore =
    typeof result?.approvalScore === "number"
      ? Math.round(result.approvalScore)
      : null;

  const advancedRiskFlags: string[] =
    result?.riskFlags ||
    result?.advancedRiskFlags ||
    (result
      ? [
          ptiValue !== null && ptiValue > ptiLimit
            ? "Payment to income is above policy comfort range."
            : "Payment to income is close to policy limit.",
          typeof result?.ltv === "number" && result.ltv > policy.maxLTV
            ? "LTV is advanced compared to your policy snapshot."
            : "LTV is within normal range.",
          form.repoCount >= 2
            ? "Multiple past repos reported. High early default risk."
            : "Limited repo history on file."
        ]
      : []);

  const delinquencyRisk =
    result?.delinquencyRisk ||
    (ptiValue !== null && ptiValue > ptiLimit
      ? "Higher early payment risk due to tight PTI."
      : "Standard delinquency risk for this PTI and stability pattern.");

  const profitOptimizer =
    result?.profitOptimizer ||
    result?.underwriting?.profitOptimizer ||
    null;

  const portfolioComparison = result?.portfolioComparison || null;

  const complianceFlags: string[] =
    result?.complianceFlags ||
    (result
      ? [
          "Check your state maximum rate and term against this structure.",
          "Verify that doc fees and add ons follow local disclosure rules."
        ]
      : []);

  // early return views

  if (error) {
    return (
      <section
        style={{
          ...panel,
          marginTop: 24
        }}
      >
        <h2 style={{ fontSize: 17, marginBottom: 10 }}>Error</h2>
        <p style={{ color: "#ef4444", fontSize: 14 }}>{error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section
        style={{
          ...panel,
          marginTop: 24
        }}
      >
        <h2 style={{ fontSize: 17, marginBottom: 10 }}>Deal summary</h2>
        <p
          style={{
            fontSize: 14,
            color: colors.textSecondary
          }}
        >
          Run a deal to see payment, profit, PTI, LTV and underwriting. Pro also
          unlocks risk flags, profit optimizer and AI explanations.
        </p>
      </section>
    );
  }

  // main results

  return (
    <>
      {/* sticky summary bar */}
      <div style={summaryBar}>
        <div style={summaryChipGroup}>
          <div>
            <div style={summaryChipLabel}>Payment</div>
            <div style={summaryChipValue}>${result.payment.toFixed(2)}</div>
          </div>
          <div>
            <div style={summaryChipLabel}>Total profit</div>
            <div style={summaryChipValue}>
              ${result.totalProfit.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={summaryChipLabel}>PTI</div>
            <div style={summaryChipValue}>{ptiDisplay}</div>
          </div>
          <div>
            <div style={summaryChipLabel}>Verdict</div>
            <div style={summaryChipValue}>
              <span style={verdictChipStyle(verdictText)}>{verdictText}</span>
            </div>
          </div>
          {approvalScore !== null && (
            <div>
              <div style={summaryChipLabel}>Approval score</div>
              <div style={summaryChipValue}>{approvalScore} percent</div>
            </div>
          )}
        </div>
        {planType !== "pro" && (
          <a
            href="/billing"
            style={{
              ...btnSecondary,
              background:
                "linear-gradient(to right, #22c55e, #4ade80, #22c55e)",
              color: "#052e16"
            }}
          >
            Upgrade to save and export
          </a>
        )}
      </div>

      {/* label for results area */}
      <h2
        style={{
          marginTop: 24,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: colors.textSecondary
        }}
      >
        Deal analysis
      </h2>

      {/* results grid */}
      <div style={resultsGrid}>
        {/* deal summary card */}
        <section style={panel}>
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>Deal summary</h2>
          <ul
            style={{
              paddingLeft: 0,
              listStyle: "none",
              margin: 0
            }}
          >
            <li style={summaryRow}>
              <span style={summaryLabel}>Payment</span>
              <span style={summaryValue}>${result.payment.toFixed(2)}</span>
            </li>
            <li style={summaryRow}>
              <span style={summaryLabel}>Total interest</span>
              <span style={summaryValue}>
                ${result.totalInterest.toFixed(2)}
              </span>
            </li>
            <li style={summaryRow}>
              <span style={summaryLabel}>Total profit</span>
              <span style={summaryValue}>
                ${result.totalProfit.toFixed(2)}
              </span>
            </li>
            <li style={summaryRow}>
              <span style={summaryLabel}>Break even week</span>
              <span style={summaryValue}>{result.breakEvenWeek}</span>
            </li>
          </ul>
        </section>

        {/* basic risk */}
        <section style={panel}>
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>Basic risk</h2>
          <ul
            style={{
              paddingLeft: 0,
              listStyle: "none",
              margin: 0
            }}
          >
            <li style={summaryRow}>
              <span style={summaryLabel}>Payment to income</span>
              <span style={summaryValue}>{ptiDisplay}</span>
            </li>

            {ptiValue !== null && (
              <li>
                <div style={ptiBarOuter}>
                  <div style={ptiBarInner} />
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: colors.textSecondary,
                    display: "flex",
                    justifyContent: "space-between"
                  }}
                >
                  <span>
                    Policy max {(ptiLimit * 100).toFixed(0)} percent
                  </span>
                  <span>{ptiFillPercent.toFixed(0)} percent of limit</span>
                </div>
              </li>
            )}

            <li style={summaryRow}>
              <span style={summaryLabel}>Risk score</span>
              <span style={summaryValue}>
                <span style={riskChipStyle(result.riskScore)}>
                  {result.riskScore}
                </span>
              </span>
            </li>
            {typeof result.ltv === "number" && (
              <li style={summaryRow}>
                <span style={summaryLabel}>LTV</span>
                <span style={summaryValue}>
                  {(result.ltv * 100).toFixed(1)} percent
                </span>
              </li>
            )}
            {approvalScore !== null && (
              <li style={summaryRow}>
                <span style={summaryLabel}>Approval likelihood</span>
                <span style={summaryValue}>{approvalScore} percent</span>
              </li>
            )}
          </ul>
          {!isPro && (
            <p style={smallUpsell}>
              Upgrade to Pro to save risk history, see approval likelihood and
              catch over advanced cars before funding.
            </p>
          )}
        </section>

        {/* underwriting verdict */}
        {result.underwriting && (
          <section style={panel}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>
              Underwriting verdict
            </h2>
            <p style={{ marginBottom: 10 }}>
              <span style={verdictChipStyle(verdictText)}>{verdictText}</span>
            </p>

            {result.underwriting.reasons?.length > 0 && (
              <ul
                style={{
                  marginTop: 4,
                  paddingLeft: 18,
                  lineHeight: 1.6,
                  fontSize: 14
                }}
              >
                {result.underwriting.reasons.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}

            {!isPro && (
              <p style={smallUpsell}>
                Pro users see full policy reasoning for PTI, LTV, term, down
                payment and profit with every deal, plus AI commentary and
                delinquency prediction.
              </p>
            )}
          </section>
        )}

        {/* hidden risk flags */}
        <section style={panel}>
          <div style={lockedPanelInner}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>Hidden risk flags</h2>
            <ul
              style={{
                paddingLeft: 18,
                margin: 0,
                lineHeight: 1.6,
                fontSize: 14
              }}
            >
              {advancedRiskFlags.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>

            {!isPro && (
              <div style={blurOverlay}>
                <div style={blurOverlayTitle}>
                  Risk flags detected for this deal
                </div>
                <p style={{ marginBottom: 10 }}>
                  Pro shows which risk flags triggered and how to fix them
                  before you fund the deal.
                </p>
                <a href="/billing" style={btnSecondary}>
                  Unlock hidden risk flags
                </a>
              </div>
            )}
          </div>
        </section>

        {/* payment schedule */}
        {result?.schedulePreview && (
          <section style={panel}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>
              Payment schedule preview
            </h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", paddingBottom: 6 }}>
                    Period
                  </th>
                  <th style={{ textAlign: "right", paddingBottom: 6 }}>
                    Interest
                  </th>
                  <th style={{ textAlign: "right", paddingBottom: 6 }}>
                    Principal
                  </th>
                  <th style={{ textAlign: "right", paddingBottom: 6 }}>
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.schedulePreview.map((row: any) => (
                  <tr key={row.period}>
                    <td>{row.period}</td>
                    <td style={{ textAlign: "right" }}>
                      {row.interest.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {row.principal.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {row.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              style={{
                marginTop: 8,
                fontSize: 11,
                color: colors.textSecondary
              }}
            >
              Showing first 12 periods only for a quick glance. Pro users can
              print full schedules inside offer sheets and underwriting packets.
            </p>
          </section>
        )}

               {/* profit optimizer */}
        <section style={panel}>
          <div style={lockedPanelInner}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>Profit optimizer</h2>

            {isPro ? (
              <>
                {profitOptimizer ? (
                  <>
                    <p
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginBottom: 8
                      }}
                    >
                      We found alternate structures that increase profit while
                      staying inside your policy.
                    </p>

                    <ul
                      style={{
                        paddingLeft: 18,
                        margin: 0,
                        lineHeight: 1.6,
                        fontSize: 14
                      }}
                    >
                      {profitOptimizer.variants?.map((v: any, idx: number) => (
                        <li key={idx}>
                          {v.label} adds approximately $
                          {v.extraProfit.toFixed(0)} profit while staying inside
                          policy.
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginBottom: 8
                    }}
                  >
                    No optimized structures calculated for this deal yet. Try
                    adjusting sale price, down payment or term and running the
                    analysis again.
                  </p>
                )}

                {result?.underwriting?.adjustments && (
                  <>
                    <ul
                      style={{
                        paddingLeft: 0,
                        listStyle: "none",
                        margin: 0,
                        marginTop: 10,
                        marginBottom: 12
                      }}
                    >
                      {typeof result.underwriting.adjustments.newDownPayment ===
                        "number" && (
                        <li style={summaryRow}>
                          <span style={summaryLabel}>Down payment target</span>
                          <span style={summaryValue}>
                            $
                            {result.underwriting.adjustments.newDownPayment.toFixed(
                              2
                            )}
                          </span>
                        </li>
                      )}
                      {typeof result.underwriting.adjustments.newTermWeeks ===
                        "number" && (
                        <li style={summaryRow}>
                          <span style={summaryLabel}>Term target</span>
                          <span style={summaryValue}>
                            {result.underwriting.adjustments.newTermWeeks} weeks
                          </span>
                        </li>
                      )}
                      {typeof result.underwriting.adjustments.newSalePrice ===
                        "number" && (
                        <li style={summaryRow}>
                          <span style={summaryLabel}>Sale price target</span>
                          <span style={summaryValue}>
                            $
                            {result.underwriting.adjustments.newSalePrice.toFixed(
                              2
                            )}
                          </span>
                        </li>
                      )}
                      {typeof result.underwriting.adjustments.newApr ===
                        "number" && (
                        <li style={summaryRow}>
                          <span style={summaryLabel}>APR target</span>
                          <span style={summaryValue}>
                            {result.underwriting.adjustments.newApr.toFixed(2)}{" "}
                            percent
                          </span>
                        </li>
                      )}
                    </ul>

                    <button
                      type="button"
                      style={btnSecondary}
                      onClick={() => {
                        if (!loading) {
                          void applySuggestedStructure();
                        }
                      }}
                    >
                      Apply suggested structure to form
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8
                  }}
                >
                  Pro finds alternate structures that increase profit without
                  breaking PTI or LTV, such as slightly higher price, longer
                  term or stronger down payment.
                </p>

                <div style={blurOverlay}>
                  <div style={blurOverlayTitle}>Unlock profit optimizer</div>
                  <p style={{ marginBottom: 10 }}>
                    Pro suggests alternate structures that often add hundreds in
                    profit while staying inside your policy.
                  </p>
                  <a href="/billing" style={btnSecondary}>
                    See profit optimized options
                  </a>
                </div>
              </>
            )}
          </div>
        </section>


        {/* customer offer sheet */}
        <section style={panel}>
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>Customer offer sheet</h2>
          <p
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12
            }}
          >
            Generate a one page customer offer with payment, term and structure
            that you can print or save as PDF.
          </p>

          {isPro ? (
            <button
              type="button"
              style={btnSecondary}
              onClick={() => printOfferSheet(result, form)}
            >
              Print customer offer
            </button>
          ) : (
            <a href="/billing" style={btnSecondary}>
              Upgrade to unlock offer sheet
            </a>
          )}
        </section>

        {/* underwriting packet */}
        <section style={panel}>
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>Underwriting packet</h2>
          <p
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12
            }}
          >
            Print a full underwriting summary with verdict, reasons, PTI, LTV
            and AI commentary plus risk and compliance flags.
          </p>
          {isPro ? (
            <button
              type="button"
              style={btnSecondary}
              onClick={() => printUnderwritingPacket(result)}
            >
              Print underwriting packet
            </button>
          ) : (
            <a href="/billing" style={btnSecondary}>
              Upgrade to unlock underwriting packet
            </a>
          )}
        </section>

        {/* policy snapshot */}
        <section style={panel}>
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>Policy snapshot</h2>
          <ul
            style={{
              paddingLeft: 0,
              listStyle: "none",
              margin: 0
            }}
          >
            <li style={summaryRow}>
              <span style={summaryLabel}>Max PTI</span>
              <span style={summaryValue}>
                {(policy.maxPTI * 100).toFixed(0)} percent
              </span>
            </li>
            <li style={summaryRow}>
              <span style={summaryLabel}>Max LTV</span>
              <span style={summaryValue}>
                {(policy.maxLTV * 100).toFixed(0)} percent
              </span>
            </li>
            <li style={summaryRow}>
              <span style={summaryLabel}>Max term</span>
              <span style={summaryValue}>{policy.maxTermWeeks} weeks</span>
            </li>
          </ul>
        </section>

        {/* compliance and delinquency */}
        <section style={panel}>
          <div style={lockedPanelInner}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>
              Compliance and delinquency view
            </h2>
            <h3
              style={{
                fontSize: 13,
                marginBottom: 6,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: ".08em"
              }}
            >
              Compliance flags
            </h3>
            <ul
              style={{
                paddingLeft: 18,
                marginTop: 0,
                marginBottom: 10,
                lineHeight: 1.5,
                fontSize: 14
              }}
            >
              {complianceFlags.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>

            <h3
              style={{
                fontSize: 13,
                marginBottom: 6,
                marginTop: 10,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: ".08em"
              }}
            >
              Delinquency predictor
            </h3>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5
              }}
            >
              {delinquencyRisk}
            </p>

            {!isPro && (
              <div style={blurOverlay}>
                <div style={blurOverlayTitle}>
                  State level risk and delinquency prediction
                </div>
                <p style={{ marginBottom: 10 }}>
                  Pro highlights state specific limits and gives an AI view of
                  early payment risk so you know which deals need tighter
                  structure.
                </p>
                <a href="/billing" style={btnSecondary}>
                  Unlock compliance and delinquency tools
                </a>
              </div>
            )}
          </div>
        </section>

        {/* portfolio benchmarking */}
        <section style={panel}>
          <div style={lockedPanelInner}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>
              Portfolio benchmarking
            </h2>
            {portfolioComparison && isPro ? (
              <ul
                style={{
                  paddingLeft: 18,
                  margin: 0,
                  lineHeight: 1.6,
                  fontSize: 14
                }}
              >
                <li>
                  PTI on this deal is{" "}
                  {portfolioComparison.ptiDelta.toFixed(1)} percent{" "}
                  {portfolioComparison.ptiDelta > 0 ? "above" : "below"} your
                  store average.
                </li>
                <li>
                  LTV is {portfolioComparison.ltvDelta.toFixed(1)} points
                  compared to your recent portfolio.
                </li>
                <li>
                  Profit per deal is tracking{" "}
                  {portfolioComparison.profitDelta.toFixed(0)} dollars from your
                  target goal.
                </li>
              </ul>
            ) : (
              <p
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 8
                }}
              >
                Pro compares this structure against your last month of funded
                deals so you can see if PTI, LTV and profit are trending high,
                low or right on target.
              </p>
            )}

            {!isPro && (
              <div style={blurOverlay}>
                <div style={blurOverlayTitle}>
                  See how this deal compares
                </div>
                <p style={{ marginBottom: 10 }}>
                  Upgrade to Pro to benchmark every new deal against your store
                  history and monthly portfolio report.
                </p>
                <a href="/billing" style={btnSecondary}>
                  Unlock portfolio reporting
                </a>
              </div>
            )}
          </div>
        </section>

        {/* sales scripts / save the deal help */}
        <section style={panel}>
          <div style={lockedPanelInner}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>
              Save the deal scripts
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: colors.textSecondary
              }}
            >
              Pro can generate quick talking points and scripts based on this
              structure, such as how to present a higher down payment or longer
              term without losing the customer.
            </p>

            {!isPro && (
              <div style={blurOverlay}>
                <div style={blurOverlayTitle}>
                  Turn structure into a close
                </div>
                <p style={{ marginBottom: 10 }}>
                  Unlock Pro to get simple scripts you can use on the lot when a
                  customer pushes back on payment or down payment.
                </p>
                <a href="/billing" style={btnSecondary}>
                  Upgrade to Pro
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* AI deal opinion */}
      {result.aiExplanation && (
        <section
          style={{
            ...panel,
            marginTop: 24
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10
            }}
          >
            <h2 style={{ fontSize: 17 }}>AI deal opinion</h2>
            {!isPro && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background:
                    "linear-gradient(to right, #22c55e, #4ade80)",
                  color: "#052e16",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase"
                }}
              >
                Pro
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap"
            }}
          >
            {result.aiExplanation}
          </p>

          {!isPro && (
            <div style={{ marginTop: 12 }}>
              <a href="/billing" style={btnSecondary}>
                Unlock full AI underwriting with Pro
              </a>
            </div>
          )}
        </section>
      )}

      {/* monthly portfolio report upsell */}
      {!isPro && (
        <section
          style={{
            ...panel,
            marginTop: 24
          }}
        >
          <h2 style={{ fontSize: 17, marginBottom: 8 }}>
            Monthly portfolio report (Pro)
          </h2>
          <p
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 10
            }}
          >
            Pro users receive a monthly portfolio snapshot with PTI and LTV
            trends, average profit per deal and a list of risky structures that
            should be tightened before the next month.
          </p>
          <a href="/billing" style={btnSecondary}>
            Upgrade to get your portfolio report
          </a>
        </section>
      )}
    </>
  );
}
