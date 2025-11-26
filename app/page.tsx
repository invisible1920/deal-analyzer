"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

// ----------------------------------------
// Types
// ----------------------------------------

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

// ----------------------------------------
// Theme Tokens
// ----------------------------------------

const theme = {
  light: {
    bg: "#f8fafc",
    panel: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#475569",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
  },
  dark: {
    bg: "#0b1120",
    panel: "#111827",
    border: "#334155",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    inputBg: "#1e293b",
    inputBorder: "#475569",
  },
};

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

// ----------------------------------------
// Component
// ----------------------------------------

export default function HomePage() {
  const [mode, setMode] = useState<"light" | "dark">(getSystemTheme());
  const colors = theme[mode];

  useEffect(() => {
    const matcher = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => setMode(matcher.matches ? "light" : "dark");
    matcher.addEventListener("change", handler);
    return () => matcher.removeEventListener("change", handler);
  }, []);

  // ----------------------------------------
  // Form State
  // ----------------------------------------

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
    pastRepo: false,
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    dealsThisMonth: number;
    freeDealsPerMonth: number;
  } | null>(null);

  // ----------------------------------------
  // Load user
  // ----------------------------------------

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabaseClient.auth.getUser();
        setUserId(data.user ? data.user.id : null);
      } catch {
        setUserId(null);
      } finally {
        setAuthLoaded(true);
      }
    }
    loadUser();
  }, []);

  // ----------------------------------------
  // Input handler
  // ----------------------------------------

  function handleChange(
    field: keyof FormState,
    value: string | number | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [field]:
        typeof prev[field] === "number"
          ? Number(value)
          : typeof value === "string"
          ? value
          : value,
    }));
  }

  // ----------------------------------------
  // Submit
  // ----------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const termWeeks = Math.round(form.termMonths * 4.345);

      const payload = {
        ...form,
        termWeeks,
        userId,
      };

      const res = await fetch("/api/analyzeDeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any;
      try {
        const clone = res.clone();
        data = await clone.json();
      } catch {
        data = { error: await res.text() };
      }

      if (!res.ok) {
        setError(data.error || `Server error ${res.status}`);
        return;
      }

      setResult(data);

      if (data.dealsThisMonth && data.freeDealsPerMonth) {
        setUsage({
          dealsThisMonth: data.dealsThisMonth,
          freeDealsPerMonth: data.freeDealsPerMonth,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------
  // Styles
  // ----------------------------------------

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "32px",
    background: colors.bg,
    color: colors.text,
    display: "flex",
    justifyContent: "center",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif',
    transition: "all 0.2s ease",
  };

  const cardStyle: CSSProperties = {
    maxWidth: "1180px",
    width: "100%",
  };

  const layout: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "28px",
    marginTop: "24px",
  };

  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 12px 32px rgba(0,0,0,0.32)",
    transition: "all 0.2s ease",
  };

  const input: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    fontSize: "14px",
  };

  const label: CSSProperties = {
    fontSize: "12px",
    marginBottom: "6px",
    display: "block",
    fontWeight: 600,
    color: colors.textSecondary,
    letterSpacing: ".02em",
  };

  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  };

  const btn: CSSProperties = {
    padding: "12px 22px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    fontSize: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    transition: "all 0.2s ease",
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "30px", fontWeight: 700, marginBottom: 6 }}>
              BHPH Deal Analyzer
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: "15px" }}>
              Calculate payment, profit, PTI, LTV & AI underwriting instantly.
            </p>
          </div>

          <a
            href="/billing"
            style={{
              ...btn,
              padding: "10px 20px",
              fontSize: "13px",
              whiteSpace: "nowrap",
            }}
          >
            Upgrade to Pro
          </a>
        </header>

        {/* Layout */}
        <div style={layout}>
          {/* Left side */}
          <section style={{ flex: "1 1 380px", ...panel }}>
            {authLoaded && !userId && (
              <div
                style={{
                  background: "#fde68a22",
                  border: "1px solid #facc15aa",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#facc15",
                }}
              >
                Not logged in — deals will not be saved.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
              <div style={grid}>
                <div>
                  <label style={label}>Vehicle cost</label>
                  <input
                    type="number"
                    style={input}
                    value={form.vehicleCost}
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                    onChange={(e) => handleChange("apr", e.target.value)}
                  />
                </div>

                <div>
                  <label style={label}>Term (months)</label>
                  <input
                    type="number"
                    style={input}
                    value={form.termMonths}
                    onChange={(e) =>
                      handleChange("termMonths", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label style={label}>Payment frequency</label>
                  <select
                    style={input}
                    value={form.paymentFrequency}
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                    onChange={(e) =>
                      handleChange("monthsOnJob", e.target.value)
                    }
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    id="pastRepo"
                    type="checkbox"
                    checked={form.pastRepo}
                    onChange={(e) =>
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
                  {loading ? "Analyzing…" : "Analyze deal"}
                </button>
              </div>
            </form>
          </section>

          {/* Right side */}
          <section
            style={{
              flex: "1 1 260px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Usage Panel */}
            <div style={panel}>
              <h2 style={{ fontSize: "17px", marginBottom: 8 }}>
                Monthly usage
              </h2>

              {usage ? (
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  Used <strong>{usage.dealsThisMonth}</strong> of{" "}
                  <strong>{usage.freeDealsPerMonth}</strong> free deals.
                </p>
              ) : (
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  Free plan includes 25 analyzed deals per month.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={panel}>
                <h2 style={{ fontSize: "17px", marginBottom: 10 }}>Error</h2>
                <p style={{ color: "#ef4444", fontSize: "14px" }}>{error}</p>
              </div>
            )}

            {/* Summary */}
            {result ? (
              <>
                {/* Deal Summary */}
                <div style={panel}>
                  <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                    Deal summary
                  </h2>

                  <ul
                    style={{
                      paddingLeft: 0,
                      listStyle: "none",
                      lineHeight: 1.7,
                    }}
                  >
                    <li>
                      Payment: <strong>${result.payment.toFixed(2)}</strong>
                    </li>
                    <li>
                      Total interest:{" "}
                      <strong>${result.totalInterest.toFixed(2)}</strong>
                    </li>
                    <li>
                      Total profit:{" "}
                      <strong>${result.totalProfit.toFixed(2)}</strong>
                    </li>
                    <li>
                      Break even (week):{" "}
                      <strong>{result.breakEvenWeek}</strong>
                    </li>
                  </ul>
                </div>

                {/* Risk */}
                <div style={panel}>
                  <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                    Basic risk
                  </h2>
                  <ul
                    style={{
                      paddingLeft: 0,
                      listStyle: "none",
                      lineHeight: 1.7,
                    }}
                  >
                    <li>
                      Payment-to-income:{" "}
                      <strong>
                        {(result.paymentToIncome * 100).toFixed(1)}%
                      </strong>
                    </li>
                    <li>
                      Risk score: <strong>{result.riskScore}</strong>
                    </li>
                  </ul>
                </div>

                {/* Underwriting */}
                {result.underwriting && (
                  <div style={panel}>
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                      Underwriting verdict
                    </h2>
                    <p style={{ fontWeight: 600 }}>
                      {result.underwriting.verdict}
                    </p>

                    {result.underwriting.reasons?.length > 0 && (
                      <ul
                        style={{
                          marginTop: 8,
                          paddingLeft: 18,
                          lineHeight: 1.6,
                        }}
                      >
                        {result.underwriting.reasons.map(
                          (r: string, i: number) => (
                            <li key={i}>{r}</li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                )}

                {/* AI Explanation */}
                {result.aiExplanation && (
                  <div style={panel}>
                    <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                      AI deal opinion
                    </h2>

                    <p
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {result.aiExplanation}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div style={panel}>
                <h2 style={{ fontSize: "17px", marginBottom: 10 }}>
                  Deal summary
                </h2>
                <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                  Run a deal to see payment, profit, PTI, LTV, and underwriting.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
