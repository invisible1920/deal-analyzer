"use client";

import { CSSProperties } from "react";
import type { FormState } from "@/hooks/useDealAnalyzer";
import {
  printOfferSheet,
  printUnderwritingPacket
} from "@/lib/dealPrinting";
import { useIsMobile } from "@/hooks/useIsMobile";

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

  const isMobile = useIsMobile(768);

  // shared styles

  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
    minWidth: 0,
    wordBreak: "break-word",
    boxSizing: "border-box",
    maxWidth: "100%"
  };

  const basePayment =
  typeof result?.payment === "number" ? result.payment : null;

const formatDelta = (
  base: number | null,
  alt: number | undefined,
  opts: { prefix?: string; suffix?: string } = {}
) => {
  if (base === null || typeof alt !== "number") return null;
  const diff = alt - base;
  const { prefix = "", suffix = "" } = opts;

  if (Math.abs(diff) < 0.005) return `${prefix}no change${suffix}`;
  const dir = diff > 0 ? "up" : "down";
  return `${prefix}${dir} ${Math.abs(diff).toFixed(2)}${suffix}`;
};

const profitOptimizer =
  result?.profitOptimizer ||
  result?.underwriting?.profitOptimizer ||
  null;

const maxExtraProfit =
  profitOptimizer?.variants && profitOptimizer.variants.length > 0
    ? profitOptimizer.variants.reduce(
        (max: number, v: any) =>
          typeof v.extraProfit === "number"
            ? Math.max(max, v.extraProfit)
            : max,
        0
      )
    : 0;



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
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "flex-start" : "center",
    flexWrap: isMobile ? "nowrap" : "wrap",
    gap: isMobile ? 16 : 24,
    justifyContent: isMobile ? "flex-start" : "space-between",
    position: isMobile ? "static" : "sticky",
    top: 16,
    zIndex: 10,
    backdropFilter: "blur(14px)",
    boxSizing: "border-box",
    maxWidth: "100%",
    overflowX: "hidden"
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
    flexWrap: "wrap",
    width: "100%",
    rowGap: 12
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
    justifyContent: "center",
    maxWidth: "100%",
    boxSizing: "border-box"
  };

  const resultsGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "minmax(0, 1fr)" // stack cards on mobile
      : "repeat(3, minmax(0, 1fr))", // three columns on desktop
    gap: 20,
    marginTop: 24,
    alignItems: "stretch",
    maxWidth: "100%"
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

  const termWeeks =
    typeof result?.termWeeks === "number"
      ? result.termWeeks
      : typeof result?.termInWeeks === "number"
      ? result.termInWeeks
      : null;

  const advancedRiskFlags: string[] = (() => {
    if (!result) return [];

    const flags: string[] = [];

    // PTI flag
    if (ptiValue === null) {
      flags.push("No income on file so PTI risk cannot be calculated.");
    } else if (ptiValue > ptiLimit) {
      flags.push(
        `Payment to income is above your max PTI of ${(ptiLimit * 100).toFixed(
          0
        )} percent at ${((ptiValue || 0) * 100).toFixed(1)} percent.`
      );
    } else if (ptiValue > ptiLimit * 0.9) {
      flags.push(
        `Payment to income is close to your max PTI of ${(ptiLimit * 100).toFixed(
          0
        )} percent at ${((ptiValue || 0) * 100).toFixed(1)} percent.`
      );
    } else {
      flags.push(
        `Payment to income is comfortably inside your PTI limit at ${(
          ptiValue * 100
        ).toFixed(1)} percent.`
      );
    }

    // LTV flag
    if (typeof result?.ltv === "number") {
      const ltvPct = (result.ltv * 100).toFixed(1);
      const maxLtvPct = (policy.maxLTV * 100).toFixed(0);

      if (result.ltv > policy.maxLTV) {
        flags.push(
          `LTV is above your policy max of ${maxLtvPct} percent at ${ltvPct} percent.`
        );
      } else if (result.ltv > policy.maxLTV * 0.95) {
        flags.push(
          `LTV is high for this policy at ${ltvPct} percent, near the max of ${maxLtvPct} percent.`
        );
      } else {
        flags.push(
          `LTV is within normal range at ${ltvPct} percent against a max of ${maxLtvPct} percent.`
        );
      }
    }

    // Break even timing flag
    if (
      typeof result?.breakEvenWeek === "number" &&
      termWeeks &&
      termWeeks > 0
    ) {
      const pct = result.breakEvenWeek / termWeeks;

      if (pct >= 0.6) {
        flags.push(
          `Break even hits late at week ${result.breakEvenWeek} of ${termWeeks}, so you recover cost slowly.`
        );
      } else if (pct <= 0.35) {
        flags.push(
          `Break even hits early at week ${result.breakEvenWeek} of ${termWeeks}, giving more room for loss.`
        );
      } else {
        flags.push(
          `Break even is in the middle of the term at week ${result.breakEvenWeek} of ${termWeeks}.`
        );
      }
    }

    // Repo history flag
    if (typeof form.repoCount === "number") {
      if (form.repoCount >= 2) {
        flags.push(
          "Multiple prior repos on file. Expect higher early default risk."
        );
      } else if (form.repoCount === 1) {
        flags.push(
          "One prior repo on file. Consider stronger down payment or shorter term."
        );
      } else {
        flags.push("No prior repos on file for this customer in your form.");
      }
    }

    return flags;
  })();


    const hiddenRiskSeverity =
    typeof result?.riskScore === "string" ? result.riskScore : "Medium";

  const primaryRiskFocus =
    ptiValue !== null && ptiValue > ptiLimit
      ? "Tighten PTI by lowering payment with more down, a shorter term or a lower price."
      : typeof result?.ltv === "number" && result.ltv > policy.maxLTV
      ? "Lower LTV with more down, a cheaper vehicle or stronger collateral."
      : typeof form.repoCount === "number" && form.repoCount >= 1
      ? "Customer history shows repos. Consider stronger down, GPS or a shorter term before funding."
      : "Structure is inside policy. Focus on profit and compliance checks rather than raw risk.";





  const delinquencyRisk =
    result?.delinquencyRisk ||
    (ptiValue !== null && ptiValue > ptiLimit
      ? "Higher early payment risk due to tight PTI."
      : "Standard delinquency risk for this PTI and stability pattern.");



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
              color: "#052e16",
              width: isMobile ? "100%" : "auto",
              textAlign: "center",
              alignSelf: isMobile ? "stretch" : "center",
              marginTop: isMobile ? 4 : 0
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

      {/* AI deal opinion above grid */}
      {result.aiExplanation && (
        <section
          style={{
            ...panel,
            marginTop: 16
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
            <h2 style={{ fontSize: 17, marginBottom: 6 }}>Hidden risk flags</h2>

            {/* overall risk and quick takeaway */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
                gap: 8
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: colors.textSecondary
                }}
              >
                Overall risk on this structure
              </span>
              <span style={riskChipStyle(hiddenRiskSeverity)}>
                {hiddenRiskSeverity}
              </span>
            </div>

            <p
              style={{
                fontSize: 13,
                marginBottom: 10,
                color: colors.textSecondary
              }}
            >
              Next step: {primaryRiskFocus}
            </p>

            {/* detailed drivers */}
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
                  Pro shows which risk flags triggered and gives a clear next
                  step before you fund the deal.
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
    <h2 style={{ fontSize: 17, marginBottom: 4 }}>Profit optimizer</h2>

    {isPro && maxExtraProfit > 0 && (
      <p
        style={{
          fontSize: 12,
          marginBottom: 10,
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: ".08em"
        }}
      >
        Up to ${maxExtraProfit.toFixed(0)} more profit inside policy
      </p>
    )}

    {isPro ? (
      <>
        {profitOptimizer && profitOptimizer.variants?.length > 0 ? (
          <>
            <p
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 10
              }}
            >
              Pick a structure below. All options stay inside your PTI and LTV
              policy rules. Start with the first option for the best balance of
              profit and risk.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 12
              }}
            >
              {profitOptimizer.variants.map((v: any, idx: number) => {
                const paymentDelta = formatDelta(basePayment, v.payment, {
                  prefix: "Payment ",
                  suffix: " per week"
                });

                const ptiDelta =
                  typeof v.pti === "number" && typeof result?.paymentToIncome === "number"
                    ? formatDelta(result.paymentToIncome, v.pti, {
                        prefix: "PTI ",
                        suffix: " points"
                      })
                    : null;

                const termDelta =
                  typeof termWeeks === "number" && typeof v.termWeeks === "number"
                    ? formatDelta(termWeeks, v.termWeeks, {
                        prefix: "Term ",
                        suffix: " weeks"
                      })
                    : null;

                const ltvDelta =
                  typeof result?.ltv === "number" && typeof v.ltv === "number"
                    ? formatDelta(result.ltv, v.ltv, {
                        prefix: "LTV ",
                        suffix: " points"
                      })
                    : null;

                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                      padding: 10,
                      background: idx === 0 ? "rgba(34,197,94,0.07)" : "transparent"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                        gap: 8
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14
                        }}
                      >
                        {v.label}
                      </span>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "#dcfce7",
                          color: "#166534",
                          whiteSpace: "nowrap"
                        }}
                      >
                        +${v.extraProfit.toFixed(0)} profit
                      </span>
                    </div>

                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        fontSize: 13,
                        lineHeight: 1.5
                      }}
                    >
                      {paymentDelta && <li>{paymentDelta}</li>}
                      {termDelta && <li>{termDelta}</li>}
                      {ptiDelta && <li>{ptiDelta}</li>}
                      {ltvDelta && <li>{ltvDelta}</li>}
                      {!paymentDelta &&
                        !termDelta &&
                        !ptiDelta &&
                        !ltvDelta && (
                          <li>
                            Adjusts structure to add profit while staying inside
                            policy.
                          </li>
                        )}
                    </ul>

                    {idx === 0 && (
                      <p
                        style={{
                          marginTop: 6,
                          marginBottom: 0,
                          fontSize: 11,
                          color: colors.textSecondary
                        }}
                      >
                        Recommended starting point for this customer.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 8
            }}
          >
            No optimized structures calculated for this deal yet. Try adjusting
            sale price, down payment or term and run the analysis again.
          </p>
        )}

        {result?.underwriting?.adjustments && (
          <>
            <h3
              style={{
                fontSize: 13,
                marginTop: 8,
                marginBottom: 6,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: ".08em"
              }}
            >
              Targets for the structure you choose
            </h3>

            <ul
              style={{
                paddingLeft: 0,
                listStyle: "none",
                margin: 0,
                marginBottom: 10
              }}
            >
              {typeof result.underwriting.adjustments.newDownPayment ===
                "number" && (
                <li style={summaryRow}>
                  <span style={summaryLabel}>Down payment target</span>
                  <span style={summaryValue}>
                    $
                    {result.underwriting.adjustments.newDownPayment.toFixed(2)}
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
                    {result.underwriting.adjustments.newSalePrice.toFixed(2)}
                  </span>
                </li>
              )}
              {typeof result.underwriting.adjustments.newApr === "number" && (
                <li style={summaryRow}>
                  <span style={summaryLabel}>APR target</span>
                  <span style={summaryValue}>
                    {result.underwriting.adjustments.newApr.toFixed(2)} percent
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
              Apply best structure to form
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
          Pro tests alternate structures for you and suggests options that add
          profit without breaking PTI or LTV rules. See how a slightly stronger
          down payment, longer term or higher price changes payment and risk.
        </p>

        <div style={blurOverlay}>
          <div style={blurOverlayTitle}>Unlock profit optimizer</div>
          <p style={{ marginBottom: 10 }}>
            Pro often finds an extra one hundred to five hundred in profit on
            deals you already plan to fund, while staying inside your policy.
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
