"use client";

import { CSSProperties } from "react";
import type { SavedScenario } from "./scenarioTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  scenarios: SavedScenario[];
  colors: any;
};

export function ScenarioCompareDrawer(props: Props) {
  const { open, onClose, scenarios, colors } = props;

  if (!open) return null;

  const overlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.6)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 50
  };

  const drawer: CSSProperties = {
    width: "min(960px, 100vw)",
    maxWidth: "100%",
    background: "#020617",
    color: "#e5e7eb",
    padding: 24,
    boxShadow: "0 0 40px rgba(15,23,42,0.8)",
    boxSizing: "border-box",
    overflow: "auto"
  };

  const table: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13
  };

  const th: CSSProperties = {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: colors.textSecondary
  };

  const td: CSSProperties = {
    padding: "8px 10px",
    borderBottom: `1px solid rgba(31,41,55,0.6)`,
    fontVariantNumeric: "tabular-nums"
  };

  function formatCurrency(x: number | undefined | null) {
    if (typeof x !== "number") return "N A";
    return `$${x.toFixed(2)}`;
  }

  function formatPercent(x: number | undefined | null) {
    if (typeof x !== "number") return "N A";
    return `${(x * 100).toFixed(1)} percent`;
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={drawer} onClick={e => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            Scenario comparison
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: colors.textSecondary,
              cursor: "pointer",
              fontSize: 13
            }}
          >
            Close
          </button>
        </div>

        {scenarios.length === 0 ? (
          <p style={{ fontSize: 14, color: colors.textSecondary }}>
            Save at least one scenario from the results view, then open
            comparison again.
          </p>
        ) : (
          <>
            <p
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginBottom: 10
              }}
            >
              Side by side look at payment, PTI, LTV, profit and underwriting
              verdict for the scenarios you saved.
            </p>

            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Metric</th>
                  {scenarios.map(s => (
                    <th key={s.id} style={th}>
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>Payment</td>
                  {scenarios.map(s => (
                    <td key={s.id} style={td}>
                      {formatCurrency(s.result.payment)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={td}>Total profit</td>
                  {scenarios.map(s => (
                    <td key={s.id} style={td}>
                      {formatCurrency(s.result.totalProfit)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={td}>PTI</td>
                  {scenarios.map(s => (
                    <td key={s.id} style={td}>
                      {formatPercent(s.result.paymentToIncome)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={td}>LTV</td>
                  {scenarios.map(s => (
                    <td key={s.id} style={td}>
                      {formatPercent(s.result.ltv)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={td}>Break even week</td>
                  {scenarios.map(s => (
                    <td key={s.id} style={td}>
                      {s.result.breakEvenWeek ?? "N A"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={td}>Verdict</td>
                  {scenarios.map(s => (
                    <td key={s.id} style={td}>
                      {s.result.underwriting?.verdict ??
                        s.result.underwriting?.status ??
                        "Pending"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: colors.textSecondary
              }}
            >
              Tip: keep one scenario as your safer structure and one as your
              stretch profit structure so the desk can pick based on the
              customer.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
