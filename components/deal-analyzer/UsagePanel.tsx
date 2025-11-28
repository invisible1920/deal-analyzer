"use client";

import { CSSProperties } from "react";

export function UsagePanel({ planType, usage, colors }: any) {
  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 20
  };

  return (
    <section style={panel}>
      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Monthly usage</h2>

      {planType === "pro" ? (
        usage ? (
          <p>Pro unlimited. You have run {usage.dealsThisMonth} deals.</p>
        ) : (
          <p>No usage yet.</p>
        )
      ) : usage ? (
        <p>
          Used {usage.dealsThisMonth} of {usage.freeDealsPerMonth} free deals.
        </p>
      ) : (
        <p>Free plan includes 25 deals/month. Pro removes all limits.</p>
      )}
    </section>
  );
}
