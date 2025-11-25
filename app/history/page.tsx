"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type SavedDeal = {
  id: string;
  createdAt: string;
  userId: string | null;
  input: {
    vehicleCost: number;
    reconCost: number;
    salePrice: number;
    downPayment: number;
    apr: number;
    termWeeks: number;
    paymentFrequency: "weekly" | "biweekly";
    monthlyIncome: number | null;
    monthsOnJob: number | null;
    pastRepo: boolean;
  };
  result: {
    payment: number;
    totalInterest: number;
    totalProfit: number;
    breakEvenWeek: number;
    paymentToIncome: number | null;
    ltv: number;
    riskScore: string;
    underwritingVerdict: string;
    underwritingReasons: string[];
    aiExplanation?: string;
  };
};

export default function HistoryPage() {
  const [deals, setDeals] = useState<SavedDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await supabaseClient.auth.getUser();
        const uid = data.user ? data.user.id : null;
        setUserId(uid);

        if (!uid) {
          setDeals([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/deals?userId=${encodeURIComponent(uid)}`);
        if (!res.ok) {
          const text = await res.text();
          setError(text || `HTTP ${res.status}`);
          return;
        }
        const json = await res.json();
        setDeals(json.deals || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load deals");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "24px",
    background: "#020617",
    color: "#e5e7eb"
  };

  const cardStyle: CSSProperties = {
    maxWidth: "960px",
    margin: "0 auto"
  };

  const panelStyle: CSSProperties = {
    background: "#020617",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "16px"
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  };

  const thStyle: CSSProperties = {
    textAlign: "left",
    padding: "8px",
    borderBottom: "1px solid #1f2937",
    color: "#9ca3af"
  };

  const tdStyle: CSSProperties = {
    padding: "8px",
    borderBottom: "1px solid #111827"
  };

  const linkStyle: CSSProperties = {
    color: "#60a5fa",
    textDecoration: "underline",
    cursor: "pointer"
  };

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
          Deal history
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: "16px" }}>
          Recent analyzed deals with payment, profit, risk, and verdict.
        </p>

        {!userId && !loading && (
          <p
            style={{
              color: "#facc15",
              fontSize: "13px",
              marginBottom: "12px"
            }}
          >
            You are not logged in. Log in to see your own deal history.
          </p>
        )}

        <div style={panelStyle}>
          {loading && <p>Loading...</p>}
          {error && (
            <p style={{ color: "#f87171", marginBottom: "8px" }}>
              Error: {error}
            </p>
          )}

          {!loading && !error && userId && deals.length === 0 && (
            <p style={{ fontSize: "14px" }}>
              No deals saved yet. Run a few analyses on the main page and they
              will show up here.
            </p>
          )}

          {!loading && !error && userId && deals.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Income</th>
                    <th style={thStyle}>Sale</th>
                    <th style={thStyle}>Down</th>
                    <th style={thStyle}>Payment</th>
                    <th style={thStyle}>Profit</th>
                    <th style={thStyle}>PTI</th>
                    <th style={thStyle}>LTV</th>
                    <th style={thStyle}>Verdict</th>
                    <th style={thStyle}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => {
                    const date = new Date(deal.createdAt);
                    const pti =
                      deal.result.paymentToIncome != null
                        ? (deal.result.paymentToIncome * 100).toFixed(1) + "%"
                        : "n/a";
                    const ltvPercent =
                      (deal.result.ltv * 100).toFixed(1) + "%";

                    return (
                      <tr key={deal.id}>
                        <td style={tdStyle}>
                          {date.toLocaleDateString()}{" "}
                          {date.toLocaleTimeString()}
                        </td>
                        <td style={tdStyle}>
                          {deal.input.monthlyIncome
                            ? `$${deal.input.monthlyIncome.toFixed(0)}`
                            : "n/a"}
                        </td>
                        <td style={tdStyle}>
                          ${deal.input.salePrice.toFixed(0)}
                        </td>
                        <td style={tdStyle}>
                          ${deal.input.downPayment.toFixed(0)}
                        </td>
                        <td style={tdStyle}>
                          ${deal.result.payment.toFixed(2)}
                        </td>
                        <td style={tdStyle}>
                          ${deal.result.totalProfit.toFixed(2)}
                        </td>
                        <td style={tdStyle}>{pti}</td>
                        <td style={tdStyle}>{ltvPercent}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                deal.result.underwritingVerdict === "APPROVE"
                                  ? "#22c55e"
                                  : deal.result.underwritingVerdict ===
                                    "COUNTER"
                                  ? "#eab308"
                                  : "#ef4444"
                            }}
                          >
                            {deal.result.underwritingVerdict}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <a href={`/history/${deal.id}`} style={linkStyle}>
                            Details
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
