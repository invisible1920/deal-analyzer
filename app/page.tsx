"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

// Types
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
  pastRepo: boolean;
};

type PlanType = "free" | "pro";

export default function HomePage() {
  const colors = themeColors.light;

 const [form, setForm] = useState<FormState>({
  vehicleCost: 6000,
  reconCost: 1000,
  // tuned so the first analyze click is a clean approval
  salePrice: 11800,
  downPayment: 1000,
  apr: 24.99,
  termMonths: 23, // about 100 weeks, under your 104 week cap
  paymentFrequency: "monthly",
  monthlyIncome: 2400,
  monthsOnJob: 6,
  pastRepo: false
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

    loadUserAndPlan();
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

  const input: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    fontSize: "14px"
  };

  const label: CSSProperties = {
    fontSize: "12px",
    marginBottom: "6px",
    display: "block",
    fontWeight: 600,
    color: colors.textSecondary,
    letterSpacing: ".02em",
    textTransform: "uppercase"
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
          <th style={{ textAlign: "left", paddingBottom: 6 }}>Period</th>
          <th style={{ textAlign: "right", paddingBottom: 6 }}>Interest</th>
          <th style={{ textAlign: "right", paddingBottom: 6 }}>Principal</th>
          <th style={{ textAlign: "right", paddingBottom: 6 }}>Balance</th>
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
      Showing first 12 periods only for a quick glance.
    </p>
  </section>
)}

  
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

  return (
    <main style={pageStyle}>
      <PageContainer>
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
                    <label style={label}>Vehicle cost</label>
                    <input
                      type="number"
                      style={input}
                      value={form.vehicleCost}
                      onChange={e =>
                        handleChange("vehicleCost", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={label}>Recon cost</label>
                    <input
                      type="number"
                      style={input}
                      value={form.reconCost}
                      onChange={e =>
                        handleChange("reconCost", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={label}>Sale price</label>
                    <input
                      type="number"
                      style={input}
                      value={form.salePrice}
                      onChange={e =>
                        handleChange("salePrice", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={label}>Down payment</label>
                    <input
                      type="number"
                      style={input}
                      value={form.downPayment}
                      onChange={e =>
                        handleChange("downPayment", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={label}>APR</label>
                    <input
                      type="number"
                      style={input}
                      value={form.apr}
                      onChange={e => handleChange("apr", e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={label}>Term months</label>
                    <input
                      type="number"
                      style={input}
                      value={form.termMonths}
                      onChange={e =>
                        handleChange("termMonths", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={label}>Payment frequency</label>
                    <select
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
                    <label style={label}>Monthly income</label>
                    <input
                      type="number"
                      style={input}
                      value={form.monthlyIncome}
                      onChange={e =>
                        handleChange("monthlyIncome", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={label}>Months on job</label>
                    <input
                      type="number"
                      style={input}
                      value={form.monthsOnJob}
                      onChange={e =>
                        handleChange("monthsOnJob", e.target.value)
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: "22px"
                    }}
                  >
                    <input
                      id="pastRepo"
                      type="checkbox"
                      checked={form.pastRepo}
                      onChange={e =>
                        handleChange("pastRepo", e.target.checked)
                      }
                    />
                    <label htmlFor="pastRepo" style={{ fontSize: "13px" }}>
                      Customer has past repo
                    </label>
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
                  <strong>{usage.freeDealsPerMonth}</strong> free deals.
                </p>
              ) : (
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  Free plan includes 25 analyzed deals each month.
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
                Run a deal to see payment, profit, PTI, LTV and underwriting.
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

              {/* two row three column results grid */}
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
                  </ul>
                  {!isPro && (
                    <p style={smallUpsell}>
                      Upgrade to Pro to save risk history and catch over
                      advanced cars before funding.
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
                        down payment and profit with every deal.
                      </p>
                    )}
                  </section>
                )}

                {/* row two */}
                {isPro &&
                  result.underwriting &&
                  result.underwriting.adjustments &&
                  (result.underwriting.adjustments.newDownPayment ||
                    result.underwriting.adjustments.newTermWeeks ||
                    result.underwriting.adjustments.newSalePrice ||
                    result.underwriting.adjustments.newApr) && (
                    <section style={panel}>
                      <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                        Suggested counter structure
                      </h2>
                      <ul
                        style={{
                          paddingLeft: 0,
                          listStyle: "none",
                          margin: 0,
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
                    </section>
                  )}

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
            </>
          )}
        </div>
      </PageContainer>
    </main>
  );
}
