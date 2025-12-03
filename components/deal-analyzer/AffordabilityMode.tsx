"use client";

import { CSSProperties, useState } from "react";
import type {
  PaymentFrequency,
  FormState,
} from "@/hooks/useDealAnalyzer";
import { useIsMobile } from "@/hooks/useIsMobile";

type Props = {
  isPro: boolean;
  colors: any;
  policy: { maxPTI: number; maxLTV: number; maxTermWeeks: number };
  userId: string | null;
  defaultApr: number;
  form: FormState;
  onApplyStructure: (payload: {
    salePrice: number;
    downPayment: number;
    apr: number;
    termMonths: number;
    paymentFrequency: PaymentFrequency;
  }) => void;
};

type ApiBest = {
  salePrice: number;
  termWeeks: number;
  weeklyPayment: number;
  pti: number;
  ltv: number;
  totalProfit: number;
  underwriting: {
    verdict: string;
    reasons: string[];
  };
};

type ApiResponse = {
  planType: "free" | "pro";
  bestStructure: ApiBest | null;
  recommendedDownPayment: number | null;
};

export function AffordabilityMode(props: Props) {
  const { isPro, colors, policy, userId, defaultApr, form, onApplyStructure } =
    props;

  const isMobile = useIsMobile(768);

  const [monthlyIncome, setMonthlyIncome] = useState(
    form.monthlyIncome.toString(),
  );
  const [availableDown, setAvailableDown] = useState(
    form.downPayment.toString(),
  );
  const [vehicleCost, setVehicleCost] = useState(
    form.vehicleCost.toString(),
  );
  const [reconCost, setReconCost] = useState(
    form.reconCost.toString(),
  );
  const [saleMin, setSaleMin] = useState(form.salePrice.toString());
  const [saleMax, setSaleMax] = useState(
    Math.round(form.salePrice * 1.4).toString(),
  );
  const [saleStep, setSaleStep] = useState("500");
  const [apr, setApr] = useState(defaultApr.toString());
  const [termOptions, setTermOptions] = useState("78, 104");
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>(form.paymentFrequency);
  const [targetWeeklyPayment, setTargetWeeklyPayment] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiBest | null>(null);
  const [recommendedDown, setRecommendedDown] =
    useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isPro) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: "rgba(15,23,42,0.9)",
          color: "#f9fafb",
          fontSize: 14,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Affordability mode is a Pro feature
        </div>
        <p style={{ margin: 0, opacity: 0.85 }}>
          Upgrade to Pro to see the maximum sale price and suggested
          structure your customer can qualify for based only on their
          income and down payment.
        </p>
      </div>
    );
  }

  const shell: CSSProperties = {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(15,23,42,0.96)",
    padding: 16,
    color: "#e5e7eb",
    width: "100%",
    boxSizing: "border-box",
  };

  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 12,
  };

  const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: 4,
  };

  const input: CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.45)",
    background: "#020617",
    color: "#e5e7eb",
    fontSize: 13,
    boxSizing: "border-box" as const,
    outline: "none",
    fontVariantNumeric: "tabular-nums",
  };

  const select: CSSProperties = {
    ...input,
  };

  const runButton: CSSProperties = {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
    fontSize: 13,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.3)",
    width: isMobile ? "100%" : "auto",
    maxWidth: "100%",
    boxSizing: "border-box" as const,
    marginTop: 12,
  };

  const applyButton: CSSProperties = {
    ...runButton,
    background:
      "linear-gradient(to right, #22c55e, #16a34a, #22c55e)",
    marginTop: 10,
  };

  async function handleRun() {
    setError(null);
    setLoading(true);
    setResult(null);
    setRecommendedDown(null);

    const parsedTerms = termOptions
      .split(",")
      .map((t) => Number(t.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);

    try {
      const res = await fetch("/api/affordability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: Number(monthlyIncome),
          availableDown: Number(availableDown),
          vehicleCost: Number(vehicleCost),
          reconCost: Number(reconCost) || 0,
          salePriceMin: Number(saleMin),
          salePriceMax: Number(saleMax),
          salePriceStep: Number(saleStep) || 500,
          apr: Number(apr),
          paymentFrequency,
          termWeeksOptions: parsedTerms,
          maxPTIOverride: policy.maxPTI,
          targetWeeklyPayment: targetWeeklyPayment
            ? Number(targetWeeklyPayment)
            : undefined,
          userId,
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : `Server error ${res.status}`,
        );
        setLoading(false);
        return;
      }

      const api = data as ApiResponse;

      setResult(api.bestStructure);
      setRecommendedDown(api.recommendedDownPayment ?? null);
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function handleApplyToAnalyzer() {
    if (!result) return;

    const termMonths = result.termWeeks / 4.345;

    const down =
      recommendedDown !== null
        ? recommendedDown
        : Number(availableDown);

    onApplyStructure({
      salePrice: result.salePrice,
      downPayment: down,
      apr: Number(apr),
      termMonths,
      paymentFrequency,
    });
  }

  return (
    <div style={shell}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 4,
          color: "#e5e7eb",
        }}
      >
        Affordability mode
      </div>
      <p
        style={{
          fontSize: 12,
          margin: 0,
          color: "rgba(148,163,184,0.9)",
        }}
      >
        Start from the customer, not the car. Enter income and down
        payment and we will find the highest sale price that stays in
        policy and passes underwriting.
      </p>

      <div style={grid}>
        <div>
          <div style={label}>Monthly income</div>
          <input
            style={input}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>Available down payment</div>
          <input
            style={input}
            value={availableDown}
            onChange={(e) => setAvailableDown(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>Vehicle cost (your cost)</div>
          <input
            style={input}
            value={vehicleCost}
            onChange={(e) => setVehicleCost(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>Recon cost</div>
          <input
            style={input}
            value={reconCost}
            onChange={(e) => setReconCost(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>Sale price minimum</div>
          <input
            style={input}
            value={saleMin}
            onChange={(e) => setSaleMin(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>Sale price maximum</div>
          <input
            style={input}
            value={saleMax}
            onChange={(e) => setSaleMax(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>Sale price step</div>
          <input
            style={input}
            value={saleStep}
            onChange={(e) => setSaleStep(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>APR</div>
          <input
            style={input}
            value={apr}
            onChange={(e) => setApr(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={label}>Term weeks options</div>
          <input
            style={input}
            value={termOptions}
            onChange={(e) => setTermOptions(e.target.value)}
            placeholder="78, 104"
          />
        </div>

        <div>
          <div style={label}>Payment frequency</div>
          <select
            style={select}
            value={paymentFrequency}
            onChange={(e) =>
              setPaymentFrequency(e.target.value as PaymentFrequency)
            }
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <div style={label}>Target weekly payment (optional)</div>
          <input
            style={input}
            value={targetWeeklyPayment}
            onChange={(e) => setTargetWeeklyPayment(e.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>

      <button
        type="button"
        style={runButton}
        disabled={loading}
        onClick={handleRun}
      >
        {loading ? "Finding max structure..." : "Run affordability"}
      </button>

      {error && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(34,197,94,0.4)",
            fontSize: 13,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
              color: "#bbf7d0",
            }}
          >
            Qualified structure
          </div>
          <div>Sale price {result.salePrice.toFixed(0)}</div>
          <div>
            Weekly payment {result.weeklyPayment.toFixed(2)} (
            {(result.pti * 100).toFixed(1)} percent PTI)
          </div>
          <div>
            Term {result.termWeeks} weeks, LTV{" "}
            {(result.ltv * 100).toFixed(1)} percent
          </div>
          <div>Total profit {result.totalProfit.toFixed(0)}</div>
          <div style={{ marginTop: 6 }}>
            Underwriting verdict {result.underwriting.verdict}
          </div>
          {result.underwriting.reasons?.length ? (
            <ul
              style={{
                margin: "6px 0 0",
                paddingLeft: 18,
                fontSize: 12,
              }}
            >
              {result.underwriting.reasons.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          ) : null}

          {recommendedDown !== null && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#bfdbfe",
              }}
            >
              Suggested down payment to hit target payment about{" "}
              {recommendedDown.toFixed(0)}
            </div>
          )}

          <button
            type="button"
            style={applyButton}
            onClick={handleApplyToAnalyzer}
          >
            Apply this structure to the main deal
          </button>
        </div>
      )}
    </div>
  );
}
