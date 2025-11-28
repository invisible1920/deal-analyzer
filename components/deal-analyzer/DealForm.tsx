// components/deal-analyzer/DealForm.tsx
import type { CSSProperties } from "react";
import type { FormState } from "@/hooks/useDealAnalyzer";

type Props = {
  form: FormState;
  handleChange: (field: keyof FormState, value: string | number) => void;
  runAnalysis: (form: FormState) => Promise<void>;
  loading: boolean;
  authLoaded: boolean;
  userId: string | null;
};

export function DealForm({
  form,
  handleChange,
  runAnalysis,
  loading,
  authLoaded,
  userId
}: Props) {
  const panel: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)"
  };

  const formGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px"
  };

  const input: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runAnalysis(form);
  }

  return (
    <section style={panel}>
      {authLoaded && !userId && (
        <div
          style={{
            background: "#fde68a22",
            border: "1px solid #facc15aa",
            padding: "8px 14px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#92400e"
          }}
        >
          Not logged in, deals will not be saved.
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>
        <div style={formGrid}>
          {/* copy the field blocks from your original form, but call handleChange */}
          <div>
            <label
              htmlFor="vehicleCost"
              style={{
                fontSize: "11px",
                marginBottom: "6px",
                display: "block",
                fontWeight: 600
              }}
            >
              Vehicle cost
            </label>
            <input
              id="vehicleCost"
              type="number"
              style={input}
              value={form.vehicleCost}
              onChange={e => handleChange("vehicleCost", e.target.value)}
            />
          </div>

          {/* repeat for other fields */}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            style={{
              padding: "12px 22px",
              borderRadius: "999px",
              border: "none",
              background:
                "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
              color: "white",
              fontWeight: 600,
              letterSpacing: ".04em",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontSize: "14px"
            }}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze deal"}
          </button>
        </div>
      </form>
    </section>
  );
}
