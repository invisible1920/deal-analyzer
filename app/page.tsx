"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

type PaymentFrequency = "monthly" | "biweekly" | "weekly";

type FormState = {
  vehicleCost: number;
  reconCost: number;
  salePrice: number;
  downPayment: number;
  apr: number;
  termMonths: number;
  paymentFrequency: PaymentFrequency;
  monthlyIncome: number;
  monthsOnJob: number;
  repoCount: number;
};

type PlanType = "free" | "pro";

export default function HomePage() {
  const colors = themeColors.light;

  const [form, setForm] = useState<FormState>({
    vehicleCost: 6000,
    reconCost: 1000,
    salePrice: 11800,
    downPayment: 1000,
    apr: 24.99,
    termMonths: 23,
    paymentFrequency: "monthly",
    monthlyIncome: 2400,
    monthsOnJob: 6,
    repoCount: 0
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [planType, setPlanType] = useState<PlanType | null>(null);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    dealsThisMonth: number;
    freeDealsPerMonth: number;
  } | null>(null);

  const defaultPolicy = {
    maxPTI: 0.25,
    maxLTV: 1.75,
    maxTermWeeks: 160
  };

  const policy = result?.dealerSettings ?? defaultPolicy;
  const isPro = planType === "pro";

  useEffect(() => {
    async function loadUserAndPlan() {
      try {
        const { data } = await supabaseClient.auth.getUser();
        const uid = data.user ? data.user.id : null;
        setUserId(uid);

        if (!uid) {
          setPlanType(null);
          setUsage(null);
          return;
        }

        const res = await fetch("/api/profile-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid })
        });

        if (res.ok) {
          const json = await res.json();

          if (json.planType === "pro" || json.planType === "free") {
            setPlanType(json.planType);
          } else {
            setPlanType("free");
          }

          if (
            typeof json.dealsThisMonth === "number" &&
            typeof json.freeDealsPerMonth === "number"
          ) {
            setUsage({
              dealsThisMonth: json.dealsThisMonth,
              freeDealsPerMonth: json.freeDealsPerMonth
            });
          }
        } else {
          setPlanType("free");
        }
      } catch {
        setPlanType("free");
      } finally {
        setAuthLoaded(true);
      }
    }

    void loadUserAndPlan();
  }, []);

  function handleChange(
    field: keyof FormState,
    value: string | number | boolean
  ) {
    setForm(prev => ({
      ...prev,
      [field]:
        typeof prev[field] === "number"
          ? Number(value)
          : typeof value === "string"
          ? value
          : value
    }));
  }

  function printUnderwritingPacket() {
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
            ? `<ul>${reasons
                .map((r: string) => `<li>${r}</li>`)
                .join("")}</ul>`
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

  async function runAnalysis(formState: FormState) {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const termWeeks = Math.round(formState.termMonths * 4.345);

      const payload = {
        ...formState,
        termWeeks,
        userId
      };

      const res = await fetch("/api/analyzeDeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data: any;
      let rawText = "";

      try {
        const clone = res.clone();
        data = await clone.json();
      } catch {
        rawText = await res.text();
        data = { error: rawText };
      }

      if (!res.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : rawText || `Server error ${res.status}`
        );
        return;
      }

      setResult(data);

      if (data.planType === "pro" || data.planType === "free") {
        setPlanType(data.planType);
      }

      if (
        typeof data.dealsThisMonth === "number" &&
        typeof data.freeDealsPerMonth === "number"
      ) {
        setUsage({
          dealsThisMonth: data.dealsThisMonth,
          freeDealsPerMonth: data.freeDealsPerMonth
        });
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runAnalysis(form);
  }

  async function applySuggestedStructure() {
    if (!result?.underwriting?.adjustments) return;
    const adj = result.underwriting.adjustments;

    const nextForm: FormState = {
      ...form,
      downPayment:
        typeof adj.newDownPayment === "number" && adj.newDownPayment > 0
          ? adj.newDownPayment
          : form.downPayment,
      salePrice:
        typeof adj.newSalePrice === "number" && adj.newSalePrice > 0
          ? adj.newSalePrice
          : form.salePrice,
      apr:
        typeof adj.newApr === "number" && adj.newApr > 0
          ? adj.newApr
          : form.apr,
      termMonths:
        typeof adj.newTermWeeks === "number" && adj.newTermWeeks > 0
          ? Math.round(adj.newTermWeeks / 4.345)
          : form.termMonths
    };

    setForm(nextForm);
    await runAnalysis(nextForm);
  }

  function printOfferSheet() {
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
          h1 {
            font-size: 22px;
            margin: 0;
          }
          h2 {
            font-size: 16px;
            margin-top: 24px;
            margin-bottom: 8px;
          }
          .sub {
            font-size: 13px;
            color: #64748b;
            margin-top: 2px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 14px;
          }
          .label {
            color: #64748b;
          }
          .value {
            font-weight: 600;
          }
          .divider {
            margin: 18px 0;
            border-top: 1px solid #e2e8f0;
          }
          .verdict {
            font-size: 16px;
            font-weight: 700;
            margin-top: 10px;
          }
          .footer {
            margin-top: 28px;
            font-size: 12px;
            color: #94a3b8;
          }
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
            This sheet is an estimate only and does not represent a final loan contract. Terms are subject to verification of income, residency and underwriting approval.
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

  // styles

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "32px 16px",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif'
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto"
  };

  const contentGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.1fr)",
    gap: "20px",
    marginTop: "24px",
    alignItems: "start"
  };

  const resultsGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "24px",
    alignItems: "stretch"
  };

  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "20px",
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
    padding: "16px",
    backdropFilter: "blur(6px)",
    pointerEvents: "auto"
  };

  const blurOverlayTitle: CSSProperties = {
    fontWeight: 600,
    marginBottom: 6,
    fontSize: 14
  };

  const input: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: colors.text,
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    fontVariantNumeric: "tabular-nums"
  };

  const label: CSSProperties = {
    fontSize: "11px",
    marginBottom: "6px",
    display: "block",
    fontWeight: 600,
    color: colors.textSecondary,
    letterSpacing: ".08em",
    textTransform: "uppercase"
  };

  const fieldHeader: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8
  };

  const formGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px"
  };

  const btn: CSSProperties = {
    padding: "12px 22px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    fontSize: "14px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.3)",
    transition: "transform 0.1s ease, box-shadow 0.1s ease"
  };

  const btnSecondary: CSSProperties = {
    ...btn,
    padding: "8px 16px",
    fontSize: "13px",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.22)"
  };

  const proBadge: CSSProperties = {
    padding: "4px 10px",
    borderRadius: 999,
    background: "linear-gradient(to right, #22c55e, #4ade80)",
    color: "#052e16",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: ".08em",
    textTransform: "uppercase"
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
    marginTop: "24px",
    padding: "14px 20px",
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    background: "rgba(15, 23, 42, 0.96)",
    color: "#e5e7eb",
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
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

  const ptiDisplay =
    result && typeof result.paymentToIncome === "number"
      ? `${(result.paymentToIncome * 100).toFixed(1)} percent`
      : "N A";

  const ptiValue =
    result && typeof result.paymentToIncome === "number"
      ? result.paymentToIncome
      : null;

  const ptiLimit = policy.maxPTI ?? defaultPolicy.maxPTI;

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

  const hasProfitVariants =
    profitOptimizer &&
    Array.isArray(profitOptimizer.variants) &&
    profitOptimizer.variants.length > 0;

  return (
    <main style={pageStyle}>
      <PageContainer>
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

        <div style={shellStyle}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "center"
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6
                }}
              >
                <h1 style={{ fontSize: "30px", fontWeight: 700 }}>
                  BHPH Deal Analyzer
                </h1>
                {authLoaded && isPro && <span style={proBadge}>Pro</span>}
              </div>

              <p style={{ color: colors.textSecondary, fontSize: "15px" }}>
                Calculate payment, profit, PTI, LTV and AI underwriting
                instantly.
              </p>
              <p
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: colors.textSecondary
                }}
              >
                Policy in use max LTV about{" "}
                {(policy.maxLTV * 100).toFixed(0)} percent, max PTI{" "}
                {(policy.maxPTI * 100).toFixed(0)} percent, max term{" "}
                {policy.maxTermWeeks} weeks.
              </p>
            </div>

            {planType !== "pro" && (
              <a
                href="/billing"
                style={{
                  ...btn,
                  padding: "10px 20px",
                  fontSize: "13px",
                  whiteSpace: "nowrap"
                }}
              >
                Upgrade to Pro
              </a>
            )}
          </header>

          {/* top grid: form plus usage */}
          <div style={contentGrid}>
            <section style={panel}>
              {authLoaded && !userId && (
                <div
                  style={{
                    background: "#fde68a22",
                    border: "1px solid #facc15aa",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#92400e"
                  }}
                >
                  Not logged in, deals will not be saved.
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
                <div style={formGrid}>
                  {/* inputs as before ... */}
                  {/* I am leaving the rest identical to your previous version */}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" style={btn} disabled={loading}>
                    {loading ? "Analyzing..." : "Analyze deal"}
                  </button>
                </div>
              </form>
            </section>

            {/* everything below remains the same as the previous version you pasted */}
            {/* ... */}
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
