"use client";

import { useState, useEffect } from "react";

export function VehicleInputs({ onSearch, onMarketValue }) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [trims, setTrims] = useState([]);

  const years = [];
  for (let y = 2025; y >= 1990; y--) years.push(String(y));

  async function fetchMakes(y) {
    setMakes([]);
    const res = await fetch(`/api/vehicles/makes?year=${y}`);
    const data = await res.json();
    setMakes(data.makes || []);
  }

  async function fetchModels(y, make) {
    setModels([]);
    const res = await fetch(`/api/vehicles/models?year=${y}&make=${make}`);
    const data = await res.json();
    setModels(data.models || []);
  }

  async function fetchTrims(make, model) {
    setTrims([]);
    const res = await fetch(`/api/vehicles/trims?make=${make}&model=${model}`);
    const data = await res.json();
    setTrims(data.trims || []);
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-5 gap-2">

        <select value={year} onChange={(e) => {
          setYear(e.target.value);
          fetchMakes(e.target.value);
        }}>
          <option>Year</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>

        <select value={make} disabled={!year} onChange={(e) => {
          setMake(e.target.value);
          fetchModels(year, e.target.value);
        }}>
          <option>Select make first</option>
          {makes.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>

        <select value={model} disabled={!make} onChange={(e) => {
          setModel(e.target.value);
          fetchTrims(make, e.target.value);
        }}>
          <option>Select model first</option>
          {models.map(md => <option key={md}>{md}</option>)}
        </select>

        <select value={trim} disabled={!model} onChange={(e)=>setTrim(e.target.value)}>
          <option>Select trim</option>
          {trims.map(t => <option key={t}>{t}</option>)}
        </select>

        <input value={mileage} placeholder="Mileage"
               onChange={(e)=>setMileage(e.target.value)} />

      </div>

      <button onClick={() => onMarketValue({})}>
        Get market value
      </button>
    </div>
  );
}
