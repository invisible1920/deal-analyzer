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

  // Form state
  const [form, setForm] = useState<FormState>({
    vehicleCost: 6000,
    reconCost: 1000,
    salePrice: 12900,
    downPayment: 1000,
    apr: 24.99,
    termMonths: 36,
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

  // Default policy before any API call
  const defaultPolicy = {
    maxPTI: 0.25,
    maxLTV: 1.75,
    maxTermWeeks: 104
  };

  const policy = result?.dealerSettings ?? defaultPolicy;
  const isPro = planType === "pro";

  // Load user and plan using backend API so it matches the server logic
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
      } catch (_err) {
        setPlanType("free");
      } finally {
        setAuthLoaded(true);
      }
    }

    loadUserAndPlan();
  }, []);

  // Input handler
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

  // Shared analysis helper used by submit and by Apply suggested structure
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

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runAnalysis(form);
  }

  // Apply suggested counter structure from underwriting adjustments
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

  // Print customer offer sheet (Pro feature)
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

  // Styles
  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif',
    padding: "32px 16px"
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto"
  };

  const contentGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
    gap: "24px",
    marginTop: "24px",
    alignItems: "flex-start"
  };

  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "20px 18px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    transition: "box-shadow 0.18s ease, transform 0.18s ease"
  };

  const input: CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    borderRadius: "8px",
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    fontSize: "14px"
  };

  const label: CSSProperties = {
    fontSize: "11px",
    marginBottom: "6px",
    display: "block",
    fontWeight: 600,
    color: colors.textSecondary,
    letterSpacing: ".06em",
    textTransform: "uppercase"
  };

  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px 18px"
  };

  const btn: CSSProperties = {
    padding: "11px 20px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".08em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    fontSize: "13px",
    boxShadow: "0 8px 22px rgba(15,23,42,0.28)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease"
  };

  const btnSecondary: CSSProperties = {
    ...btn,
    padding: "8px 16px",
    fontSize: "12px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.2)"
  };

  const proBadge: CSSProperties = {
    padding: "3px 10px",
    borderRadius: 999,
    background: "linear-gradient(to right, #22c55e, #4ade80)",
    color: "#052e16",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: ".12em",
    textTransform: "uppercase"
  };

  const smallUpsell: CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary
  };

  const headerText: CSSProperties = {
    fontSize: "30px",
    fontWeight: 700,
    letterSpacing: "-0.03em"
  };

  const headerSub: CSSProperties = {
    color: colors.textSecondary,
    fontSize: "14px",
    marginTop: 4
  };

  const headerMeta: CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary
  };

  // Helper for PTI display to avoid weird output when there is no income
  const ptiDisplay =
    result && typeof result.paymentToIncome === "number"
      ? `${(result.paymentToIncome * 100).toFixed(1)} percent`
      : "N A";

  return (
    <main style={pageStyle}>
      <PageContainer>
        <div style={shellStyle}>
          {/* Header */}
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
                  gap: 8,
                  marginBottom: 4
                }}
              >
                <h1 style={headerText}>BHPH Deal Analyzer</h1>
                {authLoaded && isPro && <span style={proBadge}>Pro</span>}
              </div>

              <p style={headerSub}>
                Payment, profit, PTI, LTV and AI underwriting on one clean
                screen.
              </p>
              <p style={headerMeta}>
                Policy max LTV about {(policy.maxLTV * 100).toFixed(0)} percent,
                max PTI {(policy.maxPTI * 100).toFixed(0)} percent, max term{" "}
                {policy.maxTermWeeks} weeks.
              </p>
            </div>

            {planType !== "pro" && (
              <a
                href="/billing"
                style={{
                  ...btn,
                  padding: "9px 18px",
                  fontSize: "12px",
                  whiteSpace: "nowrap"
                }}
              >
                Upgrade to Pro
              </a>
            )}
          </header>

          {/* Main grid */}
          <div style={contentGrid}>
            {/* Left side form */}
            <section style={{ ...panel }}>
              {authLoaded && !userId && (
                <div
                  style={{
                    background: "#f9731620",
                    border: "1px solid #fed7aa",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    marginBottom: "14px",
                    fontSize: "12px",
                    color: "#ea580c"
                  }}
                >
                  Not logged in. Deals will not be saved to your history.
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
                <div style={grid}>
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
                      onChange={e => handleChange("reconCost", e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={label}>Sale price</label>
                    <input
                      type="number"
                      style={input}
                      value={form.salePrice}
                      onChange={e => handleChange("salePrice", e.target.value)}
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
                      gap: 10,
                      marginTop: 4
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
                      Customer has prior repo
                    </label>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 4
                  }}
                >
                  <button type="submit" style={btn} disabled={loading}>
                    {loading ? "Analyzing…" : "Analyze deal"}
                  </button>
                </div>
              </form>
            </section>

            {/* Right side results */}
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}
            >
              {/* Usage */}
              <div style={panel}>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    marginBottom: 6
                  }}
                >
                  Monthly usage
                </h2>

                {planType === "pro" ? (
                  usage ? (
                    <p style={{ fontSize: "13px", color: colors.textSecondary }}>
                      Pro plan unlimited deals. You have run{" "}
                      <strong>{usage.dealsThisMonth}</strong> deals this month.
                    </p>
                  ) : (
                    <p style={{ fontSize: "13px", color: colors.textSecondary }}>
                      Pro plan unlimited deals. No usage recorded yet this
                      month.
                    </p>
                  )
                ) : usage ? (
                  <p style={{ fontSize: "13px", color: colors.textSecondary }}>
                    Used <strong>{usage.dealsThisMonth}</strong> of{" "}
                    <strong>{usage.freeDealsPerMonth}</strong> free deals.
                  </p>
                ) : (
                  <p style={{ fontSize: "13px", color: colors.textSecondary }}>
                    Free plan includes 25 analyzed deals each month.
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={panel}>
                  <h2
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      marginBottom: 6
                    }}
                  >
                    Error
                  </h2>
                  <p style={{ color: "#ef4444", fontSize: "13px" }}>{error}</p>
                </div>
              )}

              {/* Summary and results */}
              {result ? (
                <>
                  <div style={panel}>
                    <h2
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        marginBottom: 6
                      }}
                    >
                      Deal summary
                    </h2>
                    <ul
                      style={{
                        paddingLeft: 0,
                        listStyle: "none",
                        lineHeight: 1.7,
                        fontSize: "13px"
                      }}
                    >
                      <li>
                        Payment{" "}
                        <strong>${result.payment.toFixed(2)}</strong>
                      </li>
                      <li>
                        Total interest{" "}
                        <strong>${result.totalInterest.toFixed(2)}</strong>
                      </li>
                      <li>
                        Total profit{" "}
                        <strong>${result.totalProfit.toFixed(2)}</strong>
                      </li>
                      <li>
                        Break even week{" "}
                        <strong>{result.breakEvenWeek}</strong>
                      </li>
                    </ul>
                  </div>

                  <div style={panel}>
                    <h2
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        marginBottom: 6
                      }}
                    >
                      Basic risk
                    </h2>
                    <ul
                      style={{
                        paddingLeft: 0,
                        listStyle: "none",
                        lineHeight: 1.7,
                        fontSize: "13px"
                      }}
                    >
                      <li>
                        Payment to income <strong>{ptiDisplay}</strong>
                      </li>
                      <li>
                        Risk score <strong>{result.riskScore}</strong>
                      </li>
                      {isPro && typeof result.ltv === "number" && (
                        <li>
                          LTV{" "}
                          <strong>
                            {(result.ltv * 100).toFixed(1)} percent
                          </strong>
                        </li>
                      )}
                    </ul>
                    {!isPro && (
                      <p style={smallUpsell}>
                        Upgrade to Pro to see live LTV on every deal and catch
                        over advanced cars before funding.
                      </p>
                    )}
                  </div>

                  {result.underwriting && (
                    <div style={panel}>
                      <h2
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          marginBottom: 6
                        }}
                      >
                        Underwriting verdict
                      </h2>
                      <p style={{ fontWeight: 600, fontSize: "13px" }}>
                        {result.underwriting.verdict}
                      </p>

                      {result.underwriting.reasons?.length > 0 && (
                        <ul
                          style={{
                            marginTop: 8,
                            paddingLeft: 18,
                            lineHeight: 1.6,
                            fontSize: "13px"
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
                          Pro users see full policy reasons for PTI, LTV, term,
                          down payment and profit, plus suggested counter
                          terms.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Suggested counter structure for Pro */}
                  {isPro &&
                    result.underwriting &&
                    result.underwriting.adjustments &&
                    (result.underwriting.adjustments.newDownPayment ||
                      result.underwriting.adjustments.newTermWeeks ||
                      result.underwriting.adjustments.newSalePrice ||
                      result.underwriting.adjustments.newApr) && (
                      <div style={panel}>
                        <h2
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            marginBottom: 6
                          }}
                        >
                          Suggested counter structure
                        </h2>
                        <ul
                          style={{
                            paddingLeft: 0,
                            listStyle: "none",
                            lineHeight: 1.7,
                            marginBottom: 10,
                            fontSize: "13px"
                          }}
                        >
                          {typeof result.underwriting.adjustments
                            .newDownPayment === "number" && (
                            <li>
                              Down payment target{" "}
                              <strong>
                                $
                                {result.underwriting.adjustments.newDownPayment.toFixed(
                                  2
                                )}
                              </strong>
                            </li>
                          )}
                          {typeof result.underwriting.adjustments
                            .newTermWeeks === "number" && (
                            <li>
                              Term target{" "}
                              <strong>
                                {result.underwriting.adjustments.newTermWeeks}{" "}
                                weeks
                              </strong>
                            </li>
                          )}
                          {typeof result.underwriting.adjustments
                            .newSalePrice === "number" && (
                            <li>
                              Suggested sale price{" "}
                              <strong>
                                $
                                {result.underwriting.adjustments.newSalePrice.toFixed(
                                  2
                                )}
                              </strong>
                            </li>
                          )}
                          {typeof result.underwriting.adjustments.newApr ===
                            "number" && (
                            <li>
                              Suggested APR{" "}
                              <strong>
                                {result.underwriting.adjustments.newApr.toFixed(
                                  2
                                )}{" "}
                                percent
                              </strong>
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
                      </div>
                    )}

                  {/* Customer offer sheet for Pro users */}
                  {isPro && (
                    <div style={panel}>
                      <h2
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          marginBottom: 6
                        }}
                      >
                        Customer offer sheet
                      </h2>
                      <p
                        style={{
                          fontSize: "13px",
                          color: colors.textSecondary,
                          marginBottom: 10
                        }}
                      >
                        Generate a clean one page offer you can print or save as
                        PDF for the customer with payment, term and structure.
                      </p>
                      <button
                        type="button"
                        style={btnSecondary}
                        onClick={printOfferSheet}
                      >
                        Print customer offer
                      </button>
                    </div>
                  )}

                  {!isPro && (
                    <div style={panel}>
                      <h2
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          marginBottom: 6
                        }}
                      >
                        Customer offer sheet
                      </h2>
                      <p
                        style={{
                          fontSize: "13px",
                          color: colors.textSecondary,
                          marginBottom: 10
                        }}
                      >
                        Pro users can generate a printable one page customer
                        offer sheet with payment, term, down payment and verdict
                        ready to sign.
                      </p>
                      <a href="/billing" style={btn}>
                        Upgrade to unlock offer sheet
                      </a>
                    </div>
                  )}

                  {result.aiExplanation && (
                    <div style={panel}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "15px",
                            fontWeight: 600
                          }}
                        >
                          AI deal opinion
                        </h2>
                        {!isPro && <span style={proBadge}>Pro</span>}
                      </div>

                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {result.aiExplanation}
                      </p>

                      {!isPro && (
                        <div style={{ marginTop: 10 }}>
                          <a href="/billing" style={btnSecondary}>
                            Unlock full AI underwriting
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={panel}>
                  <h2
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      marginBottom: 6
                    }}
                  >
                    Deal summary
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: colors.textSecondary
                    }}
                  >
                    Run a deal to see payment, profit, PTI, LTV and
                    underwriting results.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
