"use client";

import { useEffect, useState } from "react";

type VehicleInfo = {
  year: string;
  make: string;   // pretty make name (Ford)
  model: string;
  trim: string;
  mileage: string;
};

type VehicleInputsProps = {
  onSearch: (info: VehicleInfo) => void;
  onMarketValue: (data: any) => void;
};

type MakeOption = {
  id: string;   // ford
  name: string; // Ford
};

type OptionsResponse = {
  years: string[];
  makes: MakeOption[];
  models: string[];
  trims: string[];
};

export function VehicleInputs({
  onSearch,
  onMarketValue,
}: VehicleInputsProps) {
  const [year, setYear] = useState("");
  const [makeId, setMakeId] = useState("");
  const [makeName, setMakeName] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");

  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  async function fetchOptions(params: {
    year?: string;
    makeId?: string;
    model?: string;
  } = {}) {
    setLoadingOptions(true);

    const query = new URLSearchParams();
    if (params.year) query.set("year", params.year);
    if (params.makeId) query.set("makeId", params.makeId);
    if (params.model) query.set("model", params.model);

    const res = await fetch(
      `/api/vehicles/options${query.toString() ? `?${query}` : ""}`
    );

    if (!res.ok) {
      setLoadingOptions(false);
      return;
    }

    const data: OptionsResponse = await res.json();

    // Always update years so they stay stable
    setYears(data.years || []);

    // Only update the parts related to this level
    if (params.year && !params.makeId && !params.model) {
      setMakes(data.makes || []);
      setModels([]);
      setTrims([]);
    } else if (params.year && params.makeId && !params.model) {
      setMakes(data.makes || []);
      setModels(data.models || []);
      setTrims([]);
    } else if (params.year && params.makeId && params.model) {
      setMakes(data.makes || []);
      setModels(data.models || []);
      setTrims(data.trims || []);
    } else {
      // initial load: just years, everything else empty
      setMakes([]);
      setModels([]);
      setTrims([]);
    }

    setLoadingOptions(false);
  }

  // load years on first render
  useEffect(() => {
    fetchOptions();
  }, []);

  const handleYearChange = async (value: string) => {
    setYear(value);
    setMakeId("");
    setMakeName("");
    setModel("");
    setTrim("");
    if (value) {
      await fetchOptions({ year: value });
    } else {
      setMakes([]);
      setModels([]);
      setTrims([]);
    }
  };

  const handleMakeChange = async (value: string) => {
    setMakeId(value);
    setModel("");
    setTrim("");

    const make = makes.find((m) => m.id === value);
    setMakeName(make?.name || "");

    if (year && value) {
      await fetchOptions({ year, makeId: value });
    } else {
      setModels([]);
      setTrims([]);
    }
  };

  const handleModelChange = async (value: string) => {
    setModel(value);
    setTrim("");

    if (year && makeId && value) {
      await fetchOptions({ year, makeId, model: value });
    } else {
      setTrims([]);
    }
  };

  const handleFetch = () => {
    const info: VehicleInfo = {
      year,
      make: makeName || makeId,
      model,
      trim,
      mileage,
    };

    onSearch(info);

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
          onChange={(e) => handleYearChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
        >
          <option value="">
            {loadingOptions && years.length === 0
              ? "Loading years..."
              : "Year"}
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Make */}
        <select
          value={makeId}
          onChange={(e) => handleMakeChange(e.target.value)}
          disabled={!year}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">
            {year ? "Make" : "Select year first"}
          </option>
          {makes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Model */}
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={!makeId}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">
            {makeId ? "Model" : "Select make first"}
          </option>
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
          <option value="">
            {model ? "Trim" : "Select model first"}
          </option>
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
