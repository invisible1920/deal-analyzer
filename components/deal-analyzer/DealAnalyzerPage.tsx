"use client";

import { CSSProperties } from "react";
import { themeColors } from "@/app/theme";
import { useDealAnalyzer } from "@/hooks/useDealAnalyzer";
import { useIsMobile } from "@/hooks/useIsMobile";

import { DealForm } from "@/components/deal-analyzer/DealForm";
import { UsagePanel } from "@/components/deal-analyzer/UsagePanel";
import { ResultsDashboard } from "@/components/deal-analyzer/ResultsDashboard";

export function DealAnalyzerPage() {
  const colors = themeColors.light;
  const isMobile = useIsMobile(768);

  const {
    form,
    handleChange,
    runAnalysis,
    applySuggestedStructure,
    result,
    loading,
    error,
    usage,
    planType,
    isPro,
    policy,
    authLoaded,
    userId
  } = useDealAnalyzer();

  const shell: CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto"
  };

  const header: CSSProperties = {
    display: "flex",
    justifyContent: isMobile ? "flex-start" : "space-between",
    gap: "20px",
    alignItems: isMobile ? "flex-start" : "center",
    marginBottom: 10,
    flexDirection: isMobile ? "column" : "row"
  };

  const titleRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10
  };

  const title: CSSProperties = {
    fontSize: isMobile ? "24px" : "30px",
    fontWeight: 700
  };

  const contentGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "minmax(0, 1fr)" // stacked on mobile
      : "minmax(0, 2fr) minmax(0, 1fr)",
    gap: "20px",
    marginTop: "24px",
    alignItems: "start"
  };

  const proBadge: CSSProperties = {
    padding: "4px 10px",
    borderRadius: 999,
    background: "linear-gradient(to right, #22c55e, #4ade80)",
    color: "#052e16",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap"
  };

  const upgradeBtn: CSSProperties = {
    padding: "10px 20px",
    borderRadius: 999,
    background: "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: "pointer",
    fontSize: 13,
    whiteSpace: isMobile ? "normal" : "nowrap",
    textDecoration: "none",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.3)",
    width: isMobile ? "100%" : "auto",
    textAlign: "center"
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={shell}>
        <header style={header}>
          <div style={titleRow}>
            <h1 style={title}>BHPH Deal Analyzer</h1>
            {authLoaded && isPro && <span style={proBadge}>Pro</span>}
          </div>

          {planType !== "pro" && (
            <a href="/billing" style={upgradeBtn}>
              Upgrade to Pro
            </a>
          )}
        </header>

        {/* ... the rest of your existing JSX ... */}

        <div style={contentGrid}>
          <DealForm
            form={form}
            handleChange={handleChange}
            runAnalysis={runAnalysis}
            loading={loading}
            authLoaded={authLoaded}
            userId={userId}
            colors={colors}
          />

          <UsagePanel planType={planType} usage={usage} colors={colors} />
        </div>

        <ResultsDashboard
          result={result}
          error={error}
          isPro={isPro}
          policy={policy}
          colors={colors}
          loading={loading}
          form={form}
          applySuggestedStructure={applySuggestedStructure}
          planType={planType}
        />
      </div>
    </div>
  );
}
