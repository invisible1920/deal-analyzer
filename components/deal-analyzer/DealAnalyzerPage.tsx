"use client";

import { CSSProperties } from "react";
import { themeColors } from "@/app/theme";
import { useDealAnalyzer } from "@/hooks/useDealAnalyzer";
import { DealForm } from "./DealForm";
import { UsagePanel } from "./UsagePanel";
import { ResultsDashboard } from "./ResultsDashboard";

export function DealAnalyzerPage() {
  const colors = themeColors.light;

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

  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
    gap: "20px",
    marginTop: "24px"
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={shell}>
        <h1 style={{ fontSize: 30, fontWeight: 700 }}>BHPH Deal Analyzer</h1>

        <div style={grid}>
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
