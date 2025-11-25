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

type PageProps = {
  params: {
    id: string;
  };
};

export default function DealDetailPage({ params }: PageProps) {
  const { id } = params;
  const [deal, setDeal] = useState<SavedDeal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await supabaseClient.auth.getUser();
        const uid = data.user ? data.user.id : null;

        if (!uid) {
          setError("You must be logged in to view deal details.");
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
        const deals = (json.deals || []) as SavedDeal[];
        const found = deals.find((d) => d.id === id) || null;
        if (!found) {
          setError("Deal not found.");
        } else {
          setDeal(found);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load deal");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

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
    padding: "16px",
    marginBottom: "16px"
  };

  const sectionTitle: CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "8px"
  };

  const backLink: CSSProperties = {
    color: "#60a5fa",
    textDecoration: "underline",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "12px",
    display: "inline-block"
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <a href="/history" style={backLink}>
            Back to history
          </a>
          <p style={{ color: "#f87171" }}>Error: {error}</p>
        </div>
      </main>
    );
  }

  if (!deal) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <a href="/history" style={backLink}>
            Back to history
          </a>
          <p>No deal found.</p>
        </div>
      </main>
    );
  }

  const date = new Date(deal.createdAt);
  const pti =
    deal.result.paymentToIncome != null
      ? (deal.result.paymentToIncome * 100).toFixed(1) + "%"
      : "n/a";
  const ltvPercent = (deal.result.ltv * 100).toFixed(1) + "%";

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <a href="/history" style={backLink}>
          Back to history
        </a>

        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
          Deal details
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: "16px" }}>
          Created {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </p>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>Inputs</h2>
          <ul style={{ fontSize: "14px", lineHeight: 1.6 }}>
            <li>Vehicle cost: ${deal.input.vehicleCost.toFixed(0)}</li>
            <li>Recon cost: ${deal.input.reconCost.toFixed(0)}</li>
            <li>Sale price: ${deal.input.salePrice.toFixed(0)}</li>
            <li>Down payment: ${deal.input.downPayment.toFixed(0)}</li>
            <li>APR: {deal.input.apr.toFixed(2)} percent</li>
            <li>Term: {deal.input.termWeeks} weeks</li>
            <li>Payment frequency: {deal.input.paymentFrequency}</li>
            <li>
              Monthly income:{" "}
              {deal.input.monthlyIncome != null
                ? `$${deal.input.monthlyIncome.toFixed(0)}`
                : "n/a"}
            </li>
            <li>
              Months on job:{" "}
              {deal.input.monthsOnJob != null
                ? deal.input.monthsOnJob
                : "n/a"}
            </li>
            <li>Past repo: {deal.input.pastRepo ? "yes" : "no"}</li>
          </ul>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>Calculated</h2>
          <ul style={{ fontSize: "14px", lineHeight: 1.6 }}>
            <li>Weekly payment: ${deal.result.payment.toFixed(2)}</li>
            <li>Total interest: ${deal.result.totalInterest.toFixed(2)}</li>
            <li>
              Total profit including interest: $
              {deal.result.totalProfit.toFixed(2)}
            </li>
            <li>Break even week: {deal.result.breakEvenWeek}</li>
            <li>Payment to income ratio: {pti}</li>
            <li>Loan to value: {ltvPercent}</li>
            <li>Risk score: {deal.result.riskScore}</li>
          </ul>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>Underwriting verdict</h2>
          <p
            style={{
              fontSize: "14px",
              marginBottom: "8px",
              fontWeight: 600,
              color:
                deal.result.underwritingVerdict === "APPROVE"
                  ? "#22c55e"
                  : deal.result.underwritingVerdict === "COUNTER"
                  ? "#eab308"
                  : "#ef4444"
            }}
          >
            Verdict: {deal.result.underwritingVerdict}
          </p>
          {deal.result.underwritingReasons.length > 0 && (
            <>
              <p style={{ fontSize: "14px", marginBottom: "4px" }}>Reasons:</p>
              <ul style={{ fontSize: "14px", lineHeight: 1.6, paddingLeft: 18 }}>
                {deal.result.underwritingReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitle}>AI underwriting summary</h2>
          {deal.result.aiExplanation ? (
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}
            >
              {deal.result.aiExplanation}
            </p>
          ) : (
            <p style={{ fontSize: "14px" }}>
              No AI explanation stored for this deal.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
