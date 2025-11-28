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

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "32px 16px",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif'
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto"
  };

  const contentGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.1fr)",
    gap: "20px",
    marginTop: "24px",
    alignItems: "start"
  };

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        {/* header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            alignItems: "center"
          }}
        >
          {/* left header */}
          <div>
            {/* title etc, same as before */}
          </div>

          {planType !== "pro" && (
            <a
              href="/billing"
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
                color: "white",
                fontWeight: 600,
                letterSpacing: ".04em",
                cursor: loading ? "default" : "pointer",
                fontSize: "13px",
                whiteSpace: "nowrap"
              }}
            >
              Upgrade to Pro
            </a>
          )}
        </header>

        {/* top grid: form and usage */}
        <div style={contentGrid}>
          <DealForm
            form={form}
            handleChange={handleChange}
            runAnalysis={runAnalysis}
            loading={loading}
            authLoaded={authLoaded}
            userId={userId}
          />
          <UsagePanel
            planType={planType}
            usage={usage}
            colors={colors}
          />
        </div>

        {/* error and results sections */}
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
