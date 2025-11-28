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
            justifyContent: center;
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
                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="vehicleCost">
                        Vehicle cost
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          What you paid to acquire the vehicle, including auction
                          price and buyer fee. Used to calculate your true cost
                          and profit.
                        </div>
                      </div>
                    </div>
                    <input
                      id="vehicleCost"
                      type="number"
                      style={input}
                      value={form.vehicleCost}
                      onChange={e =>
                        handleChange("vehicleCost", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="reconCost">
                        Recon cost
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          Total reconditioning cost for this unit. Parts, labor
                          and detail that you invest before the sale.
                        </div>
                      </div>
                    </div>
                    <input
                      id="reconCost"
                      type="number"
                      style={input}
                      value={form.reconCost}
                      onChange={e =>
                        handleChange("reconCost", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="salePrice">
                        Sale price
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          Retail selling price of the vehicle before taxes and
                          separate fees. Drives gross profit and LTV.
                        </div>
                      </div>
                    </div>
                    <input
                      id="salePrice"
                      type="number"
                      style={input}
                      value={form.salePrice}
                      onChange={e =>
                        handleChange("salePrice", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="downPayment">
                        Down payment
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          Cash collected from the customer at delivery. This
                          reduces the amount financed and risk.
                        </div>
                      </div>
                    </div>
                    <input
                      id="downPayment"
                      type="number"
                      style={input}
                      value={form.downPayment}
                      onChange={e =>
                        handleChange("downPayment", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="apr">
                        APR
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          Annual percentage rate on the note. Many BHPH stores
                          use between nineteen and twenty nine point nine nine
                          percent.
                        </div>
                      </div>
                    </div>
                    <input
                      id="apr"
                      type="number"
                      style={input}
                      value={form.apr}
                      onChange={e => handleChange("apr", e.target.value)}
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="termMonths">
                        Term months
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          Length of the contract in months. The policy also
                          enforces a maximum term in weeks.
                        </div>
                      </div>
                    </div>
                    <input
                      id="termMonths"
                      type="number"
                      style={input}
                      value={form.termMonths}
                      onChange={e =>
                        handleChange("termMonths", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="paymentFrequency">
                        Payment frequency
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          How often the customer makes payments. Matching their
                          pay cycle usually gives a cleaner PTI.
                        </div>
                      </div>
                    </div>
                    <select
                      id="paymentFrequency"
                      style={input}
                      value={form.paymentFrequency}
                      onChange={e =>
                        handleChange("paymentFrequency", e.target.value)
                      }
                    >
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="monthlyIncome">
                        Monthly income
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          Customer gross monthly income before taxes. Used to
                          compute payment to income percentage.
                        </div>
                      </div>
                    </div>
                    <input
                      id="monthlyIncome"
                      type="number"
                      style={input}
                      value={form.monthlyIncome}
                      onChange={e =>
                        handleChange("monthlyIncome", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="monthsOnJob">
                        Months on job
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          How long the customer has been at their current job in
                          months. Helps with stability and risk scoring.
                        </div>
                      </div>
                    </div>
                    <input
                      id="monthsOnJob"
                      type="number"
                      style={input}
                      value={form.monthsOnJob}
                      onChange={e =>
                        handleChange("monthsOnJob", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <div style={fieldHeader}>
                      <label style={label} htmlFor="repoCount">
                        Number of past repos
                      </label>
                      <div className="tooltip">
                        <span className="infoIcon">?</span>
                        <div className="tooltipBubble">
                          Total number of prior repossessions on the bureau or
                          credit app. Two or more often results in a hard
                          decline.
                        </div>
                      </div>
                    </div>
                    <input
                      id="repoCount"
                      type="number"
                      min={0}
                      style={input}
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

            <section style={panel}>
              <h2 style={{ fontSize: "17px", marginBottom: 8 }}>
                Monthly usage
              </h2>

              {planType === "pro" ? (
                usage ? (
                  <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                    Pro plan unlimited deals. You have run{" "}
                    <strong>{usage.dealsThisMonth}</strong> deals this month.
                  </p>
                ) : (
                  <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                    Pro plan unlimited deals. No usage recorded yet this month.
                  </p>
                )
              ) : usage ? (
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  Used <strong>{usage.dealsThisMonth}</strong> of{" "}
                  <strong>{usage.freeDealsPerMonth}</strong> free deals. Pro
                  removes all monthly limits.
                </p>
              ) : (
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  Free plan includes 25 analyzed deals each month. Pro unlocks
                  unlimited deals plus AI underwriting, hidden risk flags and
                  export tools.
                </p>
              )}
            </section>
          </div>

          {/* error message */}
          {error && (
            <section
              style={{
                ...panel,
                marginTop: 24
              }}
            >
              <h2 style={{ fontSize: "17px", marginBottom: 10 }}>Error</h2>
              <p style={{ color: "#ef4444", fontSize: "14px" }}>{error}</p>
            </section>
          )}

          {/* nothing run yet */}
          {!result && !error && (
            <section
              style={{
                ...panel,
                marginTop: 24
              }}
            >
              <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                Deal summary
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: colors.textSecondary
                }}
              >
                Run a deal to see payment, profit, PTI, LTV and underwriting. Pro
                also unlocks risk flags, profit optimizer and AI explanations.
              </p>
            </section>
          )}

          {/* results */}
          {result && (
            <>
              {/* sticky summary bar */}
              <div style={summaryBar}>
                <div style={summaryChipGroup}>
                  <div>
                    <div style={summaryChipLabel}>Payment</div>
                    <div style={summaryChipValue}>
                      ${result.payment.toFixed(2)}
                    </div>
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
                      <span style={verdictChipStyle(verdictText)}>
                        {verdictText}
                      </span>
                    </div>
                  </div>
                  {approvalScore !== null && (
                    <div>
                      <div style={summaryChipLabel}>Approval score</div>
                      <div style={summaryChipValue}>
                        {approvalScore} percent
                      </div>
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
                {/* row one */}
                <section style={panel}>
                  <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                    Deal summary
                  </h2>
                  <ul
                    style={{
                      paddingLeft: 0,
                      listStyle: "none",
                      margin: 0
                    }}
                  >
                    <li style={summaryRow}>
                      <span style={summaryLabel}>Payment</span>
                      <span style={summaryValue}>
                        ${result.payment.toFixed(2)}
                      </span>
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

                <section style={panel}>
                  <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                    Basic risk
                  </h2>
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
                        <span style={summaryValue}>
                          {approvalScore} percent
                        </span>
                      </li>
                    )}
                  </ul>
                  {!isPro && (
                    <p style={smallUpsell}>
                      Upgrade to Pro to save risk history, see approval
                      likelihood and catch over advanced cars before funding.
                    </p>
                  )}
                </section>

                {result.underwriting && (
                  <section style={panel}>
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                      Underwriting verdict
                    </h2>
                    <p style={{ marginBottom: 10 }}>
                      <span style={verdictChipStyle(verdictText)}>
                        {verdictText}
                      </span>
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
                        {result.underwriting.reasons.map(
                          (r: string, i: number) => (
                            <li key={i}>{r}</li>
                          )
                        )}
                      </ul>
                    )}

                    {!isPro && (
                      <p style={smallUpsell}>
                        Pro users see full policy reasoning for PTI, LTV, term,
                        down payment and profit with every deal, plus AI
                        commentary and delinquency prediction.
                      </p>
                    )}
                  </section>
                )}

                {/* hidden risk flags */}
                {result && (
                  <section style={panel}>
                    <div style={lockedPanelInner}>
                      <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                        Hidden risk flags
                      </h2>
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
                            Pro shows which risk flags triggered and how to fix
                            them before you fund the deal.
                          </p>
                          <a href="/billing" style={btnSecondary}>
                            Unlock hidden risk flags
                          </a>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* payment schedule */}
                {result?.schedulePreview && (
                  <section style={panel}>
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                      Payment schedule preview
                    </h2>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "12px"
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              paddingBottom: 6
                            }}
                          >
                            Period
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              paddingBottom: 6
                            }}
                          >
                            Interest
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              paddingBottom: 6
                            }}
                          >
                            Principal
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              paddingBottom: 6
                            }}
                          >
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
                      Showing first 12 periods only for a quick glance. Pro
                      users can print full schedules inside offer sheets and
                      underwriting packets.
                    </p>
                  </section>
                )}

                {/* profit optimizer / counter structure */}
                <section style={panel}>
                  <div style={lockedPanelInner}>
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                      Profit optimizer
                    </h2>
                    {profitOptimizer && isPro ? (
                      <ul
                        style={{
                          paddingLeft: 18,
                          margin: 0,
                          lineHeight: 1.6,
                          fontSize: 14
                        }}
                      >
                        {profitOptimizer.variants?.map(
                          (v: any, idx: number) => (
                            <li key={idx}>
                              {v.label} adds approximately $
                              {v.extraProfit.toFixed(0)} profit while staying
                              inside policy.
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                          marginBottom: 8
                        }}
                      >
                        Pro finds alternate structures that increase profit
                        without breaking PTI or LTV, such as slightly higher
                        price, longer term or stronger down payment.
                      </p>
                    )}

                    {isPro && result?.underwriting?.adjustments && (
                      <ul
                        style={{
                          paddingLeft: 0,
                          listStyle: "none",
                          margin: 0,
                          marginTop: 10,
                          marginBottom: 12
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
                              {result.underwriting.adjustments.newTermWeeks}{" "}
                              weeks
                            </span>
                          </li>
                        )}
                        {typeof result.underwriting.adjustments
                          .newSalePrice === "number" && (
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
                              {result.underwriting.adjustments.newApr.toFixed(
                                2
                              )}{" "}
                              percent
                            </span>
                          </li>
                        )}
                      </ul>
                    )}

                    {isPro && result?.underwriting?.adjustments && (
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
                    )}

                    {!isPro && (
                      <div style={blurOverlay}>
                        <div style={blurOverlayTitle}>
                          Unlock profit optimizer
                        </div>
                        <p style={{ marginBottom: 10 }}>
                          Pro suggests alternate structures that often add
                          hundreds in profit while staying inside your policy.
                        </p>
                        <a href="/billing" style={btnSecondary}>
                          See profit optimized options
                        </a>
                      </div>
                    )}
                  </div>
                </section>

                {/* customer offer sheet */}
                <section style={panel}>
                  <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                    Customer offer sheet
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: colors.textSecondary,
                      marginBottom: 12
                    }}
                  >
                    Generate a one page customer offer with payment, term and
                    structure that you can print or save as PDF.
                  </p>

                  {isPro ? (
                    <button
                      type="button"
                      style={btnSecondary}
                      onClick={printOfferSheet}
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
                  <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                    Underwriting packet
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: colors.textSecondary,
                      marginBottom: 12
                    }}
                  >
                    Print a full underwriting summary with verdict, reasons,
                    PTI, LTV and AI commentary plus risk and compliance flags.
                  </p>
                  {isPro ? (
                    <button
                      type="button"
                      style={btnSecondary}
                      onClick={printUnderwritingPacket}
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
                  <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                    Policy snapshot
                  </h2>
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
                      <span style={summaryValue}>
                        {policy.maxTermWeeks} weeks
                      </span>
                    </li>
                  </ul>
                </section>

                {/* compliance and delinquency */}
                <section style={panel}>
                  <div style={lockedPanelInner}>
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
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
                          Pro highlights state specific limits and gives an AI
                          view of early payment risk so you know which deals
                          need tighter structure.
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
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
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
                          {portfolioComparison.ptiDelta > 0 ? "above" : "below"}{" "}
                          your store average.
                        </li>
                        <li>
                          LTV is {portfolioComparison.ltvDelta.toFixed(1)}{" "}
                          points compared to your recent portfolio.
                        </li>
                        <li>
                          Profit per deal is tracking{" "}
                          {portfolioComparison.profitDelta.toFixed(0)} dollars{" "}
                          from your target goal.
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
                        Pro compares this structure against your last month of
                        funded deals so you can see if PTI, LTV and profit are
                        trending high, low or right on target.
                      </p>
                    )}

                    {!isPro && (
                      <div style={blurOverlay}>
                        <div style={blurOverlayTitle}>
                          See how this deal compares
                        </div>
                        <p style={{ marginBottom: 10 }}>
                          Upgrade to Pro to benchmark every new deal against
                          your store history and monthly portfolio report.
                        </p>
                        <a href="/billing" style={btnSecondary}>
                          Unlock portfolio reporting
                        </a>
                      </div>
                    )}
                  </div>
                </section>

                {/* sales scripts and save the deal help */}
                <section style={panel}>
                  <div style={lockedPanelInner}>
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                      Save the deal scripts
                    </h2>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: colors.textSecondary
                      }}
                    >
                      Pro can generate quick talking points and scripts based on
                      this structure, such as how to present a higher down
                      payment or longer term without losing the customer.
                    </p>

                    {!isPro && (
                      <div style={blurOverlay}>
                        <div style={blurOverlayTitle}>
                          Turn structure into a close
                        </div>
                        <p style={{ marginBottom: 10 }}>
                          Unlock Pro to get simple scripts you can use on the
                          lot when a customer pushes back on payment or down
                          payment.
                        </p>
                        <a href="/billing" style={btnSecondary}>
                          Upgrade to Pro
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              </div>

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
                    <h2 style={{ fontSize: "17px" }}>AI deal opinion</h2>
                    {!isPro && <span style={proBadge}>Pro</span>}
                  </div>

                  <p
                    style={{
                      fontSize: "14px",
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

              {!isPro && (
                <section
                  style={{
                    ...panel,
                    marginTop: 24
                  }}
                >
                  <h2 style={{ fontSize: "17px", marginBottom: 8 }}>
                    Monthly portfolio report (Pro)
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginBottom: 10
                    }}
                  >
                    Pro users receive a monthly portfolio snapshot with PTI and
                    LTV trends, average profit per deal and a list of risky
                    structures that should be tightened before the next month.
                  </p>
                  <a href="/billing" style={btnSecondary}>
                    Upgrade to get your portfolio report
                  </a>
                </section>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </main>
  );
}
