"use client";

import { useState } from "react";
import { VehicleInputs } from "./sections/VehicleInputs";
import { MarketValueCard } from "./sections/MarketValueCard";
import { PriceComparisonCard } from "./sections/PriceComparisonCard";
import { LtvBenchmarkCard } from "./sections/LtvBenchmarkCard";
import { ObjectionScriptsCard } from "./sections/ObjectionScriptsCard";

export function MarketPricingPage() {
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [ltvData, setLtvData] = useState(null);
  const [scripts, setScripts] = useState([]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-10">
      
      {/* Title */}
      <h1 className="text-3xl font-bold">Market Pricing and LTV Benchmark</h1>

      {/* Section 1: vehicle inputs */}
      <VehicleInputs
        onSearch={(info) => {
          setVehicleInfo(info);
        }}
        onMarketValue={(data) => {
          setMarketData(data);
        }}
      />

      {/* Section 2: Market value summary */}
      {marketData && (
        <MarketValueCard marketData={marketData} />
      )}

      {/* Section 3: Compare your price to market */}
      {marketData && (
        <PriceComparisonCard
          vehicleInfo={vehicleInfo}
          marketData={marketData}
          onUpdateSalePrice={() => {}}
        />
      )}

      {/* Section 4: LTV benchmark */}
      {marketData && (
        <LtvBenchmarkCard
          vehicleInfo={vehicleInfo}
          marketData={marketData}
          onLtvCalculated={(ltv) => setLtvData(ltv)}
        />
      )}

      {/* Section 5: AI objection scripts */}
      {(marketData || ltvData) && (
        <ObjectionScriptsCard
          vehicleInfo={vehicleInfo}
          marketData={marketData}
          ltvData={ltvData}
          scripts={scripts}
          setScripts={setScripts}
        />
      )}

    </div>
  );
}
