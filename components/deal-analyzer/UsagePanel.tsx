// components/deal-analyzer/UsagePanel.tsx
import type { CSSProperties } from "react";
import type { PlanType } from "@/hooks/useDealAnalyzer";

type Usage = {
  dealsThisMonth: number;
  freeDealsPerMonth: number;
};

type Props = {
  planType: PlanType | null;
  usage: Usage | null;
  colors: any;
};

export function UsagePanel({ planType, usage, colors }: Props) {
  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)"
  };

  return (
    <section style={panel}>
      <h2 style={{ fontSize: "17px", marginBottom: 8 }}>Monthly usage</h2>

      {planType === "pro" ? (
        usage ? (
          <p style={{ fontSize: "14px", color: colors.textSecondary }}>
            Pro plan unlimited deals. You have run{" "}
            <strong>{usage.dealsThisMonth}</strong> deals this month.
          </p>
        ) : (
          <p style={{ fontSize: "14px", color: colors.textSecondary }}>
            Pro plan unlimited deals. No usage recorded yet this month.
          </p>
        )
      ) : usage ? (
        <p style={{ fontSize: "14px", color: colors.textSecondary }}>
          Used <strong>{usage.dealsThisMonth}</strong> of{" "}
          <strong>{usage.freeDealsPerMonth}</strong> free deals. Pro removes all
          monthly limits.
        </p>
      ) : (
        <p style={{ fontSize: "14px", color: colors.textSecondary }}>
          Free plan includes 25 analyzed deals each month. Pro unlocks unlimited
          deals plus AI underwriting, hidden risk flags and export tools.
        </p>
      )}
    </section>
  );
}
