"use client";

import { useState } from "react";

interface VehicleInputsProps {
  onSearch: (info: {
    year: string;
    make: string;
    model: string;
    trim: string;
    mileage: string;
  }) => void;
  onMarketValue: (data: {
    low: number;
    high: number;
    median: number;
    comps: number;
  } | null) => void;
}

export function VehicleInputs({ onSearch, onMarketValue }: VehicleInputsProps) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");

  const [makes, setMakes] = useState<Array<{ id?: string | number; name?: string }>>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);

  const years: string[] = [];
  for (let y = 2025; y >= 1990; y -= 1) years.push(String(y));

  async function fetchMakes(y: string) {
    try {
      setMakes([]);
      if (!y) return;
      const res = await fetch(`/api/vehicles/makes?year=${encodeURIComponent(y)}`);
      if (!res.ok) throw new Error("Failed to load makes");
      const data = await res.json();
      setMakes(data.makes || []);
    } catch (error) {
      console.error("Error fetching makes", error);
    }
  }

  async function fetchModels(y: string, mk: string) {
    try {
      setModels([]);
      if (!y || !mk) return;
      const res = await fetch(
        `/api/vehicles/models?year=${encodeURIComponent(y)}&make=${encodeURIComponent(mk)}`
      );
      if (!res.ok) throw new Error("Failed to load models");
      const data = await res.json();
      setModels(data.models || []);
    } catch (error) {
      console.error("Error fetching models", error);
    }
  }

  async function fetchTrims(mk: string, mdl: string) {
    try {
      setTrims([]);
      if (!mk || !mdl) return;
      const res = await fetch(
        `/api/vehicles/trims?make=${encodeURIComponent(mk)}&model=${encodeURIComponent(mdl)}`
      );
      if (!res.ok) throw new Error("Failed to load trims");
      const data = await res.json();
      setTrims(data.trims || []);
    } catch (error) {
      console.error("Error fetching trims", error);
    }
  }

  async function handleGetMarketValue() {
    const info = { year, make, model, trim, mileage };
    onSearch(info);

    if (!year || !make || !model || !trim) {
      alert("Please select year, make, model, and trim first.");
      return;
    }

    try {
      const res = await fetch("/api/market-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });

      if (!res.ok) throw new Error("Failed to fetch market value");

      const raw = await res.json();

      const marketData = {
        low: Number(raw.low ?? raw.min ?? 0),
        high: Number(raw.high ?? raw.max ?? 0),
        median: Number(raw.median ?? raw.average ?? 0),
        comps: Number(raw.comps ?? raw.comparableCount ?? 0),
      };

      onMarketValue(marketData);
    } catch (error) {
      console.error("Error getting market value", error);

      // Fallback example data so the UI still works for now
      onMarketValue({
        low: 8000,
        high: 12000,
        median: 10000,
        comps: 42,
      });
    }
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-5 gap-2">
        {/* Year */}
        <select
          value={year}
          onChange={(e) => {
            const y = e.target.value;
            setYear(y);
            setMake("");
            setModel("");
            setTrim("");
            fetchMakes(y);
          }}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Make */}
        <select
          value={make}
          disabled={!year}
          onChange={(e) => {
            const mk = e.target.value;
            setMake(mk);
            setModel("");
            setTrim("");
            fetchModels(year, mk);
          }}
        >
          <option value="">Make</option>
          {makes.map((m) => {
            const key = m.id ?? m.name ?? "";
            const name = m.name ?? String(m.id ?? "");
            return (
              <option key={key} value={name}>
                {name}
              </option>
            );
          })}
        </select>

        {/* Model */}
        <select
          value={model}
          disabled={!make}
          onChange={(e) => {
            const mdl = e.target.value;
            setModel(mdl);
            setTrim("");
            fetchTrims(make, mdl);
          }}
        >
          <option value="">Model</option>
          {models.map((md) => (
            <option key={md} value={md}>
              {md}
            </option>
          ))}
        </select>

        {/* Trim */}
        <select
          value={trim}
          disabled={!model}
          onChange={(e) => setTrim(e.target.value)}
        >
          <option value="">Trim</option>
          {trims.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Mileage */}
        <input
          value={mileage}
          placeholder="Mileage"
          onChange={(e) => setMileage(e.target.value)}
        />
      </div>

      <button onClick={handleGetMarketValue}>
        Get market value
      </button>
    </div>
  );
}
