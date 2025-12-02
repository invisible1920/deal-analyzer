// components/OptimizedDeals.tsx

export function OptimizedDeals({ deals, onApply }: any) {
  if (!deals || deals.length === 0) return null;

  return (
    <section className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">
        Suggested Deal Structures
      </h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {deals.map((d: any, index: number) => {
          const pti = (d.metrics.pti * 100).toFixed(1);
          const ltv = (d.metrics.ltv * 100).toFixed(1);

          return (
            <article
              key={index}
              className="border rounded-lg bg-white p-3 shadow-sm"
            >
              <h4 className="font-semibold text-slate-800">{d.label}</h4>
              <p className="text-xs text-slate-500 mb-2">{d.description}</p>

              <div className="text-xs space-y-1">
                <p>Payment: ${d.metrics.payment}</p>
                <p>Profit: ${d.metrics.profit}</p>
                <p>PTI: {pti}%</p>
                <p>LTV: {ltv}%</p>
                <p>Down: ${d.input.downPayment}</p>
                <p>Term: {d.input.termMonths} mo</p>
              </div>

              <button
                onClick={() => onApply(d)}
                className="mt-2 w-full rounded-md bg-sky-600 text-white text-xs py-1.5 hover:bg-sky-700"
              >
                Apply This Structure
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
