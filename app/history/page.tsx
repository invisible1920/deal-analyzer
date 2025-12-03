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
    marginBottom: "16px",
    flexWrap: "wrap"
  };

  const titleBlockStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  };

  const headerRightStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end"
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

  const exportButtonStyle: CSSProperties = {
    borderRadius: "999px",
    border: "none",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: deals.length > 0 ? "pointer" : "default",
    background: deals.length > 0 ? "#020617" : "#111827",
    color: "#f9fafb",
    boxShadow: deals.length > 0
      ? "0 4px 12px rgba(15, 23, 42, 0.45)"
      : "none",
    opacity: deals.length > 0 ? 1 : 0.5,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap"
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
    transition: "background 120ms ease, transform 120ms ease, boxShadow 120ms",
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

  function handleExport() {
    if (!userId || deals.length === 0) return;
    window.location.href = `/api/deals/export?userId=${encodeURIComponent(
      userId
    )}`;
  }

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

            <div style={headerRightStyle}>
