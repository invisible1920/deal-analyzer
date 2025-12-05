"use client";

import { useState } from "react";

export function VehicleInputs({ onSearch, onMarketValue }) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");

  const handleFetch = () => {
    const data = { year, make, model, trim, mileage };
    onSearch(data);

    // fake market API placeholder
    onMarketValue({
      low: 8800,
      high: 10100,
      median: 9450,
      comps: 27
    });
  };

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Vehicle details</h2>

      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        <input placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
        <input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
        <input placeholder="Trim" value={trim} onChange={(e) => setTrim(e.target.value)} />
        <input placeholder="Mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} />
      </div>

      <button
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
        onClick={handleFetch}
      >
        Get market value
      </button>
    </div>
  );
}
