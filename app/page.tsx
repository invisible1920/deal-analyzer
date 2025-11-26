"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type FormState = {
  vehicleCost: number;
  reconCost: number;
  salePrice: number;
  downPayment: number;
  apr: number;
  termWeeks: number;
  paymentFrequency: "weekly" | "biweekly";
  monthlyIncome: number;
  monthsOnJob: number;
  pastRepo: boolean;
};

export default function HomePage() {
  const [form, setForm] = useState<FormState>({
    vehicleCost: 6000,
    reconCost: 1000,
    salePrice: 12900,
    downPayment: 1000,
    apr: 24.99,
    termWeeks: 104,
    paymentFrequency: "weekly",
    monthlyIncome: 2400,
    monthsOnJob: 6,
    pastRepo: false
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

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      if (field === "paymentFrequency") {
        return { ...prev, paymentFrequency: value as "weekly" | "biweekly" };
      }
      if (field === "pastRepo") {
        return { ...prev, pastRepo: value as boolean };
      }
      const num = parseFloat(value as string);
      return { ...prev, [field]: isNaN(num) ? 0 : num };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyzeDeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId })
      });

      let data: any = null;
      let rawText = "";

      try {
        const clone = res.clone();
        data = await clone.json();
      } catch {
        rawText = await res.text();
      }

      if (!res.ok) {
        const message =
          data && typeof data.error === "string"
            ? data.error
            : rawText || `HTTP ${res.status}`;
        setError(message);
        return;
      }

      if (!data) {
        setError("Server returned invalid JSON");
        return;
      }

      setResult(data);

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
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "24px",
    background: "radial-gradient(circle at top, #0f172a, #020617 55%)",
    color: "#e5e7eb",
    display: "flex",
    justifyContent: "center",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
  };

  const cardStyle: CSSProperties = {
    maxWidth: "1120px",
    width: "100%"
  };

  const layoutStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginTop: "16px",
    alignItems: "flex-start"
  };

  const leftColumnStyle: CSSProperties = {
    flex: "1 1 340px",
    maxWidth: "640px"
  };

  const rightColumnStyle: CSSProperties = {
    flex: "1 1 260px",
    minWidth: "260px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  };

  const panelStyle: CSSProperties = {
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid #1f2937",
    borderRadius: "16px",
    padding: "16px",
    boxShadow:
      "0 18px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(15, 23, 42, 0.7)"
  };

  const formPanelStyle: CSSProperties = {
    ...panelStyle,
    boxShadow:
      "0 18px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(30, 64, 175, 0.65)"
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#020617",
    color: "#e5e7eb",
    fontSize: "13px",
    outline: "none"
  };

  const labelStyle: CSSProperties = {
    fontSize: "11px",
    marginBottom: "4px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#9ca3af"
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px"
  };

  const buttonRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px"
  };

  const usagePanelStyle: CSSProperties = {
    ...panelStyle,
    background: "rgba(15, 23, 42, 0.95)"
  };

  const summaryPanelStyle: CSSProperties = {
    ...panelStyle
  };

  const headerTitleStyle: CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: "4px"
  };

  const headerSubTitleStyle: CSSProperties = {
    color: "#9ca3af",
    fontSize: "13px",
    marginBottom: "4px"
  };

  const pillRowStyle: CSSProperties = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "4px",
    marginBottom: "4px"
  };

  const pillStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(55, 65, 81, 0.9)",
    fontSize: "11px",
    color: "#9ca3af"
  };

  const errorTextStyle: CSSProperties = {
    color: "#f87171",
    fontSize: "13px"
  };

  const summaryListStyle: CSSProperties = {
    fontSize: "13px",
    lineHeight: 1.6,
    listStyle: "none",
    paddingLeft: 0,
    margin: 0
  };

  const listItemStyle: CSSProperties = {
    marginBottom: "4px"
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: "15px",
    fontWeight: 600,
    marginBottom: "8px"
  };

  const verdictTextStyle: CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "4px"
  };

  const explanationTextStyle: CSSProperties = {
    fontSize: "13px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap"
  };

  function formatCurrency(value: number | null | undefined, decimals = 0) {
    if (value == null || Number.isNaN(value)) return "n/a";
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  function formatPercentFromFraction(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return "n/a";
    return `${(value * 100).toFixed(1)}%`;
  }

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        <header>
          <h1 style={headerTitleStyle}>BHPH Deal Analyzer</h1>
          <p style={headerSubTitleStyle}>
            Enter a deal and see payment, profit, PTI, LTV, and AI underwriting in seconds.
          </p>

          <div style={pillRowStyle}>
            <span style={pillStyle}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "999px",
                  background: "#22c55e"
                }}
              />
              <span>Backend</span>
              <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Supabase</span>
            </span>
            <span style={pillStyle}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "999px",
                  background: "#38bdf8"
                }}
              />
              <span>AI underwriting</span>
              <span style={{ color: "#e5e7eb", fontWeight: 600 }}>GPT 4.1 mini</span>
            </span>
          </div>
        </header>

        <div style={layoutStyle}>
          {/* Left: form */}
          <section style={leftColumnStyle}>
            {authLoaded && !userId && (
              <p
                style={{
                  color: "#facc15",
                  fontSize: "13px",
                  marginBottom: "10px",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  border: "1px solid rgba(250, 204, 21, 0.45)",
                  background: "rgba(161, 98, 7, 0.12)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>
                  Not logged in. Deals will not be tied to an account. Use the Login link in the top bar to sign in.
                </span>
              </p>
            )}

            <form onSubmit={handleSubmit} style={formPanelStyle}>
              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Vehicle cost</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.vehicleCost}
                    onChange={(e) =>
                      handleChange("vehicleCost", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label style={labelStyle}>Recon cost</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.reconCost}
                    onChange={(e) => handleChange("reconCost", e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Sale price</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.salePrice}
                    onChange={(e) => handleChange("salePrice", e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Down payment</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.downPayment}
                    onChange={(e) =>
                      handleChange("downPayment", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label style={labelStyle}>APR</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.apr}
                    onChange={(e) => handleChange("apr", e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Term in weeks</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.termWeeks}
                    onChange={(e) =>
                      handleChange("termWeeks", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label style={labelStyle}>Payment frequency</label>
                  <select
                    style={inputStyle}
                    value={form.paymentFrequency}
                    onChange={(e) =>
                      handleChange("paymentFrequency", e.target.value)
                    }
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Monthly income</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.monthlyIncome}
                    onChange={(e) =>
                      handleChange("monthlyIncome", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label style={labelStyle}>Months on job</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.monthsOnJob}
                    onChange={(e) =>
                      handleChange("monthsOnJob", e.target.value)
                    }
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "20px"
                  }}
                >
                  <input
                    id="pastRepo"
                    type="checkbox"
                    checked={form.pastRepo}
                    onChange={(e) =>
                      handleChange("pastRepo", e.target.checked)
                    }
                  />
                  <label htmlFor="pastRepo" style={{ fontSize: "12px" }}>
                    Customer has past repo
                  </label>
                </div>
              </div>

              <div style={buttonRowStyle}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
                    color: "white",
                    cursor: loading ? "default" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    boxShadow:
                      "0 10px 30px rgba(37, 99, 235, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.7)"
                  }}
                >
                  {loading ? "Analyzing..." : "Analyze deal"}
                </button>
              </div>
            </form>
          </section>

          {/* Right: usage, summary, AI */}
          <section style={rightColumnStyle}>
            <div style={usagePanelStyle}>
              <h2 style={sectionTitleStyle}>Monthly usage</h2>
              {usage ? (
                <p style={{ fontSize: "13px", marginBottom: "4px" }}>
                  This month you have used{" "}
                  <strong>
                    {usage.dealsThisMonth} / {usage.freeDealsPerMonth}
                  </strong>{" "}
                  free deals.
                </p>
              ) : (
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  Free plan includes 25 analyzed deals per month when you are logged in.
                </p>
              )}
            </div>

            {error && (
              <div style={panelStyle}>
                <h2 style={sectionTitleStyle}>Error</h2>
                <p style={errorTextStyle}>{error}</p>
              </div>
            )}

            {result ? (
              <>
                <div style={summaryPanelStyle}>
                  <h2 style={sectionTitleStyle}>Deal summary</h2>
                  <ul style={summaryListStyle}>
                    <li style={listItemStyle}>
                      Weekly payment:{" "}
                      <strong>
                        {formatCurrency(result.payment, 2)}
                      </strong>
                    </li>
                    <li style={listItemStyle}>
                      Total interest:{" "}
                      <strong>
                        {formatCurrency(result.totalInterest, 2)}
                      </strong>
                    </li>
                    <li style={listItemStyle}>
                      Total profit including interest:{" "}
                      <strong>
                        {formatCurrency(result.totalProfit, 2)}
                      </strong>
                    </li>
                    <li style={listItemStyle}>
                      Break even week:{" "}
                      <strong>{result.breakEvenWeek}</strong>
                    </li>
                  </ul>
                </div>

                <div style={summaryPanelStyle}>
                  <h2 style={sectionTitleStyle}>Basic risk</h2>
                  <ul style={summaryListStyle}>
                    <li style={listItemStyle}>
                      Payment to income ratio:{" "}
                      <strong>
                        {formatPercentFromFraction(result.paymentToIncome)}
                      </strong>
                    </li>
                    <li style={listItemStyle}>
                      Risk score:{" "}
                      <strong>{result.riskScore}</strong>
                    </li>
                  </ul>
                </div>

                {result.underwriting && (
                  <div style={summaryPanelStyle}>
                    <h2 style={sectionTitleStyle}>Underwriting verdict</h2>
                    <p style={verdictTextStyle}>
                      Verdict: {result.underwriting.verdict}
                    </p>
                    {result.underwriting.reasons &&
                      result.underwriting.reasons.length > 0 && (
                        <>
                          <p
                            style={{
                              fontSize: "13px",
                              marginBottom: "4px"
                            }}
                          >
                            Reasons:
                          </p>
                          <ul
                            style={{
                              fontSize: "13px",
                              lineHeight: 1.6,
                              paddingLeft: 18,
                              margin: 0
                            }}
                          >
                            {result.underwriting.reasons.map(
                              (reason: string, idx: number) => (
                                <li key={idx}>{reason}</li>
                              )
                            )}
                          </ul>
                        </>
                      )}
                  </div>
                )}

                {result.aiExplanation && (
                  <div style={summaryPanelStyle}>
                    <h2 style={sectionTitleStyle}>AI deal opinion</h2>
                    <p style={explanationTextStyle}>{result.aiExplanation}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={summaryPanelStyle}>
                <h2 style={sectionTitleStyle}>Deal summary</h2>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  Run a deal to see payment, profit, PTI, LTV, and AI underwriting here.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
