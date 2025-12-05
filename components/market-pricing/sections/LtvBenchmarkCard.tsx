"use client";

import { useState } from "react";

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
};

type LtvData = {
  acv: number;
  financed: number;
  ltvOnAcv: number;
  ltvOnMarket: number;
};

interface LtvBenchmarkCardProps {
  vehicleInfo: VehicleInfo | null;
  marketData: MarketData;
  onLtvCalculated?: (ltv: LtvData) => void;
}

export function LtvBenchmarkCard({
  vehicleInfo,
  marketData,
  onLtvCalculated
}: LtvBenchmarkCardProps) {
  const [vehicleCost, setVehicleCost] = useState("");
  const [reconCost, setReconCost] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [backend, setBackend] = useState("");
  const [down, setDown] = useState("");

  const handleCalc = () => {
    const num = (v: string) => Number(v || 0);

    const acv = num(vehicleCost) + num(reconCost);
    const financed = num(salePrice) + num(backend) - num(down);
    const ltvOnAcv = acv > 0 ? financed / acv : 0;
    const ltvOnMarket =
      marketData.median > 0 ? financed / marketData.median : 0;

    const ltvData: LtvData = {
      acv,
      financed,
      ltvOnAcv,
      ltvOnMarket
    };

    if (onLtvCalculated) {
      onLtvCalculated(ltvData);
    }
  };

  const formatPct = (v: number) =>
    isFinite(v) && v > 0 ? `${(v * 100).toFixed(1)}%` : "n/a";

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-2">LTV benchmark</h2>
      <p className="text-sm text-slate-500 mb-4">
        Enter your store numbers to see LTV on ACV and LTV on market.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <input
          placeholder="Vehicle cost"
          value={vehicleCost}
          onChange={(e) => setVehicleCost(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <input
          placeholder="Recon cost"
          value={reconCost}
          onChange={(e) => setReconCost(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <input
          placeholder="Sale price"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <input
          placeholder="Backend (warranty, gap)"
          value={backend}
          onChange={(e) => setBackend(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <input
          placeholder="Down payment"
          value={down}
          onChange={(e) => setDown(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>

      <button
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
        onClick={handleCalc}
      >
        Calculate LTV
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-500">Market median</div>
          <div className="font-semibold">
            ${marketData.median.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">LTV on ACV</div>
          <div className="font-semibold">{formatPct(NaN)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">LTV on market</div>
          <div className="font-semibold">{formatPct(NaN)}</div>
        </div>
      </div>
    </div>
  );
}
