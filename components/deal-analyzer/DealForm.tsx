"use client";

import { CSSProperties } from "react";
import type { FormState } from "@/hooks/useDealAnalyzer";

export function DealForm({
  form,
  handleChange,
  runAnalysis,
  loading,
  authLoaded,
  userId,
  colors
}: any) {
  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 20
  };

  const formGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16
  };

  const input: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    fontSize: 14
  };

  return (
    <section style={panel}>
      {authLoaded && !userId && (
        <div style={{ color: "#92400e", marginBottom: 16 }}>
          Not logged in — deals will not be saved.
        </div>
      )}

      <form
        onSubmit={e => {
          e.preventDefault();
          runAnalysis(form);
        }}
        style={{ display: "grid", gap: 20 }}
      >
        <div style={formGrid}>
          {/* ------- FIELD EXAMPLE ------- */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Vehicle cost</label>
            <input
              type="number"
              style={input}
              value={form.vehicleCost}
              onChange={e => handleChange("vehicleCost", e.target.value)}
            />
          </div>
          {/* 👉 Repeat for all other fields just like this */}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 22px",
            borderRadius: 999,
            background:
              "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
            color: "#fff",
            fontWeight: 600
          }}
        >
          {loading ? "Analyzing..." : "Analyze deal"}
        </button>
      </form>
    </section>
  );
}
