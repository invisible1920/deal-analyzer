"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

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
    paymentFrequency: "weekly" | "biweekly" | "monthly";
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
    padding: "32px 16px",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto"
  };

  const panelStyle: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "20px",
    marginTop: "16px",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)"
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

  const verdictBase: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderWidth: "1px",
    borderStyle: "solid"
  };

  const verdictMap: Record<string, CSSProperties> = {
    APPROVE: {
      ...verdictBase,
      backgroundColor: "rgba(22, 163, 74, 0.08)",
      color: "#15803d",
      borderColor: "rgba(22, 163, 74, 0.55)"
    },
    COUNTER: {
      ...verdictBase,
      backgroundColor: "rgba(234, 179, 8, 0.12)",
      color: "#92400e",
      borderColor: "rgba(245, 158, 11, 0.65)"
    },
    DECLINE: {
      ...verdictBase,
      backgroundColor: "rgba(248, 113, 113, 0.14)",
      color: "#b91c1c",
      borderColor: "rgba(248, 113, 113, 0.7)"
    },
    DEFAULT: {
      ...verdictBase,
      backgroundColor: "rgba(148, 163, 184, 0.14)",
      color: colors.textSecondary,
      borderColor: colors.border
    }
  };

  const verdictStyle =
    deal && deal.result.underwritingVerdict
      ? verdictMap[deal.result.underwritingVerdict] ?? verdictMap.DEFAULT
      : verdictMap.DEFAULT;

  const headerRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "12px"
  };

  <button
  onClick={() => {
    if (!userId) return;
    window.location.href = `/api/deals/export?userId=${encodeURIComponent(
      userId
    )}`;
  }}
  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
>
  Export CSV
</button>


  const buttonGhost: CSSProperties = {
    padding: "6px 12px",
    borderRadius: "999px",
    border: `1px solid ${colors.border}`,
    background: colors.panel,
    color: colors.text,
    fontSize: "13px",
    cursor: "pointer"
  };

  const backButtonStyle: CSSProperties = {
    marginBottom: "8px",
    fontSize: "13px",
    color: "#2563eb",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  };

  return (
    <main style={pageStyle}>
      <PageContainer>
        <div style={shellStyle}>
          <button
            type="button"
            onClick={() => router.push("/history")}
            style={backButtonStyle}
          >
            <span>{"←"}</span>
            <span>Back to history</span>
          </button>

          <div style={headerRowStyle}>
            <div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  marginBottom: "4px",
                  letterSpacing: "-0.02em"
                }}
              >
                Deal sheet
              </h1>
              <p
                style={{
                  color: colors.textSecondary,
                  marginBottom: "4px",
                  fontSize: "13px"
                }}
              >
                Printable summary for this deal including payment, profit, risk and underwriting notes.
              </p>
            </div>

            <button type="button" onClick={handlePrint} style={buttonGhost}>
              Print deal sheet
            </button>
          </div>

          <div style={panelStyle}>
            {loading && <p style={{ fontSize: "14px" }}>Loading...</p>}
            {error && (
              <p style={{ color: "#b91c1c", fontSize: "14px" }}>
                Error: {error}
              </p>
            )}
            {!loading && !error && !deal && (
              <p style={{ fontSize: "14px" }}>Deal not found.</p>
            )}

            {deal && (
              <>
                {/* Header info */}
                <div style={headerRowStyle}>
                  <div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        marginBottom: "2px"
                      }}
                    >
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
                    <span style={verdictStyle}>
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
                      <div style={labelStyle}>Payment</div>
                      <div style={valueStyle}>
                        ${deal.result.payment.toFixed(2)}{" "}
                        {deal.input.paymentFrequency}
                      </div>
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      <div style={labelStyle}>Total interest</div>
                      <div style={valueStyle}>
                        ${deal.result.totalInterest.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      <div style={labelStyle}>
                        Total profit including interest
                      </div>
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
                          : "n a"}
                      </div>
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      <div style={labelStyle}>Months on job</div>
                      <div style={valueStyle}>
                        {deal.input.monthsOnJob != null
                          ? `${deal.input.monthsOnJob} months`
                          : "n a"}
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
                          : "n a"}
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
                    <h2 style={sectionTitleStyle}>
                      AI finance manager summary
                    </h2>
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

                {/* Signature area */}
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
                    Customer acknowledges the above payment terms and structure
                    below.
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
      </PageContainer>
    </main>
  );
}
