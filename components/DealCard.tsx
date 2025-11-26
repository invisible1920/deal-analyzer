// components/DealCard.tsx
import Link from "next/link";

type DealCardProps = {
  id: string;
  createdAt: string;
  income: number;
  salePrice: number;
  downPayment: number;
  payment: number;
  profit: number;
  pti: number;
  ltv: number;
  verdict: string;
  href?: string;
};

const verdictColorMap: Record<string, string> = {
  Approve: "bg-emerald-100 text-emerald-800",
  Counter: "bg-amber-100 text-amber-800",
  Decline: "bg-rose-100 text-rose-800",
};

export function DealCard(props: DealCardProps) {
  const {
    id,
    createdAt,
    income,
    salePrice,
    downPayment,
    payment,
    profit,
    pti,
    ltv,
    verdict,
    href,
  } = props;

  const verdictClass =
    verdictColorMap[verdict] ?? "bg-slate-100 text-slate-700";

  const content = (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">
            {new Date(createdAt).toLocaleDateString()}
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            {Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(salePrice)}{" "}
            deal
          </h2>
          <p className="text-xs text-slate-500">
            Income {Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(income)} per month
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${verdictClass}`}
        >
          {verdict}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <Stat label="Down" value={downPayment} format="currency" />
        <Stat label="Payment" value={payment} format="currency" />
        <Stat label="Profit" value={profit} format="currency" />
        <Stat label="PTI" value={pti} format="percent" />
        <Stat label="LTV" value={ltv} format="percent" />
      </div>

      <footer className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate">ID {id}</span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 group-hover:text-sky-700">
          View details
          <span aria-hidden>›</span>
        </span>
      </footer>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function Stat(props: {
  label: string;
  value: number;
  format?: "currency" | "percent" | "raw";
}) {
  const { label, value, format = "raw" } = props;

  let display = value.toString();
  if (format === "currency") {
    display = Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } else if (format === "percent") {
    display = `${value.toFixed(1)} %`;
  }

  return (
    <div className="flex flex-col">
      <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="mt-0.5 text-xs font-semibold text-slate-900">
        {display}
      </span>
    </div>
  );
}
