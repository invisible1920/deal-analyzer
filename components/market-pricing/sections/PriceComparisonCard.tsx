"use client";

type MarketData = {
  low: number;
  high: number;
  median: number;
  comps: number;
};

type VehicleInfo = {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: string;
  salePrice?: number;
};

interface PriceComparisonCardProps {
  vehicleInfo: VehicleInfo | null;
  marketData: MarketData;
  onUpdateSalePrice?: (price: number) => void;
}

export function PriceComparisonCard({
  vehicleInfo,
  marketData,
  onUpdateSalePrice
}: PriceComparisonCardProps) {
  const median = marketData.median;
  const salePrice = vehicleInfo?.salePrice ?? median * 1.12;

  const difference = salePrice - median;
  const percentDiff = median ? (difference / median) * 100 : 0;

  const priceLabel =
    percentDiff < -2
      ? "Below market"
      : percentDiff <= 5
      ? "At market"
      : percentDiff <= 20
      ? "Slightly above market"
      : "Well above market";

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Your price vs market</h2>
      <p className="text-sm text-slate-500 mb-3">
        This uses a sample sale price for now. You can pass the real sale price from your deal analyzer later.
      </p>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Median market price</span>
          <span className="text-lg font-semibold">
            ${median.toLocaleString()}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Your sale price</span>
          <span className="text-lg font-semibold">
            ${salePrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Position</span>
          <span className="text-sm font-medium">{priceLabel}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Difference</span>
          <span className="text-sm">
            {percentDiff >= 0 ? "+" : ""}
            {percentDiff.toFixed(1)}%
          </span>
        </div>
      </div>

      {onUpdateSalePrice && (
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
          onClick={() => onUpdateSalePrice(salePrice)}
        >
          Send this price to deal analyzer
        </button>
      )}
    </div>
  );
}
