"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { themeColors } from "@/app/theme";

type DealerSettings = {
  dealerName: string;
  defaultAPR: number;
  maxPTI: number;
  maxLTV: number;
  minDownPayment: number;
  maxTermWeeks: number;
};

export default function DealerSettingsPage() {
  const [settings, setSettings] = useState<DealerSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const colors = themeColors.light;

  useEffect(() => {
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
  }, []);

  if (!settings) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: colors.bg,
          color: colors.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
        }}
      >
        <p style={{ fontSize: 14, color: colors.textSecondary }}>
          Loading dealer settings…
        </p>
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

  const pageStyle = {
    minHeight: "100vh",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    padding: "32px 16px",
  } as const;

  const cardStyle = {
    maxWidth: 720,
    margin: "0 auto",
    padding: 24,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: "#ffffff", // light card, like main analyzer form
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.10)",
  } as const;

  const titleStyle = {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 6,
    letterSpacing: "-0.02em",
  } as const;

  const subtitleStyle = {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 18,
  } as const;

  const labelStyle = {
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 4,
    display: "block",
    color: colors.textSecondary,
  } as const;

  // LIGHT input style to match analyzer page
  const inputStyle = {
    width: "100%",
    padding: "9px 11px",
    marginBottom: 14,
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: "#f9fafb", // light gray, same family as app background
    color: colors.text,
    fontSize: 13,
    outline: "none",
  } as const;

  const buttonRowStyle = {
    marginTop: 10,
    display: "flex",
    justifyContent: "flex-start",
  } as const;

  const buttonStyle = {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    background:
      "linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%)",
    color: "white",
    boxShadow: "0 14px 32px rgba(79, 70, 229, 0.35)",
  } as const;

  return (
    <main style={pageStyle}>
      <PageContainer>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Dealer settings</h1>
          <p style={subtitleStyle}>
            Configure default underwriting limits and guardrails for your lot.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={labelStyle}>Dealer name</label>
            <input
              style={inputStyle}
              value={settings.dealerName}
              onChange={(e) =>
                setSettings({ ...settings, dealerName: e.target.value })
              }
            />

            <label style={labelStyle}>Default APR (%)</label>
            <input
              type="number"
              style={inputStyle}
              value={settings.defaultAPR}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultAPR: parseFloat(e.target.value || "0"),
                })
              }
            />

            <label style={labelStyle}>Max PTI (0.25 = 25%)</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={settings.maxPTI}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxPTI: parseFloat(e.target.value || "0"),
                })
              }
            />

            <label style={labelStyle}>Max LTV (1.4 = 140%)</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={settings.maxLTV}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxLTV: parseFloat(e.target.value || "0"),
                })
              }
            />

            <label style={labelStyle}>Minimum down payment ($)</label>
            <input
              type="number"
              style={inputStyle}
              value={settings.minDownPayment}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minDownPayment: parseFloat(e.target.value || "0"),
                })
              }
            />

            <label style={labelStyle}>Max term (weeks)</label>
            <input
              type="number"
              style={inputStyle}
              value={settings.maxTermWeeks}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxTermWeeks: parseInt(e.target.value || "0", 10),
                })
              }
            />
          </div>

          {error && (
            <p style={{ color: "#f97373", fontSize: 13, marginTop: 4 }}>
              {error}
            </p>
          )}
          {saved && (
            <p style={{ color: "#16a34a", fontSize: 13, marginTop: 4 }}>
              Settings saved successfully.
            </p>
          )}

          <div style={buttonRowStyle}>
            <button onClick={save} style={buttonStyle}>
              Save settings
            </button>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
