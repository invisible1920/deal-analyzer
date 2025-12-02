import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export type PaymentFrequency = "monthly" | "biweekly" | "weekly";

export type FormState = {
  vehicleCost: number;
  reconCost: number;
  salePrice: number;
  downPayment: number;
  apr: number;
  termMonths: number;
  paymentFrequency: PaymentFrequency;
  monthlyIncome: number;
  monthsOnJob: number;
  repoCount: number;
};

export type PlanType = "free" | "pro";

const defaultForm: FormState = {
  vehicleCost: 6000,
  reconCost: 1000,
  salePrice: 11800,
  downPayment: 1000,
  apr: 24.99,
  termMonths: 23,
  paymentFrequency: "monthly",
  monthlyIncome: 2400,
  monthsOnJob: 6,
  repoCount: 0,
};

const defaultPolicy = {
  maxPTI: 0.25,
  maxLTV: 1.75,
  maxTermWeeks: 160,
};

type Usage = {
  dealsThisMonth: number;
  freeDealsPerMonth: number;
};

export function useDealAnalyzer() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [planType, setPlanType] = useState<PlanType | null>(null);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  const policy = result?.dealerSettings ?? defaultPolicy;
  const isPro = planType === "pro";

  useEffect(() => {
    async function loadUserAndPlan() {
      try {
        const { data } = await supabaseClient.auth.getUser();
        const uid = data.user ? data.user.id : null;
        setUserId(uid);

        if (!uid) {
          setPlanType(null);
          setUsage(null);
          return;
        }

        const res = await fetch("/api/profile-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid }),
        });

        if (res.ok) {
          const json = await res.json();

          if (json.planType === "pro" || json.planType === "free") {
            setPlanType(json.planType);
          } else {
            setPlanType("free");
          }

          if (
            typeof json.dealsThisMonth === "number" &&
            typeof json.freeDealsPerMonth === "number"
          ) {
            setUsage({
              dealsThisMonth: json.dealsThisMonth,
              freeDealsPerMonth: json.freeDealsPerMonth,
            });
          }
        } else {
          setPlanType("free");
        }
      } catch {
        setPlanType("free");
      } finally {
        setAuthLoaded(true);
      }
    }

    void loadUserAndPlan();
  }, []);

  function handleChange(field: keyof FormState, value: string | number) {
    setForm((prev) => ({
      ...prev,
      [field]:
        typeof prev[field] === "number" ? Number(value) : (value as any),
    }));
  }

  async function runAnalysis(formState: FormState) {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const termWeeks = Math.round(formState.termMonths * 4.345);

      const payload = {
        ...formState,
        termWeeks,
        userId,
      };

      const res = await fetch("/api/analyzeDeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any;
      let rawText = "";

      try {
        const clone = res.clone();
        data = await clone.json();
      } catch {
        rawText = await res.text();
        data = { error: rawText };
      }

      if (!res.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : rawText || `Server error ${res.status}`,
        );
        return;
      }

      setResult(data);

      if (data.planType === "pro" || data.planType === "free") {
        setPlanType(data.planType);
      }

      if (
        typeof data.dealsThisMonth === "number" &&
        typeof data.freeDealsPerMonth === "number"
      ) {
        setUsage({
          dealsThisMonth: data.dealsThisMonth,
          freeDealsPerMonth: data.freeDealsPerMonth,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function applySuggestedStructure() {
    if (!result?.underwriting?.adjustments) return;
    const adj = result.underwriting.adjustments;

    const nextForm: FormState = {
      ...form,
      downPayment:
        typeof adj.newDownPayment === "number" && adj.newDownPayment > 0
          ? adj.newDownPayment
          : form.downPayment,
      salePrice:
        typeof adj.newSalePrice === "number" && adj.newSalePrice > 0
          ? adj.newSalePrice
          : form.salePrice,
      apr:
        typeof adj.newApr === "number" && adj.newApr > 0
          ? adj.newApr
          : form.apr,
      termMonths:
        typeof adj.newTermWeeks === "number" && adj.newTermWeeks > 0
          ? Math.round(adj.newTermWeeks / 4.345)
          : form.termMonths,
    };

    setForm(nextForm);
    await runAnalysis(nextForm);
  }

  return {
    form,
    setForm,
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
    userId,
  };
}
