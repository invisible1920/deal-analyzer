"use client";

import { CSSProperties, useState } from "react";
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
  onScenarioRun?: (patch: Partial<FormState>) => void;
  onSaveScenario?: (resultForSave: any, formForSave: FormState) => void;
  onOpenCompare?: () => void;
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
    planType,
    onScenarioRun,
    onSaveScenario,
    onOpenCompare
  } = props;

    // AI states
  const [aiUnderwriter, setAiUnderwriter] = useState<string>("");
  const [aiCloser, setAiCloser] = useState<string>("");
  const [aiRiskMovie, setAiRiskMovie] = useState<string>("");

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  async function runAi(endpoint: string, setter: (t: string) => void) {
    setAiLoading(endpoint);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, result })
      });
      const data = await res.json();
      setter(data.text || "No response");
    } catch (err) {
      setter("Error talking to AI");
    } finally {
      setAiLoading(null);
    }
  }

  function runUnderwriter() {
    runAi("/api/ai-underwriter", setAiUnderwriter);
  }

  function runCloser() {
    runAi("/api/ai-closer-line", setAiCloser);
  }

  function runRiskMovie() {
    runAi("/api/ai-risk-movie", setAiRiskMovie);
  }



  const isMobile = useIsMobile(768);

  // shared styles

  const scriptIntro: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10
  };

  const scriptDetails: CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: "rgba(15,23,42,0.02)",
    padding: 10
  };

  const scriptSummaryRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    cursor: "pointer",
    listStyle: "none",
    fontSize: 13,
    fontWeight: 600
  };

  const scriptTag: CSSProperties = {
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: "rgba(34,197,94,0.12)",
    color: "#166534",
    whiteSpace: "nowrap"
  };

  const scriptBody: CSSProperties = {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap"
  };

  const scriptHint: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10
  };

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

  const hasVariants =
    !!profitOptimizer &&
    Array.isArray(profitOptimizer.variants) &&
    profitOptimizer.variants.length > 0;

  const hasAdjustments =
    !!result?.underwriting?.adjustments &&
    (typeof result.underwriting.adjustments.newDownPayment === "number" ||
      typeof result.underwriting.adjustments.newTermWeeks === "number" ||
      typeof result.underwriting.adjustments.newSalePrice === "number" ||
      typeof result.underwriting.adjustments.newApr === "number");

  const maxExtraProfit =
    hasVariants
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
    borderRadius: 24,
    border: `1px solid ${colors.border}`,
    background: "rgba(15, 23, 42, 0.96)",
    color: "#e5e7eb",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: isMobile ? "flex-start" : "space-between",
    gap: isMobile ? 16 : 24,
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
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontVariantNumeric: "tabular-nums"
  };

    const summaryChipGroup: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 24,
    width: "100%"
  };

  const summaryChipBox: CSSProperties = {
    minWidth: isMobile ? "48%" : 140,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2
  };

  const scenarioBar: CSSProperties = {
    marginTop: 12,
    marginBottom: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center"
  };

  const scenarioBtn: CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: 500,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  };

      const benchGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "minmax(0, 1fr)"
      : "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginTop: 8
  };

  const benchTile: CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 10,
    background: "rgba(15,23,42,0.02)",
    fontSize: 12
  };

  const aiRow: CSSProperties = {
    display: isMobile ? "block" : "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginTop: 12
  };

  const aiCard: CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 12,
    background: "rgba(15,23,42,0.02)",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    fontSize: 13,
    minHeight: 0
  };

  // btnSecondary must be above aiButton
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

  const aiButton: CSSProperties = {
    ...btnSecondary,
    width: "100%",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 6,
    fontSize: 12
  };

  const aiTitle: CSSProperties = {
    fontWeight: 600,
    fontSize: 14
  };

  const aiHint: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary
  };

  const aiOutput: CSSProperties = {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    maxHeight: 140,
    overflowY: "auto"
  };






  const benchLabel: CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: colors.textSecondary,
    marginBottom: 4
  };

  const benchCurrent: CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums"
  };

  const benchBaseline: CSSProperties = {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary
  };

  const benchTagGood: CSSProperties = {
    marginTop: 6,
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: "#dcfce7",
    color: "#166534"
  };

  const benchTagWarn: CSSProperties = {
    marginTop: 6,
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: "#fef9c3",
    color: "#854d0e"
  };

  

  const resultsGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "minmax(0, 1fr)"
      : "repeat(3, minmax(0, 1fr))",
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

  const hasPortfolioBenchmark =
    !!portfolioComparison &&
    typeof portfolioComparison.ptiDelta === "number" &&
    typeof portfolioComparison.ltvDelta === "number" &&
    typeof portfolioComparison.profitDelta === "number";

  const dealPtiPct =
    result && typeof result.paymentToIncome === "number"
      ? result.paymentToIncome * 100
      : null;

  const dealLtvPct =
    result && typeof result.ltv === "number" ? result.ltv * 100 : null;

  const dealProfit =
    result && typeof result.totalProfit === "number"
      ? result.totalProfit
      : null;

  const portfolioPtiPct =
    dealPtiPct !== null && hasPortfolioBenchmark
      ? dealPtiPct - portfolioComparison.ptiDelta
      : null;

  const portfolioLtvPct =
    dealLtvPct !== null && hasPortfolioBenchmark
      ? dealLtvPct - portfolioComparison.ltvDelta
      : null;

  const portfolioProfit =
    dealProfit !== null && hasPortfolioBenchmark
      ? dealProfit - portfolioComparison.profitDelta
      : null;

  const complianceFlags: string[] =
    result?.complianceFlags ||
    (result
      ? [
          "Check your state maximum rate and term against this structure.",
          "Verify that doc fees and add ons follow local disclosure rules."
        ]
      : []);

  // compliance analysis

  const complianceAnalysis = (() => {
    if (!result) {
      return {
        status: "Unknown",
        severity: "medium" as "low" | "medium" | "high",
        bullets: [] as string[]
      };
    }

    const bullets: string[] = [];
    let severity: "low" | "medium" | "high" = "low";

    // PTI vs policy
    if (ptiValue === null) {
      bullets.push(
        "No income on file so PTI can not be checked against policy."
      );
      severity = "high";
    } else if (ptiValue > ptiLimit) {
      bullets.push(
        `Payment to income exceeds your max PTI of ${(ptiLimit * 100).toFixed(
          0
        )} percent at ${((ptiValue || 0) * 100).toFixed(1)} percent.`
      );
      severity = "high";
    } else if (ptiValue > ptiLimit * 0.9) {
      bullets.push(
        `Payment to income is close to your PTI limit at ${(
          ptiValue * 100
        ).toFixed(1)} percent.`
      );
      severity = severity === "low" ? "medium" : severity;
    }

    // LTV vs policy
    if (typeof result?.ltv === "number") {
      const ltvPct = (result.ltv * 100).toFixed(1);
      const maxLtvPct = (policy.maxLTV * 100).toFixed(0);

      if (result.ltv > policy.maxLTV) {
        bullets.push(
          `LTV is above your policy max of ${maxLtvPct} percent at ${ltvPct} percent.`
        );
        severity = "high";
      } else if (result.ltv > policy.maxLTV * 0.95) {
        bullets.push(
          `LTV is high for this policy at ${ltvPct} percent, near the max of ${maxLtvPct} percent.`
        );
        severity = severity === "low" ? "medium" : severity;
      }
    }

    // Term vs policy
    if (termWeeks && policy.maxTermWeeks) {
      if (termWeeks > policy.maxTermWeeks) {
        bullets.push(
          `Term is over your policy max of ${policy.maxTermWeeks} weeks at ${termWeeks} weeks.`
        );
        severity = "high";
      } else if (termWeeks > policy.maxTermWeeks * 0.95) {
        bullets.push(
          `Term is near your policy max at ${termWeeks} weeks.`
        );
        severity = severity === "low" ? "medium" : severity;
      }
    }

    // Optional doc fee check
    if (
      typeof result?.docFee === "number" &&
      typeof result?.docFeeCap === "number"
    ) {
      if (result.docFee > result.docFeeCap) {
        bullets.push(
          `Doc fee of $${result.docFee.toFixed(
            2
          )} is above the cap you set at $${result.docFeeCap.toFixed(2)}.`
        );
        severity = "high";
      }
    }

    if (!bullets.length) {
      return {
        status: "Clean",
        severity: "low" as const,
        bullets: [
          "Rate, term and doc fee are inside the limits you have on file. Still confirm against your state rules before funding."
        ]
      };
    }

    return {
      status: "Needs review",
      severity,
      bullets
    };
  })();

  // delinquency analysis

  const delinquencyAnalysis = (() => {
    const bullets: string[] = [];

    // score: 0 = low, 1 = medium, 2 = high
    let score = 1;

    // PTI pressure
    if (ptiValue === null) {
      bullets.push("No income on file, PTI and payment pressure are unknown.");
      score = 2;
    } else if (ptiValue > ptiLimit) {
      bullets.push(
        `PTI is above your policy limit at ${(
          ptiValue * 100
        ).toFixed(1)} percent so payment pressure is high.`
      );
      score = 2;
    } else if (ptiValue > ptiLimit * 0.9) {
      bullets.push(
        `PTI is near your limit at ${(
          ptiValue * 100
        ).toFixed(1)} percent. Expect tighter first six payments.`
      );
      score = Math.max(score, 1);
    } else {
      bullets.push(
        `PTI is comfortably inside policy at ${(
          ptiValue * 100
        ).toFixed(1)} percent.`
      );
      score = Math.max(score, 0);
    }

    // Repo history
    if (typeof form.repoCount === "number") {
      if (form.repoCount >= 2) {
        bullets.push("Customer has multiple prior repos on file.");
        score = 2;
      } else if (form.repoCount === 1) {
        bullets.push("Customer has one prior repo on file.");
        score = Math.max(score, 1);
      } else {
        bullets.push("No prior repos recorded in your form.");
      }
    }

    // Employment or stability
    if (
      typeof result?.employmentMonths === "number" &&
      result.employmentMonths < 6
    ) {
      bullets.push("Time on job under six months.");
      score = Math.max(score, 1);
    }

    const level: "Low" | "Medium" | "High" =
      score >= 2 ? "High" : score === 1 ? "Medium" : "Low";

    const action =
      level === "High"
        ? "Strongly consider higher down, GPS or a shorter term and monitor the first six payments closely."
        : level === "Medium"
        ? "Consider a slightly stronger down or shorter term and keep a closer eye on the first few payments."
        : "Risk looks typical for a working BHPH profile. Standard follow up on the first six payments is still recommended.";

    return { level, bullets, action };
  })();

  const complianceChipLabel =
    complianceAnalysis.status === "Clean"
      ? "Low compliance risk"
      : "Needs review";

  const complianceChipScore =
    complianceAnalysis.severity === "low"
      ? "Low"
      : complianceAnalysis.severity === "medium"
      ? "Medium"
      : "High";

  const delinquencyChipLabel = `${delinquencyAnalysis.level} risk`;

  // what if helpers
  function bumpTerm(deltaMonths: number) {
    if (!onScenarioRun) return;
    const next = Math.max(6, form.termMonths + deltaMonths);
    onScenarioRun({ termMonths: next });
  }

  function bumpDown(delta: number) {
    if (!onScenarioRun) return;
    const next = Math.max(0, form.downPayment + delta);
    onScenarioRun({ downPayment: next });
  }

  // helper to build sales scripts

  const scriptScenarios = (() => {
    if (!result || typeof result.payment !== "number") {
      return [];
    }

    const payment = result.payment;
    const term = termWeeks || result?.termInWeeks || null;
    const dp =
      typeof result?.downPayment === "number"
        ? result.downPayment
        : typeof result?.cashDown === "number"
        ? result.cashDown
        : null;

    const nicerPayment = payment.toFixed(2);
    const nicerTerm = term ? `${term} weeks` : "this term";
    const nicerDown = dp !== null ? `$${dp.toFixed(0)}` : "your down payment";

    return [
      {
        id: "paymentHigh",
        title: "Customer says the payment feels too high",
        script: `Intro:
I completely understand wanting to keep the weekly comfortable. Right now this structure puts you at about $${nicerPayment} each week over ${nicerTerm}.

Middle:
If we can move a little more money to the front, I can work on lowering that payment for you. For example, if you are able to bump ${nicerDown} just a bit, I can tighten the term and reduce what you pay each week while still keeping you approved on this vehicle.

Close:
Would you rather keep the smaller down payment and live with the higher weekly payment, or put a little more down today so the payment feels lighter every week you drive it`
      },
      {
        id: "downShort",
        title: "Customer is light on down payment",
        script: `Intro:
I hear you on wanting to keep as much cash in your pocket as possible. The bank is looking at your income, history and the price of the car, and with the current numbers this is the structure that gets you approved.

Middle:
If we stay at this lower down payment, they are going to keep the payment where it is to cover the risk. If you can bring a little more today, I can either push the payment down or shorten the term so you pay the car off faster and save interest.

Close:
If we can get a little closer to their target down, I can lock this approval in and make the numbers work the way you want them. How close can you get to that so we can wrap this up`
      },
      {
        id: "longTerm",
        title: "Customer worries the term is too long",
        script: `Intro:
Totally fair question. The way this is set up now, the longer term is what lets us keep the payment around $${nicerPayment} each week so it fits your budget.

Middle:
If you prefer to be done sooner, we can look at a couple of options. One is to put a little more down today so we can shorten the term. The other is to keep this comfortable payment and you always have the option to pay extra with no penalty, which cuts months off the back of the loan.

Close:
Would you rather keep the lower payment and pay extra when you can, or put a little more down today so we officially shorten the term on paper`
      }
    ];
  })();

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
          <div style={summaryChipBox}>
            <div style={summaryChipLabel}>Payment</div>
            <div style={summaryChipValue}>${result.payment.toFixed(2)}</div>
          </div>

          <div style={summaryChipBox}>
            <div style={summaryChipLabel}>Total profit</div>
            <div style={summaryChipValue}>
              ${result.totalProfit.toFixed(2)}
            </div>
          </div>

          <div style={summaryChipBox}>
            <div style={summaryChipLabel}>PTI</div>
            <div style={summaryChipValue}>{ptiDisplay}</div>
          </div>

          <div style={summaryChipBox}>
            <div style={summaryChipLabel}>Verdict</div>
            <div style={summaryChipValue}>
              <span style={verdictChipStyle(verdictText)}>{verdictText}</span>
            </div>
          </div>

          {approvalScore !== null && (
            <div style={summaryChipBox}>
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

            {/* scenario tools */}
      {isPro && (onSaveScenario || onOpenCompare) && (
        <div style={scenarioBar}>
          {onSaveScenario && (
            <button
              type="button"
              style={scenarioBtn}
              disabled={loading}
              onClick={() => {
                if (!loading) {
                  onSaveScenario(result, form);
                }
              }}
            >
              Save this scenario
            </button>
          )}

          {onOpenCompare && (
            <button
              type="button"
              style={scenarioBtn}
              disabled={loading}
              onClick={() => {
                if (!loading) {
                  onOpenCompare();
                }
              }}
            >
              Compare saved scenarios
            </button>
          )}
        </div>
      )}


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

      {/* quick what if lab */}
      {onScenarioRun && (
        <section
          style={{
            ...panel,
            marginTop: 16
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Quick what if lab</h2>
          <p
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: 10
            }}
          >
            Tap a button to try a slightly different term or down payment and
            see the new payment and profit instantly.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8
            }}
          >
            <button
              type="button"
              style={btnSecondary}
              onClick={() => bumpTerm(-3)}
              disabled={loading}
            >
              Shorter term
            </button>
            <button
              type="button"
              style={btnSecondary}
              onClick={() => bumpTerm(0)}
              disabled={loading}
            >
              Same term
            </button>
            <button
              type="button"
              style={btnSecondary}
              onClick={() => bumpTerm(3)}
              disabled={loading}
            >
              Longer term
            </button>

            <button
              type="button"
              style={btnSecondary}
              onClick={() => bumpDown(-500)}
              disabled={loading}
            >
              Lower down
            </button>
            <button
              type="button"
              style={btnSecondary}
              onClick={() => bumpDown(0)}
              disabled={loading}
            >
              Same down
            </button>
            <button
              type="button"
              style={btnSecondary}
              onClick={() => bumpDown(500)}
              disabled={loading}
            >
              Higher down
            </button>
          </div>

          <p
            style={{
              marginTop: 8,
              fontSize: 11,
              color: colors.textSecondary
            }}
          >
            Lab uses your current deal as a base and reruns the analyzer with
            the tweaks you pick.
          </p>
        </section>
      )}

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

      {/* AI Studio */}
      <section
        style={{
          ...panel,
          marginTop: 16
        }}
      >
        <div style={lockedPanelInner}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4
            }}
          >
            <h2 style={{ fontSize: 17 }}>AI Studio</h2>
            {!isPro && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "linear-gradient(to right, #22c55e, #4ade80)",
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

          {isPro ? (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: colors.textSecondary
                }}
              >
                Three AI helpers for this structure. Use the one that fits what
                you are doing right now at the desk.
              </p>

              <div style={aiRow}>
                {/* Underwriter card */}
                <div style={aiCard}>
                  <div style={aiTitle}>AI underwriter</div>
                  <p style={aiHint}>
                    One paragraph manager level take on risk, PTI, LTV and profit.
                  </p>
                  <button
                    type="button"
                    onClick={runUnderwriter}
                    disabled={aiLoading === "/api/ai-underwriter"}
                    style={aiButton}
                  >
                    {aiLoading === "/api/ai-underwriter"
                      ? "Thinking..."
                      : "Run AI underwriter"}
                  </button>
                  {aiUnderwriter && (
                    <div style={aiOutput}>{aiUnderwriter}</div>
                  )}
                </div>

                {/* Closer line card */}
                <div style={aiCard}>
                  <div style={aiTitle}>Closer line</div>
                  <p style={aiHint}>
                    Two short sentences you can read word for word to close this deal.
                  </p>
                  <button
                    type="button"
                    onClick={runCloser}
                    disabled={aiLoading === "/api/ai-closer-line"}
                    style={aiButton}
                  >
                    {aiLoading === "/api/ai-closer-line"
                      ? "Thinking..."
                      : "Generate closer line"}
                  </button>
                  {aiCloser && <div style={aiOutput}>{aiCloser}</div>}
                </div>

                {/* Risk movie card */}
                <div style={aiCard}>
                  <div style={aiTitle}>Risk movie</div>
                  <p style={aiHint}>
                    Twelve month story for the note so you can plan follow up.
                  </p>
                  <button
                    type="button"
                    onClick={runRiskMovie}
                    disabled={aiLoading === "/api/ai-risk-movie"}
                    style={aiButton}
                  >
                    {aiLoading === "/api/ai-risk-movie"
                      ? "Projecting..."
                      : "Generate risk movie"}
                  </button>
                  {aiRiskMovie && <div style={aiOutput}>{aiRiskMovie}</div>}
                </div>
              </div>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginTop: 4
                }}
              >
                Pro turns this deal into three tools: a manager style
                underwriting note, a closer line you can read at the desk, and a
                twelve month risk picture for the note.
              </p>

              <div style={blurOverlay}>
                <div style={blurOverlayTitle}>Unlock AI Studio</div>
                <p style={{ marginBottom: 10 }}>
                  Upgrade to Pro to run AI underwriting, closer lines and risk
                  movies right inside the analyzer, with no copy and paste.
                </p>
                <a href="/billing" style={btnSecondary}>
                  Upgrade to Pro
                </a>
              </div>
            </>
          )}
        </div>
      </section>




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

            {isPro && hasVariants && maxExtraProfit > 0 && (
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
                {hasVariants ? (
                  <>
                    <p
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginBottom: 10
                      }}
                    >
                      Pick a structure below. All options stay inside your PTI
                      and LTV policy rules. Start with the first option for the
                      best balance of profit and risk.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginBottom: 12
                      }}
                    >
                      {profitOptimizer.variants.map(
                        (v: any, idx: number) => {
                          const paymentDelta = formatDelta(
                            basePayment,
                            v.payment,
                            {
                              prefix: "Payment ",
                              suffix: " per week"
                            }
                          );

                          const ptiDelta =
                            typeof v.pti === "number" &&
                            typeof result?.paymentToIncome === "number"
                              ? formatDelta(
                                  result.paymentToIncome,
                                  v.pti,
                                  {
                                    prefix: "PTI ",
                                    suffix: " points"
                                  }
                                )
                              : null;

                          const termDelta =
                            typeof termWeeks === "number" &&
                            typeof v.termWeeks === "number"
                              ? formatDelta(termWeeks, v.termWeeks, {
                                  prefix: "Term ",
                                  suffix: " weeks"
                                })
                              : null;

                          const ltvDelta =
                            typeof result?.ltv === "number" &&
                            typeof v.ltv === "number"
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
                                background:
                                  idx === 0
                                    ? "rgba(34,197,94,0.07)"
                                    : "transparent"
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
                                {typeof v.extraProfit === "number" && (
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
                                )}
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
                                      Adjusts structure to add profit while
                                      staying inside policy.
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
                        }
                      )}
                    </div>
                  </>
                ) : hasAdjustments ? (
                  <>
                    <p
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        marginBottom: 10
                      }}
                    >
                      We found a tighter structure for this deal. Apply the
                      targets below to move profit and PTI in the right
                      direction while staying inside your policy.
                    </p>
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
                      No optimized structures calculated for this deal yet. Try
                      adjusting sale price, down payment or term and run the
                      analysis again.
                    </p>
                  </>
                )}

                {hasAdjustments && (
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
                      {hasVariants
                        ? "Targets for the structure you choose"
                        : "Suggested structure for this deal"}
                    </h3>

                    <ul
                      style={{
                        paddingLeft: 0,
                        listStyle: "none",
                        margin: 0,
                        marginBottom: 10
                      }}
                    >
                      {typeof result.underwriting.adjustments
                        .newDownPayment === "number" && (
                        <li style={summaryRow}>
                          <span style={summaryLabel}>
                            Down payment target
                          </span>
                          <span style={summaryValue}>
                            $
                            {result.underwriting.adjustments.newDownPayment.toFixed(
                              2
                            )}
                          </span>
                        </li>
                      )}
                      {typeof result.underwriting.adjustments
                        .newTermWeeks === "number" && (
                        <li style={summaryRow}>
                          <span style={summaryLabel}>Term target</span>
                          <span style={summaryValue}>
                            {
                              result.underwriting.adjustments
                                .newTermWeeks
                            }{" "}
                            weeks
                          </span>
                        </li>
                      )}
                      {typeof result.underwriting.adjustments
                        .newSalePrice === "number" && (
                        <li style={summaryRow}>
                          <span style={summaryLabel}>
                            Sale price target
                          </span>
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
                            {result.underwriting.adjustments.newApr.toFixed(
                              2
                            )}{" "}
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
                      {hasVariants
                        ? "Apply best structure to form"
                        : "Apply suggested structure to form"}
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
                  Pro tests alternate structures for you and suggests options
                  that add profit without breaking PTI or LTV rules. See how a
                  slightly stronger down payment, longer term or higher price
                  changes payment and risk.
                </p>

                <div style={blurOverlay}>
                  <div style={blurOverlayTitle}>Unlock profit optimizer</div>
                  <p style={{ marginBottom: 10 }}>
                    Pro often finds an extra one hundred to five hundred in
                    profit on deals you already plan to fund, while staying
                    inside your policy.
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
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>
            Customer offer sheet
          </h2>
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
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>
            Underwriting packet
          </h2>
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
              Compliance and early delinquency check
            </h2>

            {/* compliance block */}
            <h3
              style={{
                fontSize: 13,
                marginBottom: 4,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: ".08em"
              }}
            >
              Compliance status
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
                gap: 8
              }}
            >
              <span style={{ fontSize: 12, color: colors.textSecondary }}>
                Policy and common cap checks
              </span>
              <span style={riskChipStyle(complianceChipScore)}>
                {complianceChipLabel}
              </span>
            </div>

            <ul
              style={{
                paddingLeft: 18,
                marginTop: 0,
                marginBottom: 10,
                lineHeight: 1.5,
                fontSize: 14
              }}
            >
              {complianceAnalysis.bullets.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>

            {/* delinquency block */}
            <h3
              style={{
                fontSize: 13,
                marginBottom: 4,
                marginTop: 10,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: ".08em"
              }}
            >
              First six payments risk
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
                gap: 8
              }}
            >
              <span style={{ fontSize: 12, color: colors.textSecondary }}>
                Likely early delinquency on this structure
              </span>
              <span style={riskChipStyle(delinquencyChipLabel)}>
                {delinquencyChipLabel}
              </span>
            </div>

            <ul
              style={{
                paddingLeft: 18,
                marginTop: 0,
                lineHeight: 1.5,
                fontSize: 14
              }}
            >
              {delinquencyAnalysis.bullets.map((d, idx) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>

            <p
              style={{
                fontSize: 13,
                marginTop: 4,
                color: colors.textSecondary
              }}
            >
              Action before funding: {delinquencyAnalysis.action}
            </p>

            {!isPro && (
              <div style={blurOverlay}>
                <div style={blurOverlayTitle}>
                  Detailed compliance and delinquency drivers
                </div>
                <p style={{ marginBottom: 10 }}>
                  Pro breaks this view down by PTI, LTV, term, repos and fees
                  so you know exactly which field to tighten before funding.
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

            {!isPro ? (
              <>
                <p
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8
                  }}
                >
                  Pro compares this deal against your last month of funded deals
                  and shows where PTI, LTV and profit sit against your normal
                  numbers instead of guessing from one structure at a time.
                </p>

                <div style={blurOverlay}>
                  <div style={blurOverlayTitle}>
                    See how this deal stacks up
                  </div>
                  <p style={{ marginBottom: 10 }}>
                    Unlock Pro to see PTI, LTV and profit side by side with your
                    store averages on every deal, so you can tighten the outlier
                    structures before you fund them.
                  </p>
                  <a href="/billing" style={btnSecondary}>
                    Unlock portfolio benchmarking
                  </a>
                </div>
              </>
            ) : hasPortfolioBenchmark ? (
              <>
                <p
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginBottom: 6
                  }}
                >
                  Quick read on how this structure compares to what you usually
                  fund in the store.
                </p>

                <div style={benchGrid}>
                  {/* PTI tile */}
                  <div style={benchTile}>
                    <div style={benchLabel}>Payment to income</div>
                    <div style={benchCurrent}>
                      {dealPtiPct !== null
                        ? `${dealPtiPct.toFixed(1)} percent`
                        : "N A"}
                    </div>
                    {portfolioPtiPct !== null && (
                      <div style={benchBaseline}>
                        Store average {portfolioPtiPct.toFixed(1)} percent
                      </div>
                    )}
                    <div
                      style={
                        portfolioComparison.ptiDelta > 0
                          ? benchTagWarn
                          : benchTagGood
                      }
                    >
                      {portfolioComparison.ptiDelta > 0
                        ? `${portfolioComparison.ptiDelta.toFixed(
                            1
                          )} points hotter than normal`
                        : `${Math.abs(
                            portfolioComparison.ptiDelta
                          ).toFixed(1)} points softer than normal`}
                    </div>
                  </div>

                  {/* LTV tile */}
                  <div style={benchTile}>
                    <div style={benchLabel}>LTV</div>
                    <div style={benchCurrent}>
                      {dealLtvPct !== null
                        ? `${dealLtvPct.toFixed(1)} percent`
                        : "N A"}
                    </div>
                    {portfolioLtvPct !== null && (
                      <div style={benchBaseline}>
                        Store average {portfolioLtvPct.toFixed(1)} percent
                      </div>
                    )}
                    <div
                      style={
                        portfolioComparison.ltvDelta > 0
                          ? benchTagWarn
                          : benchTagGood
                      }
                    >
                      {portfolioComparison.ltvDelta > 0
                        ? `${portfolioComparison.ltvDelta.toFixed(
                            1
                          )} points higher than normal`
                        : `${Math.abs(
                            portfolioComparison.ltvDelta
                          ).toFixed(1)} points lower than normal`}
                    </div>
                  </div>

                  {/* profit tile */}
                  <div style={benchTile}>
                    <div style={benchLabel}>Profit per deal</div>
                    <div style={benchCurrent}>
                      {dealProfit !== null ? `$${dealProfit.toFixed(0)}` : "N A"}
                    </div>
                    {portfolioProfit !== null && (
                      <div style={benchBaseline}>
                        Store average ${portfolioProfit.toFixed(0)}
                      </div>
                    )}
                    <div
                      style={
                        portfolioComparison.profitDelta >= 0
                          ? benchTagGood
                          : benchTagWarn
                      }
                    >
                      {portfolioComparison.profitDelta >= 0
                        ? `About $${portfolioComparison.profitDelta.toFixed(
                            0
                          )} more profit than average`
                        : `About $${Math.abs(
                            portfolioComparison.profitDelta
                          ).toFixed(0)} less profit than average`}
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: colors.textSecondary
                  }}
                >
                  Five second read: tighten deals that are hotter on PTI or LTV
                  than your norm unless profit is carrying the extra risk.
                </p>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 6
                  }}
                >
                  We will start benchmarking once you have at least one month of funded
                  deals with PTI, LTV and profit captured in the system.
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary
                  }}
                >
                  Run and fund a few more deals, then come back to see how new
                  structures stack up against your real portfolio.
                </p>
              </>
            )}
          </div>
        </section>

        {/* sales scripts / save the deal help */}
        <section style={panel}>
          <div style={lockedPanelInner}>
            <h2 style={{ fontSize: 17, marginBottom: 10 }}>
              Save the deal scripts
            </h2>

            {isPro && scriptScenarios.length > 0 ? (
              <>
                <p style={scriptIntro}>
                  Use these ready to read scripts when a customer pushes back on
                  payment, down payment or term. Tap a situation to see what to
                  say.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}
                >
                  {scriptScenarios.map((s, idx) => (
                    <details
                      key={s.id}
                      style={scriptDetails}
                      open={idx === 0}
                    >
                      <summary style={scriptSummaryRow}>
                        <span>{s.title}</span>
                        <span style={scriptTag}>Lot ready</span>
                      </summary>
                      <div style={scriptBody}>{s.script}</div>
                    </details>
                  ))}
                </div>

                <p style={scriptHint}>
                  Tip: drop your favorite lines into your CRM or route book so
                  new salespeople can plug in what already works.
                </p>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: colors.textSecondary
                  }}
                >
                  Pro can turn this structure into simple talk tracks and
                  objection handlers you can read right to the customer. See
                  how to present a stronger down payment, a longer term or the
                  current structure without losing the customer.
                </p>

                <div style={blurOverlay}>
                  <div style={blurOverlayTitle}>
                    Turn structure into a close
                  </div>
                  <p style={{ marginBottom: 10 }}>
                    Unlock Pro to get lot ready scripts for payment, down
                    payment and term objections on every deal you run.
                  </p>
                  <a href="/billing" style={btnSecondary}>
                    Upgrade to Pro
                  </a>
                </div>
              </>
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
