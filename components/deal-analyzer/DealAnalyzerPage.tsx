"use client";

import { CSSProperties, useState } from "react";
import { themeColors } from "@/app/theme";
import { useDealAnalyzer } from "@/hooks/useDealAnalyzer";
import { useIsMobile } from "@/hooks/useIsMobile";

import { DealForm } from "@/components/deal-analyzer/DealForm";
import { UsagePanel } from "@/components/deal-analyzer/UsagePanel";
import { ResultsDashboard } from "@/components/deal-analyzer/ResultsDashboard";
import { AffordabilityMode } from "@/components/deal-analyzer/AffordabilityMode";

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

    const [mode, setMode] = useState<"deal" | "affordability">("deal");


  // Outer shell for this page
  const outer: CSSProperties = {
    width: "100%",
    maxWidth: "100vw",
    overflowX: "hidden"
  };

  const shell: CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    overflowX: "hidden",
    boxSizing: "border-box"
  };

  const header: CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    justifyContent: isMobile ? "flex-start" : "space-between",
    gap: isMobile ? 12 : 20,
    marginBottom: 10,
    width: "100%"
  };

  const titleRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10
  };

  const headerRight: CSSProperties = {
    width: isMobile ? "100%" : "auto"
  };

  const title: CSSProperties = {
    fontSize: isMobile ? "24px" : "30px",
    fontWeight: 700
  };

  const contentGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "minmax(0, 1fr)"
      : "minmax(0, 2fr) minmax(0, 1fr)",
    gap: "20px",
    marginTop: "24px",
    alignItems: "start",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box"
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

    const modeToggle: CSSProperties = {
    display: "inline-flex",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.4)",
    padding: 4,
    background: "rgba(15,23,42,0.9)",
    marginTop: 12,
    marginBottom: 12,
  };

  const modeButton = (active: boolean): CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 999,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: active
      ? "rgba(37,99,235,1)"
      : "transparent",
    color: active ? "#f9fafb" : colors.textSecondary,
  });


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
    maxWidth: "100%",
    textAlign: "center",
    display: "block",
    boxSizing: "border-box"
  };

  return (
    <div style={outer}>
      <div style={shell}>
        {/* HEADER */}
        <header style={header}>
          <div style={titleRow}>
            <h1 style={title}>BHPH Deal Analyzer</h1>
            {authLoaded && isPro && <span style={proBadge}>Pro</span>}
          </div>

          {planType !== "pro" && (
            <div style={headerRight}>
              <a href="/billing" style={upgradeBtn}>
                Upgrade to Pro
              </a>
            </div>
          )}
        </header>

        {/* SUBTEXT */}
        <p style={{ color: colors.textSecondary, fontSize: 15 }}>
          Calculate payment, profit, PTI, LTV and AI underwriting instantly.
        </p>
        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            color: colors.textSecondary
          }}
        >
          Policy in use max LTV {(policy.maxLTV * 100).toFixed(0)} percent, max PTI{" "}
          {(policy.maxPTI * 100).toFixed(0)} percent, max term{" "}
          {policy.maxTermWeeks} weeks.
        </p>

                <div style={modeToggle}>
          <button
            type="button"
            style={modeButton(mode === "deal")}
            onClick={() => setMode("deal")}
          >
            Deal analyzer
          </button>
          <button
            type="button"
            style={modeButton(mode === "affordability")}
            onClick={() => setMode("affordability")}
          >
            Affordability mode
          </button>
        </div>


                {/* FORM + USAGE */}
        <div style={contentGrid}>
          {mode === "deal" && (
            <>
              <DealForm
                form={form}
                handleChange={handleChange}
                runAnalysis={runAnalysis}
                loading={loading}
                authLoaded={authLoaded}
                userId={userId}
                colors={colors}
              />

              <UsagePanel
                planType={planType}
                usage={usage}
                colors={colors}
              />
            </>
          )}

          {mode === "affordability" && (
            <>
              <AffordabilityMode
  isPro={isPro}
  colors={colors}
  policy={policy}
  userId={userId}
  defaultApr={form.apr}
  form={form}
  onApplyStructure={(structure) => {
    // push into main form state
    handleChange("salePrice", structure.salePrice);
    handleChange("downPayment", structure.downPayment);
    handleChange("apr", structure.apr);
    handleChange(
      "termMonths",
      Number(structure.termMonths.toFixed(1))
    );
    handleChange("paymentFrequency", structure.paymentFrequency);

    // flip back to normal deal analyzer
    setMode("deal");

    // run analysis on the applied structure
    // small timeout lets React commit the state update first
    setTimeout(() => {
      runAnalysis();
    }, 0);
  }}
/>


              <UsagePanel
                planType={planType}
                usage={usage}
                colors={colors}
              />
            </>
          )}
        </div>


        {/* RESULTS */}
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
