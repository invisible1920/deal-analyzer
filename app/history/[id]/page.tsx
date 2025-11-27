"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { themeColors } from "@/app/theme";

type SavedDeal = {
  id: string;
  createdAt: string;
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

export default function DealDetailPage() {
  const colors = themeColors.light;

  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [deal, setDeal] = useState<SavedDeal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/deals/${id}`);
        if (!res.ok) {
          const text = await res.text();
          setError(text || `HTTP ${res.status}`);
          return;
        }
        const json = await res.json();
        setDeal(json.deal || null);
      } catch (err: any) {
        setError(err?.message || "Failed to load deal");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "24px",
    background: colors.bg,
    color: colors.text
  };

  const cardStyle: CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto"
  };

  const panelStyle: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "16px",
    marginTop: "16px"
  };

  const twoColStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "8px"
  };

  const labelStyle: CSSProperties = {
    fontSize: "12px",
    color: colors.textSecondary
  };

  const valueStyle: CSSProperties = {
    fontSize: "14px",
    fontWeight: 500
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "8px"
  };

  const tagStyle: CSSProperties = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600
  };

  let verdictColor = "#f97316";
  if (deal?.result.underwritingVerdict === "APPROVE") {
    verdictColor = "#22c55e";
  } else if (deal?.result.underwritingVerdict === "COUNTER") {
    verdictColor = "#eab308";
  } else if (deal?.result.underwritingVerdict === "DECLINE") {
    verdictColor = "#ef4444";
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <button
          type="button"
          onClick={() => router.push("/history")}
          style={{
            marginBottom: "8px",
            fontSize: "13px",
            color: "#2563eb",
            background: "transparent",
            border: "none",
            cursor: "pointer"
          }}
        >
          {"←"} Back to history
        </button>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "4px"
          }}
        >
          Deal sheet
        </h1>
        <p style={{ color: colors.textSecondary, marginBottom: "8px" }}>
          Printable summary for this deal, including payment, profit, risk and underwriting notes.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginBottom: "4px"
          }}
        >
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: `1px solid ${colors.border}`,
              background: colors.panel,
              color: colors.text,
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Print deal sheet
          </button>
        </div>

        <div style={panelStyle}>
          {loading && <p style={{ fontSize: "14px" }}>Loading...</p>}
          {error && (
            <p style={{ color: "#b91c1c", fontSize: "14px" }}>Error: {error}</p>
          )}
          {!loading && !error && !deal && (
            <p style={{ fontSize: "14px" }}>Deal not found.</p>
          )}

          {deal && (
            <>
              {/* Header info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px"
                }}
              >
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 600 }}>
                    BHPH Deal Analyzer
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.textSecondary
                    }}
                  >
                    Deal ID: {deal.id}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.textSecondary
                    }}
                  >
                    Created: {new Date(deal.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      ...tagStyle,
                      backgroundColor: verdictColor,
                      color: "#020617"
                    }}
                  >
                    {deal.result.underwritingVerdict}
                  </span>
                </div>
              </div>

              {/* Deal numbers */}
              <div style={twoColStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Vehicle and structure</h2>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Vehicle cost</div>
                    <div style={valueStyle}>
                      ${deal.input.vehicleCost.toFixed(0)}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Recon cost</div>
                    <div style={valueStyle}>
                      ${deal.input.reconCost.toFixed(0)}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Sale price</div>
                    <div style={valueStyle}>
                      ${deal.input.salePrice.toFixed(0)}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Down payment</div>
                    <div style={valueStyle}>
                      ${deal.input.downPayment.toFixed(0)}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 style={sectionTitleStyle}>Finance summary</h2>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>APR</div>
                    <div style={valueStyle}>
                      {deal.input.apr.toFixed(2)} percent
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Term</div>
                    <div style={valueStyle}>
                      {deal.input.termWeeks} weeks (
                      {deal.input.paymentFrequency})
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Weekly payment</div>
                    <div style={valueStyle}>
                      ${deal.result.payment.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Total interest</div>
                    <div style={valueStyle}>
                      ${deal.result.totalInterest.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Total profit including interest</div>
                    <div style={valueStyle}>
                      ${deal.result.totalProfit.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Break even week</div>
                    <div style={valueStyle}>
                      {deal.result.breakEvenWeek}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk and customer */}
              <div style={twoColStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Customer profile</h2>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Monthly income</div>
                    <div style={valueStyle}>
                      {deal.input.monthlyIncome != null
                        ? `$${deal.input.monthlyIncome.toFixed(0)}`
                        : "n/a"}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Months on job</div>
                    <div style={valueStyle}>
                      {deal.input.monthsOnJob != null
                        ? `${deal.input.monthsOnJob} months`
                        : "n/a"}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Past repo</div>
                    <div style={valueStyle}>
                      {deal.input.pastRepo ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 style={sectionTitleStyle}>Risk metrics</h2>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Payment to income</div>
                    <div style={valueStyle}>
                      {deal.result.paymentToIncome != null
                        ? `${(deal.result.paymentToIncome * 100).toFixed(
                            1
                          )} percent`
                        : "n/a"}
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>LTV</div>
                    <div style={valueStyle}>
                      {(deal.result.ltv * 100).toFixed(1)} percent
                    </div>
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <div style={labelStyle}>Risk score</div>
                    <div style={valueStyle}>{deal.result.riskScore}</div>
                  </div>
                </div>
              </div>

              {/* Underwriting and AI notes */}
              <div style={{ marginTop: "16px" }}>
                <h2 style={sectionTitleStyle}>Underwriting notes</h2>
                <div style={{ marginBottom: "4px" }}>
                  <div style={labelStyle}>Verdict</div>
                  <div style={valueStyle}>
                    {deal.result.underwritingVerdict}
                  </div>
                </div>
                {deal.result.underwritingReasons &&
                  deal.result.underwritingReasons.length > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      <div style={labelStyle}>Reasons</div>
                      <ul
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.6,
                          paddingLeft: 18,
                          marginTop: "4px"
                        }}
                      >
                        {deal.result.underwritingReasons.map(
                          (reason, idx) => (
                            <li key={idx}>{reason}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>

              {deal.result.aiExplanation && (
                <div style={{ marginTop: "16px" }}>
                  <h2 style={sectionTitleStyle}>AI finance manager summary</h2>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {deal.result.aiExplanation}
                  </p>
                </div>
              )}

              {/* Signature area for printed sheet */}
              <div
                style={{
                  marginTop: "24px",
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: "16px",
                  fontSize: "13px"
                }}
              >
                <p
                  style={{
                    marginBottom: "24px",
                    color: colors.textSecondary
                  }}
                >
                  Customer acknowledges the above payment terms and structure:
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "24px"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        height: "24px",
                        marginBottom: "4px"
                      }}
                    />
                    <div style={labelStyle}>Customer signature</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        height: "24px",
                        marginBottom: "4px"
                      }}
                    />
                    <div style={labelStyle}>Date</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
