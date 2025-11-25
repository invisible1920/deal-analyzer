"use client";

import { useEffect, useState } from "react";

export default function DealerSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/data/dealer.json");
      const data = await res.json();
      setSettings(data);
    }
    load();
  }, []);

  if (!settings) return null;

  async function save() {
    setError("");
    setSaved(false);

    const res = await fetch("/api/settings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }

    setSaved(true);
  }

  const container = {
    color: "white",
    minHeight: "100vh",
    padding: "24px",
    background: "#020617"
  };

  const panel = {
    background: "#111827",
    padding: "16px",
    borderRadius: "8px",
    maxWidth: "600px",
    border: "1px solid #1f2937"
  };

  const label = { fontSize: "12px", marginBottom: "4px", display: "block" };

  const input = {
    width: "100%",
    padding: "8px",
    marginBottom: "12px",
    borderRadius: "6px",
    background: "#1f2937",
    border: "1px solid #374151",
    color: "white"
  };

  return (
    <main style={container}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
        Dealer Settings
      </h1>

      <div style={panel}>
        <label style={label}>Dealer Name</label>
        <input
          style={input}
          value={settings.dealerName}
          onChange={(e) =>
            setSettings({ ...settings, dealerName: e.target.value })
          }
        />

        <label style={label}>Default APR (%)</label>
        <input
          type="number"
          style={input}
          value={settings.defaultAPR}
          onChange={(e) =>
            setSettings({ ...settings, defaultAPR: parseFloat(e.target.value) })
          }
        />

        <label style={label}>Max PTI (0.25 = 25%)</label>
        <input
          type="number"
          step="0.01"
          style={input}
          value={settings.maxPTI}
          onChange={(e) =>
            setSettings({ ...settings, maxPTI: parseFloat(e.target.value) })
          }
        />

        <label style={label}>Max LTV (1.4 = 140%)</label>
        <input
          type="number"
          step="0.01"
          style={input}
          value={settings.maxLTV}
          onChange={(e) =>
            setSettings({ ...settings, maxLTV: parseFloat(e.target.value) })
          }
        />

        <label style={label}>Minimum Down Payment ($)</label>
        <input
          type="number"
          style={input}
          value={settings.minDownPayment}
          onChange={(e) =>
            setSettings({
              ...settings,
              minDownPayment: parseFloat(e.target.value)
            })
          }
        />

        <label style={label}>Max Term (weeks)</label>
        <input
          type="number"
          style={input}
          value={settings.maxTermWeeks}
          onChange={(e) =>
            setSettings({
              ...settings,
              maxTermWeeks: parseInt(e.target.value)
            })
          }
        />

        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {saved && (
          <p style={{ color: "#4ade80" }}>Settings saved successfully!</p>
        )}

        <button
          onClick={save}
          style={{
            padding: "10px 16px",
            marginTop: "12px",
            background: "#4f46e5",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Save Settings
        </button>
      </div>
    </main>
  );
}
