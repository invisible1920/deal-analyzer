"use client";

import { CSSProperties, useState } from "react";
import type {
  FormState,
  PaymentFrequency
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

type BestStructure = {
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
  bestStructure: BestStructure | null;
  recommendedDownPayment: number | null;
};

export function AffordabilityMode(props: Props) {
  const {
    isPro,
    colors,
    policy,
    userId,
    defaultApr,
    form,
    onApplyStructure
  } = props;

  const isMobile = useIsMobile(768);

  const [monthlyIncome, setMonthlyIncome] = useState(
    form.monthlyIncome.toString()
  );
  const [availableDown, setAvailableDown] = useState(
    form.downPayment.toString()
  );
  const [vehicleCost, setVehicleCost] = useState(
    form.vehicleCost.toString()
  );
  const [reconCost, setReconCost] = useState(
    form.reconCost.toString()
  );
  const [apr, setApr] = useState(defaultApr.toString());
  const [termOptions, setTermOptions] = useState("78, 104");
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>(form.paymentFrequency);
  const [targetWeeklyPayment, setTargetWeeklyPayment] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BestStructure | null>(null);
  const [recommendedDown, setRecommendedDown] =
    useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If user is not Pro, show simple upsell panel
  if (!isPro) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 14,
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 14
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Affordability mode is a Pro feature
        </div>
        <p style={{ margin: 0, color: colors.textSecondary }}>
          Upgrade to Pro to see the maximum sale price and suggested
          structure your customer can qualify for based only on their
          income and down payment.
        </p>
      </div>
    );
  }

  // Use the same panel and input styling as DealForm
  const panel: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    overflowX: "hidden"
  };

  const formGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "minmax(0, 1fr)"
      : "repeat(2, minmax(0, 1fr))",
    gap: 16,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    marginTop: 16
  };

  const field: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6
  };

  const labelStyle: CSSProperties = {
    fontSize: 11,
    marginBottom: 0,
    display: "block",
    fontWeight: 600,
    color: colors.textSecondary,
    letterSpacing: ".08em",
    textTransform: "uppercase"
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: colors.text,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    fontVariantNumeric: "tabular-nums"
  };

  const selectStyle: CSSProperties = {
    ...inputStyle
  };

  const runBtn: CSSProperties = {
    padding: "12px 22px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    fontWeight: 600,
    letterSpacing: ".04em",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.75 : 1,
    fontSize: 13,
    marginTop: 18,
    width: isMobile ? "100%" : "auto",
    boxSizing: "border-box"
  };

  const applyBtn: CSSProperties = {
    ...runBtn,
    background: "linear-gradient(to right, #22c55e, #16a34a, #22c55e)",
    marginTop: 10
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

    // We hide the price range from the user and just sweep around the current deal
    const baseSale =
      form.salePrice && form.salePrice > 0
        ? form.salePrice
        : Math.round(Number(vehicleCost || "0") * 1.25);

    const salePriceMin = baseSale;
    const salePriceMax = Math.round(baseSale * 1.4);
    const salePriceStep = 250;

    try {
      const res = await fetch("/api/affordability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: Number(monthlyIncome),
          availableDown: Number(availableDown),
          vehicleCost: Number(vehicleCost),
          reconCost: Number(reconCost) || 0,
          salePriceMin,
          salePriceMax,
          salePriceStep,
          apr: Number(apr),
          paymentFrequency,
          termWeeksOptions: parsedTerms,
          maxPTIOverride: policy.maxPTI,
          targetWeeklyPayment: targetWeeklyPayment
            ? Number(targetWeeklyPayment)
            : undefined,
          monthsOnJob: form.monthsOnJob,
          repoCount: form.repoCount,
          userId
        })
      });

      const data = (await res.json()) as ApiResponse | { error?: string };

      if (!res.ok) {
        const msg =
          "error" in data && typeof data.error === "string"
            ? data.error
            : `Server error ${res.status}`;
        setError(msg);
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
      paymentFrequency
    });
  }

  return (
    <div style={panel}>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 4
        }}
      >
        Affordability mode
      </div>
      <p
        style={{
          fontSize: 13,
          margin: 0,
          color: colors.textSecondary
        }}
      >
        Start from income and available down. We will search around your
        current sale price and find the highest price that stays in policy
        and passes underwriting.
      </p>

      <div style={formGrid}>
        <div style={field}>
          <label style={labelStyle}>Monthly income</label>
          <input
            style={inputStyle}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div style={field}>
          <label style={labelStyle}>Available down payment</label>
          <input
            style={inputStyle}
            value={availableDown}
            onChange={(e) => setAvailableDown(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div style={field}>
          <label style={labelStyle}>Vehicle cost (your cost)</label>
          <input
            style={inputStyle}
            value={vehicleCost}
            onChange={(e) => setVehicleCost(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div style={field}>
          <label style={labelStyle}>Recon cost</label>
          <input
            style={inputStyle}
            value={reconCost}
            onChange={(e) => setReconCost(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div style={field}>
          <label style={labelStyle}>APR</label>
          <input
            style={inputStyle}
            value={apr}
            onChange={(e) => setApr(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div style={field}>
          <label style={labelStyle}>Term weeks options</label>
          <input
            style={inputStyle}
            value={termOptions}
            onChange={(e) => setTermOptions(e.target.value)}
            placeholder="78, 104"
          />
          <span style={{ fontSize: 11, color: colors.textSecondary }}>
            We will test each term you list.
          </span>
        </div>

        <div style={field}>
          <label style={labelStyle}>Payment frequency</label>
          <select
            style={selectStyle}
            value={paymentFrequency}
            onChange={(e) =>
              setPaymentFrequency(e.target.value as PaymentFrequency)
            }
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div style={field}>
          <label style={labelStyle}>
            Target weekly payment (optional)
          </label>
          <input
            style={inputStyle}
            value={targetWeeklyPayment}
            onChange={(e) => setTargetWeeklyPayment(e.target.value)}
            inputMode="decimal"
          />
          <span style={{ fontSize: 11, color: colors.textSecondary }}>
            If you fill this in we will suggest a down payment that hits
            this payment on the qualified structure.
          </span>
        </div>
      </div>

      <button
        type="button"
        style={runBtn}
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
            color: "#b91c1c"
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: "#ecfdf3",
            border: "1px solid #22c55e",
            color: "#052e16",
            fontSize: 13
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 4
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
                fontSize: 12
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
                fontSize: 12
              }}
            >
              Suggested down payment to hit target payment about{" "}
              {recommendedDown.toFixed(0)}
            </div>
          )}

          <button
            type="button"
            style={applyBtn}
            onClick={handleApplyToAnalyzer}
          >
            Apply this structure to the main deal
          </button>
        </div>
      )}
    </div>
  );
}
