"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

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

export default function HistoryPage() {
  const colors = themeColors.light;

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
    padding: "32px 16px",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto"
  };

  const headerRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px"
  };

  const titleBlockStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  };

  const statPillRowStyle: CSSProperties = {
    display: "flex",
    gap: "8px",
    fontSize: "11px",
    flexWrap: "wrap"
  };

  const statPillStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    borderRadius: "999px",
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    color: colors.textSecondary
  };

  const panelStyle: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)"
  };

  const tableWrapperStyle: CSSProperties = {
    overflowX: "auto",
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    background: colors.panel
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  };

  const thStyle: CSSProperties = {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.textSecondary,
    fontWeight: 500,
    background: colors.panel,
    position: "sticky",
    top: 0,
    zIndex: 1,
    backdropFilter: "blur(8px)"
  };

  const tdStyle: CSSProperties = {
    padding: "9px 12px",
    borderBottom: `1px solid ${colors.border}`,
    fontSize: "13px",
    whiteSpace: "nowrap"
  };

  const rowStyle: CSSProperties = {
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms",
    cursor: "pointer"
  };

  const rowHoverStyle: CSSProperties = {
    background: "rgba(59, 130, 246, 0.06)",
    transform: "translateY(-1px)",
    boxShadow: "0 6px 18px rgba(148, 163, 184, 0.35)"
  };

  const verdictBadgeBase: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "80px",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase"
  };

  const verdictStyles: Record<string, CSSProperties> = {
    APPROVE: {
      ...verdictBadgeBase,
      background: "rgba(22, 163, 74, 0.08)",
      color: "#15803d",
      border: "1px solid rgba(22, 163, 74, 0.5)"
    },
    COUNTER: {
      ...verdictBadgeBase,
      background: "rgba(234, 179, 8, 0.1)",
      color: "#92400e",
      border: "1px solid rgba(245, 158, 11, 0.6)"
    },
    DECLINE: {
      ...verdictBadgeBase,
      background: "rgba(248, 113, 113, 0.12)",
      color: "#b91c1c",
      border: "1px solid rgba(248, 113, 113, 0.7)"
    },
    DEFAULT: {
      ...verdictBadgeBase,
      background: "rgba(148, 163, 184, 0.12)",
      color: colors.textSecondary,
      border: `1px solid ${colors.border}`
    }
  };

  const linkStyle: CSSProperties = {
    color: "#2563eb",
    textDecoration: "none",
    cursor: "pointer",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  };

  const mutedTextStyle: CSSProperties = {
    color: colors.textSecondary,
    fontSize: "13px"
  };

  function formatCurrency(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return "n a";
    return `$${value.toLocaleString("en-US", {
      maximumFractionDigits: 0
    })}`;
  }

  function formatCurrencyCents(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return "n a";
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  const totalDeals = deals.length;

  return (
    <main style={pageStyle}>
      <PageContainer>
        <div style={shellStyle}>
          <div style={headerRowStyle}>
            <div style={titleBlockStyle}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: "2px"
                }}
              >
                Deal history
              </h1>
              <p
                style={{
                  color: colors.textSecondary,
                  fontSize: "13px"
                }}
              >
                Review saved deals with payment, profit, PTI, LTV and underwriting verdict.
              </p>
            </div>

            {userId && (
              <div style={statPillRowStyle}>
                <span style={statPillStyle}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "999px",
                      background: totalDeals > 0 ? "#22c55e" : "#6b7280"
                    }}
                  />
                  <span>Deals this account</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>
                    {totalDeals}
                  </span>
                </span>
              </div>
            )}
          </div>

          {!userId && !loading && (
            <p
              style={{
                color: "#92400e",
                fontSize: "13px",
                marginBottom: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#fef3c7",
                border: "1px solid #facc15"
              }}
            >
              <span
                style={{
                  fontSize: "12px"
                }}
              >
                You are not logged in. Log in to see your own deal history.
              </span>
            </p>
          )}

          <div style={panelStyle}>
            {loading && (
              <p
                style={{
                  ...mutedTextStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px"
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "999px",
                    border: "2px solid rgba(148, 163, 184, 0.5)",
                    borderTopColor: "#2563eb",
                    animation: "spin 700ms linear infinite"
                  }}
                />
                Loading deals
              </p>
            )}

            {error && (
              <p
                style={{
                  color: "#b91c1c",
                  marginBottom: "8px",
                  fontSize: "13px"
                }}
              >
                Error: {error}
              </p>
            )}

            {!loading && !error && userId && deals.length === 0 && (
              <div
                style={{
                  padding: "14px 12px",
                  borderRadius: "12px",
                  border: `1px dashed ${colors.border}`,
                  background: colors.bg
                }}
              >
                <p style={{ ...mutedTextStyle, marginBottom: "2px" }}>
                  No deals saved yet.
                </p>
                <p style={{ ...mutedTextStyle, fontSize: "12px" }}>
                  Run a few analyses from the main page and they will appear here.
                </p>
              </div>
            )}

            {!loading && !error && userId && deals.length > 0 && (
              <div style={tableWrapperStyle}>
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
                    {deals.map(deal => {
                      const date = new Date(deal.createdAt);
                      const ptiDisplay =
                        deal.result.paymentToIncome != null
                          ? `${(deal.result.paymentToIncome * 100).toFixed(1)} percent`
                          : "n a";
                      const ltvPercent =
                        (deal.result.ltv * 100).toFixed(1) + " percent";

                      const verdict = deal.result.underwritingVerdict || "";
                      const verdictStyle =
                        verdictStyles[verdict] ?? verdictStyles.DEFAULT;

                      const combinedRowStyle: CSSProperties = {
                        ...rowStyle
                      };

                      return (
                        <tr
                          key={deal.id}
                          style={combinedRowStyle}
                          onMouseEnter={e => {
                            Object.assign(
                              (e.currentTarget as HTMLTableRowElement).style,
                              rowHoverStyle
                            );
                          }}
                          onMouseLeave={e => {
                            Object.assign(
                              (e.currentTarget as HTMLTableRowElement).style,
                              rowStyle
                            );
                          }}
                        >
                          <td style={tdStyle}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px"
                              }}
                            >
                              <span style={{ fontSize: "13px" }}>
                                {date.toLocaleDateString()}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: colors.textSecondary
                                }}
                              >
                                {date.toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {deal.input.monthlyIncome
                              ? formatCurrency(deal.input.monthlyIncome)
                              : "n a"}
                          </td>
                          <td style={tdStyle}>
                            {formatCurrency(deal.input.salePrice)}
                          </td>
                          <td style={tdStyle}>
                            {formatCurrency(deal.input.downPayment)}
                          </td>
                          <td style={tdStyle}>
                            {formatCurrencyCents(deal.result.payment)}
                          </td>
                          <td style={tdStyle}>
                            {formatCurrencyCents(deal.result.totalProfit)}
                          </td>
                          <td style={tdStyle}>{ptiDisplay}</td>
                          <td style={tdStyle}>{ltvPercent}</td>
                          <td style={tdStyle}>
                            <span style={verdictStyle}>
                              {deal.result.underwritingVerdict}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <a href={`/history/${deal.id}`} style={linkStyle}>
                              <span>Details</span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  opacity: 0.8
                                }}
                              >
                                {"›"}
                              </span>
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
      </PageContainer>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
