"use client";

type MarketData = {
  low: number;
  high: number;
  median: number;
  comps: number;
};

interface MarketValueCardProps {
  marketData: MarketData;
}

export function MarketValueCard({ marketData }: MarketValueCardProps) {
  const { low, high, median, comps } = marketData;

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Market value summary</h2>
      <p className="text-sm text-slate-500 mb-4">
        Based on example data for now. You can wire this to a real market API later.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500">Market range</div>
          <div className="text-lg font-semibold">
            ${low.toLocaleString()} to ${high.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Median price</div>
          <div className="text-lg font-semibold">
            ${median.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Comparable listings</div>
          <div className="text-lg font-semibold">{comps}</div>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1 text-[10px] text-slate-400">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
