// app/deals/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { DealCard } from "@/components/DealCard";

type Deal = {
  id: string;
  created_at: string;
  user_id: string | null;
  input: {
    vehicleCost: number;
    reconCost: number;
    salePrice: number;
    downPayment: number;
    apr: number;
    termWeeks: number;
    paymentFrequency: "weekly" | "biweekly" | "monthly";
    monthlyIncome: number | null;
    monthsOnJob: number | null;
    pastRepo: boolean;
  };
  result: {
    payment: number;
    totalInterest: number;
    totalProfit: number;
    breakEvenWeek: number;
    paymentToIncome: number | null;
    ltv: number;
    riskScore: string;
    underwritingVerdict: string;
    underwritingReasons: string[];
    aiExplanation?: string;
  };
};

export default async function DealDetailPage(props: {
  params: { id: string };
}) {
  const id = props.params.id;

  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const deal = data as Deal;

  const ptiPercent =
    deal.result.paymentToIncome !== null
      ? (deal.result.paymentToIncome * 100).toFixed(1)
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-6">
        <Link
          href="/history"
          className="mb-4 inline-flex items-center text-xs font-medium text-sky-600 hover:text-sky-700"
        >
          <span aria-hidden>‹</span>
          <span className="ml-1">Back to history</span>
        </Link>

        <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Deal details
            </h1>
            <p className="text-xs text-slate-500">
              Saved underwriting decision and calculation breakdown.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Created{" "}
            {new Date(deal.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </header>

        {/* Summary card */}
        <section className="mb-6">
          <DealCard
            id={deal.id}
            createdAt={deal.created_at}
            income={deal.input.monthlyIncome ?? 0}
            salePrice={deal.input.salePrice}
            downPayment={deal.input.downPayment}
            payment={deal.result.payment}
            profit={deal.result.totalProfit}
            pti={deal.result.paymentToIncome}
            ltv={deal.result.ltv}
            verdict={deal.result.underwritingVerdict}
          />
        </section>

        {/* Two column detail layout */}
        <section className="grid gap-4 md:grid-cols-2">
          {/* Inputs */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Deal inputs
            </h2>
            <dl className="space-y-2 text-xs text-slate-600">
              <Row
                label="Vehicle cost"
                value={deal.input.vehicleCost}
                type="currency"
              />
              <Row
                label="Recon cost"
                value={deal.input.reconCost}
                type="currency"
              />
              <Row
                label="Sale price"
                value={deal.input.salePrice}
                type="currency"
              />
              <Row
                label="Down payment"
                value={deal.input.downPayment}
                type="currency"
              />
              <Row label="APR" value={deal.input.apr} suffix="%" />
              <Row
                label="Term"
                value={deal.input.termWeeks}
                suffix=" weeks"
              />
              <Row
                label="Payment frequency"
                value={deal.input.paymentFrequency}
              />
              <Row
                label="Monthly income"
                value={deal.input.monthlyIncome ?? 0}
                type="currency"
              />
              <Row
                label="Months on job"
                value={deal.input.monthsOnJob ?? 0}
              />
              <Row
                label="Past repo"
                value={deal.input.pastRepo ? "Yes" : "No"}
              />
            </dl>
          </div>

          {/* Results */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">
                Calculations
              </h2>
              <dl className="space-y-2 text-xs text-slate-600">
                <Row
                  label="Payment"
                  value={deal.result.payment}
                  type="currency"
                />
                <Row
                  label="Total interest"
                  value={deal.result.totalInterest}
                  type="currency"
                />
                <Row
                  label="Total profit"
                  value={deal.result.totalProfit}
                  type="currency"
                />
                <Row
                  label="Break even week"
                  value={deal.result.breakEvenWeek}
                />
                <Row
                  label="PTI"
                  value={ptiPercent !== null ? ptiPercent : "N A"}
                  suffix={ptiPercent !== null ? "%" : undefined}
                />
                {/* LTV row removed to avoid duplication with DealCard */}
                <Row
                  label="Risk score"
                  value={deal.result.riskScore}
                />
                <Row
                  label="Underwriting verdict"
                  value={deal.result.underwritingVerdict}
                />
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">
                Underwriting reasons
              </h2>
              {deal.result.underwritingReasons?.length ? (
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-700">
                  {deal.result.underwritingReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">
                  No detailed reasons stored.
                </p>
              )}
            </div>

            {deal.result.aiExplanation && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">
                  AI underwriting explanation
                </h2>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
                  {deal.result.aiExplanation}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Row(props: {
  label: string;
  value: string | number;
  type?: "currency";
  suffix?: string;
}) {
  const { label, value, type, suffix } = props;
  let display: string | number = value;

  if (type === "currency" && typeof value === "number") {
    display = Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-800">
        {display}
        {suffix ? suffix : null}
      </dd>
    </div>
  );
}
