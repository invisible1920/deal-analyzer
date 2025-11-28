"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type DealerSettings = {
  dealerName: string;
  defaultAPR: number;
  maxPTI: number;
  maxLTV: number;
  minDownPayment: number;
  maxTermWeeks: number;
};

export default function DealerSettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<DealerSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  // 1) Check Supabase auth first
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabaseClient.auth.getUser();
        if (!data.user) {
          // Not logged in – send to login and do NOT load settings
          router.replace("/login");
          return;
        }
      } catch {
        // If we cannot read user, treat as not logged in
        router.replace("/login");
        return;
      } finally {
        setAuthChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  // 2) Once auth is confirmed, load dealer settings
  useEffect(() => {
    if (authChecking) return;

    async function load() {
      try {
        const res = await fetch("/api/settings", { method: "GET" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load settings");
          return;
        }
        setSettings(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load settings");
      }
    }

    load();
  }, [authChecking]);

  // While checking auth or loading settings, show a simple loading screen
  if (authChecking || !settings) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading dealer settings...</p>
      </main>
    );
  }

  async function save() {
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }

      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    }
  }

  const container = {
    color: "white",
    minHeight: "100vh",
    padding: "24px",
    background: "#020617",
  } as const;

  const panel = {
    background: "#111827",
    padding: "16px",
    borderRadius: "8px",
    maxWidth: "600px",
    border: "1px solid #1f2937",
  } as const;

  const label = {
    fontSize: "12px",
    marginBottom: "4px",
    display: "block",
  } as const;

  const input = {
    width: "100%",
    padding: "8px",
    marginBottom: "12px",
    borderRadius: "6px",
    background: "#1f2937",
    border: "1px solid #374151",
    color: "white",
  } as const;

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
            setSettings({
              ...settings,
              defaultAPR: parseFloat(e.target.value || "0"),
            })
          }
        />

        <label style={label}>Max PTI (0.25 = 25%)</label>
        <input
          type="number"
          step="0.01"
          style={input}
          value={settings.maxPTI}
          onChange={(e) =>
            setSettings({
              ...settings,
              maxPTI: parseFloat(e.target.value || "0"),
            })
          }
        />

        <label style={label}>Max LTV (1.4 = 140%)</label>
        <input
          type="number"
          step="0.01"
          style={input}
          value={settings.maxLTV}
          onChange={(e) =>
            setSettings({
              ...settings,
              maxLTV: parseFloat(e.target.value || "0"),
            })
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
              minDownPayment: parseFloat(e.target.value || "0"),
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
              maxTermWeeks: parseInt(e.target.value || "0", 10),
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
            cursor: "pointer",
          }}
        >
          Save Settings
        </button>
      </div>
    </main>
  );
}
