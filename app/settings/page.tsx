"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

type SettingsForm = {
  dealerName: string;
  defaultAPR: number;
  maxPTI: number;
  maxLTV: number;
  minDownPayment: number;
  maxTermWeeks: number;
};

export default function SettingsPage() {
  const colors = themeColors.light;

  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // friendlier defaults that will approve the sample deal
  const [form, setForm] = useState<SettingsForm>({
    dealerName: "My BHPH Store",
    defaultAPR: 24.99,
    maxPTI: 0.25,
    maxLTV: 1.75,
    minDownPayment: 1000,
    maxTermWeeks: 160
  });

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserAndSettings() {
      setLoadingUser(true);
      setError(null);
      try {
        const { data } = await supabaseClient.auth.getUser();
        const user = data.user;
        if (!user) {
          setUserId(null);
          setError("You must be logged in to edit dealer settings.");
          return;
        }
        setUserId(user.id);

        setLoadingSettings(true);
        const { data: settingsRow, error: settingsError } =
          await supabaseClient
            .from("dealer_settings")
            .select(
              "dealer_name, default_apr, max_pti, max_ltv, min_down_payment, max_term_weeks"
            )
            .eq("user_id", user.id)
            .maybeSingle();

        if (settingsError) {
          console.warn("Error loading dealer_settings", settingsError.message);
        }

        if (settingsRow) {
          setForm({
            dealerName: settingsRow.dealer_name ?? "My BHPH Store",
            defaultAPR: Number(settingsRow.default_apr ?? 24.99),
            maxPTI: Number(settingsRow.max_pti ?? 0.25),
            maxLTV: Number(settingsRow.max_ltv ?? 1.75),
            minDownPayment: Number(settingsRow.min_down_payment ?? 1000),
            maxTermWeeks: Number(settingsRow.max_term_weeks ?? 160)
          });
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load settings.");
      } finally {
        setLoadingUser(false);
        setLoadingSettings(false);
      }
    }

    loadUserAndSettings();
  }, []);

  function handleChange(field: keyof SettingsForm, value: string) {
    setForm(prev => {
      if (field === "dealerName") {
        return { ...prev, dealerName: value };
      }
      const num = parseFloat(value);
      return {
        ...prev,
        [field]: Number.isNaN(num) ? prev[field] : num
      };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("You must be logged in to save dealer settings.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { error: upsertError } = await supabaseClient
        .from("dealer_settings")
        .upsert(
          {
            user_id: userId,
            dealer_name: form.dealerName,
            default_apr: form.defaultAPR,
            max_pti: form.maxPTI,
            max_ltv: form.maxLTV,
            min_down_payment: form.minDownPayment,
            max_term_weeks: form.maxTermWeeks
          },
          {
            onConflict: "user_id"
          }
        );

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      setMessage("Settings saved. New deals will use these rules.");
    } catch (err: any) {
      setError(err?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "32px 16px",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto"
  };

  const panelStyle: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)"
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "12px"
  };

  const labelStyle: CSSProperties = {
    fontSize: "12px",
    marginBottom: "4px",
    display: "block",
    color: colors.textSecondary
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "9px 10px",
    borderRadius: "8px",
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    fontSize: "14px"
  };

  const saveButtonStyle: CSSProperties = {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: saving ? "default" : "pointer",
    opacity: saving ? 0.6 : 1,
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: ".04em"
  };

  return (
    <main style={pageStyle}>
      <PageContainer>
        <div style={shellStyle}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "4px",
              letterSpacing: "-0.02em"
            }}
          >
            Dealer settings
          </h1>
          <p
            style={{
              color: colors.textSecondary,
              marginBottom: "16px",
              fontSize: "13px"
            }}
          >
            Set your store rules for PTI, LTV, down payment, APR and max term.
            New deals will use these values.
          </p>

          <div style={panelStyle}>
            {loadingUser || loadingSettings ? (
              <p style={{ fontSize: "14px" }}>Loading...</p>
            ) : null}

            {error && (
              <p
                style={{
                  color: "#b91c1c",
                  marginBottom: "12px",
                  fontSize: "13px"
                }}
              >
                {error}
              </p>
            )}

            {message && (
              <p
                style={{
                  color: "#15803d",
                  marginBottom: "12px",
                  fontSize: "13px"
                }}
              >
                {message}
              </p>
            )}

            {!loadingUser && userId && (
              <form onSubmit={handleSave}>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Dealer name</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={form.dealerName}
                      onChange={e =>
                        handleChange("dealerName", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Default APR</label>
                    <input
                      type="number"
                      step="0.01"
                      style={inputStyle}
                      value={form.defaultAPR}
                      onChange={e =>
                        handleChange("defaultAPR", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Max PTI (0.25 for 25 percent)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      style={inputStyle}
                      value={form.maxPTI}
                      onChange={e =>
                        handleChange("maxPTI", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Max LTV (1.75 for 175 percent)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      style={inputStyle}
                      value={form.maxLTV}
                      onChange={e =>
                        handleChange("maxLTV", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Min down payment (dollars)
                    </label>
                    <input
                      type="number"
                      step="1"
                      style={inputStyle}
                      value={form.minDownPayment}
                      onChange={e =>
                        handleChange("minDownPayment", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Max term weeks</label>
                    <input
                      type="number"
                      step="1"
                      style={inputStyle}
                      value={form.maxTermWeeks}
                      onChange={e =>
                        handleChange("maxTermWeeks", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "20px"
                  }}
                >
                  <button
                    type="submit"
                    disabled={saving}
                    style={saveButtonStyle}
                  >
                    {saving ? "Saving..." : "Save settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
