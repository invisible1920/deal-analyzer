"use client";

import { useState } from "react";

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

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "24px",
    background: "#020617",
    color: "#e5e7eb",
    display: "flex",
    justifyContent: "center"
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: "900px",
    width: "100%",
    background: "#020617",
    borderRadius: "12px"
  };

  const panelStyle: React.CSSProperties = {
    background: "#020617",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "16px"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #374151",
    background: "#020617",
    color: "#e5e7eb"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    marginBottom: "4px",
    display: "block"
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  };

  const summaryGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "16px"
  };

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
          BHPH Deal Analyzer MVP
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: "16px" }}>
          Enter a deal and get payment, profit, and basic risk info.
        </p>

        <form onSubmit={handleSubmit} style={panelStyle}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Vehicle cost</label>
              <input
                type="number"
                style={inputStyle}
                value={form.vehicleCost}
                onChange={(e) => handleChange("vehicleCost", e.target.value)}
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
                onChange={(e) => handleChange("downPayment", e.target.value)}
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
                onChange={(e) => handleChange("termWeeks", e.target.value)}
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

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                id="pastRepo"
                type="checkbox"
                checked={form.pastRepo}
                onChange={(e) => handleChange("pastRepo", e.target.checked)}
              />
              <label htmlFor="pastRepo" style={{ fontSize: "12px" }}>
                Customer has past repo
              </label>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "16px"
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#4f46e5",
                color: "white",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Analyzing..." : "Analyze deal"}
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: "#f87171", marginTop: "12px" }}>Error: {error}</p>
        )}

        {result && (
          <section style={summaryGridStyle}>
            <div style={panelStyle}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "8px"
                }}
              >
                Summary
              </h2>
              <ul style={{ fontSize: "14px", lineHeight: 1.6 }}>
                <li>Weekly payment: ${result.payment.toFixed(2)}</li>
                <li>Total interest: ${result.totalInterest.toFixed(2)}</li>
                <li>
                  Total profit including interest: $
                  {result.totalProfit.toFixed(2)}
                </li>
                <li>Break even week: {result.breakEvenWeek}</li>
              </ul>
            </div>

            <div style={panelStyle}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "8px"
                }}
              >
                Basic risk
              </h2>
              <ul style={{ fontSize: "14px", lineHeight: 1.6 }}>
                <li>
                  Payment to income ratio:{" "}
                  {result.paymentToIncome
                    ? (result.paymentToIncome * 100).toFixed(1) + "%"
                    : "n/a"}
                </li>
                <li>
                  Risk score: <strong>{result.riskScore}</strong>
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
