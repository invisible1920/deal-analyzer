"use client";

import { useEffect } from "react";

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
};

type LtvData = {
  acv: number;
  financed: number;
  ltvOnAcv: number;
  ltvOnMarket: number;
};

type ScriptItem = {
  title: string;
  body: string;
};

interface ObjectionScriptsCardProps {
  vehicleInfo: VehicleInfo | null;
  marketData: MarketData | null;
  ltvData: LtvData | null;
  scripts: ScriptItem[];
  setScripts: (scripts: ScriptItem[]) => void;
}

export function ObjectionScriptsCard({
  vehicleInfo,
  marketData,
  ltvData,
  scripts,
  setScripts
}: ObjectionScriptsCardProps) {
  useEffect(() => {
    if (!marketData) return;

    const salePrice = marketData.median * 1.12;
    const priceScript: ScriptItem = {
      title: "Price feels high",
      body:
        `I understand price matters. Similar vehicles in this market are between ` +
        `$${marketData.low.toLocaleString()} and $${marketData.high.toLocaleString()}. ` +
        `We are at about $${salePrice.toLocaleString()} because this unit is fully serviced ` +
        `and ready to go, which keeps you away from surprise repair bills.`
    };

    const ltvScript: ScriptItem | null = ltvData
      ? {
          title: "Payment or structure concern",
          body:
            `Right now your structure is based on price, tax, term, and down payment. ` +
            `On this unit your LTV on ACV is about ${(ltvData.ltvOnAcv * 100).toFixed(
              1
            )} percent ` +
            `and on market is about ${(ltvData.ltvOnMarket * 100).toFixed(
              1
            )} percent. ` +
            `If we move a little more to the front or adjust the term we can bring the payment ` +
            `into a more comfortable range while keeping the approval realistic.`
        }
      : null;

    const baseScripts = ltvScript ? [priceScript, ltvScript] : [priceScript];
    setScripts(baseScripts);
  }, [marketData, ltvData, setScripts]);

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Predicted objections and scripts</h2>
      <p className="text-sm text-slate-500 mb-4">
        These are sample scripts based on the market range and structure. You can swap in your own language later.
      </p>

      {scripts.length === 0 ? (
        <p className="text-sm text-slate-500">
          Enter vehicle details and LTV inputs above to generate scripts.
        </p>
      ) : (
        <div className="space-y-4">
          {scripts.map((s, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-3 bg-slate-50 text-sm"
            >
              <div className="font-semibold mb-1">{s.title}</div>
              <p className="text-slate-700 whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
