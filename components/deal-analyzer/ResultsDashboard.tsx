// components/deal-analyzer/ResultsDashboard.tsx
"use client";

import React, { CSSProperties } from "react";
import type { FormState, PlanType } from "@/hooks/useDealAnalyzer";
import { printOfferSheet, printUnderwritingPacket } from "@/lib/dealPrinting";

type Props = {
  result: any;
  error: string | null;
  isPro: boolean;
  policy: { maxPTI: number; maxLTV: number; maxTermWeeks: number };
  colors: any;
  loading: boolean;
  form: FormState;
  applySuggestedStructure: () => Promise<void>;
  planType: PlanType | null;
};

export function ResultsDashboard({
  result,
  error,
  isPro,
  policy,
  colors,
  loading,
  form,
  applySuggestedStructure,
  planType
}: Props) {
  const defaultPolicy = {
    maxPTI: 0.25,
    maxLTV: 1.75,
    maxTermWeeks: 160
  };

  const resolvedPolicy = policy ?? defaultPolicy;

  // shared styles
  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)"
  };

  const resultsGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "24px",
    alignItems: "stretch"
  };

  const summaryRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 14,
    padding: "2px 0"
  };

  const summaryLabel: CSSProperties = {
    color: colors.textSecondary,
    fontWeight: 500
  };

  const summaryValue: CSSProperties = {
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums"
  };

  const summaryBar: CSSProperties = {
    marginTop: "24px",
    padding: "14px 20px",
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    background: "rgba(15, 23, 42, 0.96)",
    color: "#e5e7eb",
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 16,
    zIndex: 10,
    backdropFilter: "blur(14px)"
  };

  const summaryChipLabel: CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    opacity: 0.85
  };

  const summaryChipValue: CSSProperties = {
    fontSize: 16,
    fontWeight: 600
  };

  const summaryChipGroup: CSSProperties = {
    display: "flex",
    gap: 28,
    flexWrap: "wrap"
  };

  const btnSecondary: CSSProperties = {
    padding: "8px 16px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    fontSize: "13px",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.22)",
    textDecoration: "none",
    display: "inline-flex"
