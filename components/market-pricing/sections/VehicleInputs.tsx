"use client";

import { useState } from "react";
import { VEHICLE_DB, VEHICLE_YEARS } from "@/data/vehicleDb";

export function VehicleInputs({ onSearch, onMarketValue }) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");

  const dbForYear = year ? VEHICLE_DB[year] || {} : {};
  const makes = Object.keys(dbForYear).sort();
  const models = make ? Object.keys(dbForYear[make] || {}).sort() : [];
  const trims = make && model ? dbForYear[make]?.[model] || [] : [];

  const handleFetch = () => {
    const data = { year, make, model, trim, mileage };
    onSearch(data);

    // fake market API placeholder
    onMarketValue({
      low: 8800,
      high: 10100,
      median: 9450,
      comps: 27,
    });
  };

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Vehicle details</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Year */}
        <select
          value={year}
          onChange={(e) => {
            const value = e.target.value;
            setYear(value);
            setMake("");
            setModel("");
            setTrim("");
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        >
          <option value="">Year</option>
          {VEHICLE_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Make */}
        <select
          value={make}
          onChange={(e) => {
            const value = e.target.value;
            setMake(value);
            setModel("");
            setTrim("");
          }}
          disabled={!year}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">{year ? "Make" : "Select year first"}</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Model */}
        <select
          value={model}
          onChange={(e) => {
            const value = e.target.value;
            setModel(value);
            setTrim("");
          }}
          disabled={!make}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">{make ? "Model" : "Select make first"}</option>
          {models.map((mdl) => (
            <option key={mdl} value={mdl}>
              {mdl}
            </option>
          ))}
        </select>

        {/* Trim */}
        <select
          value={trim}
          onChange={(e) => setTrim(e.target.value)}
          disabled={!model}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">{model ? "Trim" : "Select model first"}</option>
          {trims.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Mileage */}
        <input
          placeholder="Mileage"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        />
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
