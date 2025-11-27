"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

export default function BillingPage() {
  const colors = themeColors.light;

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabaseClient.auth.getUser();
        setUserId(data.user ? data.user.id : null);
      } catch (err: any) {
        setUserId(null);
        setError(err?.message || "Failed to load user");
      } finally {
        setAuthLoaded(true);
      }
    }
    loadUser();
  }, []);

  async function handleUpgrade() {
    if (!userId) return;
    setError(null);
    setCreatingCheckout(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || `HTTP ${res.status}`);
        return;
      }

      const json = await res.json();
      if (json.url) {
        window.location.href = json.url as string;
      } else {
        setError("Stripe did not return a checkout url");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to start checkout");
    } finally {
      setCreatingCheckout(false);
    }
  }

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: colors.bg,
    color: colors.text,
    display: "flex",
    alignItems: "center",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto"
  };

  const layoutStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
    gap: "20px"
  };

  const infoCardStyle: CSSProperties = {
    background: colors.panel,
    borderRadius: "18px",
    border: `1px solid ${colors.border}`,
    padding: "20px",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)"
  };

  const planCardStyle: CSSProperties = {
    background: colors.panel,
    borderRadius: "18px",
    border: `1px solid ${colors.border}`,
    padding: "20px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.2)"
  };

  const badgeRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px"
  };

  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    backgroundColor: "rgba(22,163,74,0.12)",
    color: "#15803d",
    border: "1px solid rgba(34,197,94,0.6)"
  };

  const helperTextStyle: CSSProperties = {
    fontSize: "12px",
    color: colors.textSecondary
  };

  const titleStyle: CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    marginBottom: "6px"
  };

  const subtitleStyle: CSSProperties = {
    fontSize: "14px",
    color: colors.textSecondary,
    marginBottom: "12px"
  };

  const metricsRowStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "12px"
  };

  const metricStyle: CSSProperties = {
    minWidth: "120px"
  };

  const metricLabelStyle: CSSProperties = {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: colors.textSecondary
  };

  const metricValueStyle: CSSProperties = {
    fontSize: "16px",
    fontWeight: 600
  };

  const priceRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    marginBottom: "6px"
  };

  const priceStyle: CSSProperties = {
    fontSize: "28px",
    fontWeight: 700,
    letterSpacing: "-0.03em"
  };

  const priceUnitStyle: CSSProperties = {
    fontSize: "13px",
    color: colors.textSecondary
  };

  const planNameStyle: CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "8px"
  };

  const featureListStyle: CSSProperties = {
    fontSize: "13px",
    color: colors.text,
    margin: 0,
    paddingLeft: "18px",
    lineHeight: 1.6
  };

  const finePrintStyle: CSSProperties = {
    fontSize: "11px",
    color: colors.textSecondary,
    marginTop: "10px"
  };

  const buttonStyle: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    cursor: creatingCheckout ? "default" : "pointer",
    opacity: creatingCheckout ? 0.8 : 1,
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginTop: "14px",
    boxShadow:
      "0 10px 30px rgba(37, 99, 235, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.7)"
  };

  const disabledNoteStyle: CSSProperties = {
    fontSize: "13px",
    color: "#facc15",
    marginTop: "10px"
  };

  const errorTextStyle: CSSProperties = {
    marginTop: "10px",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "13px",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.6)",
    color: "#b91c1c"
  };

  return (
    <main style={pageStyle}>
      <PageContainer>
        <div style={shellStyle}>
          <div style={{ marginBottom: "20px" }}>
            <div style={badgeRowStyle}>
              <span style={badgeStyle}>Dealer billing</span>
              <span style={helperTextStyle}>
                Billing handled securely by Stripe
              </span>
            </div>
            <h1 style={titleStyle}>Choose your plan</h1>
            <p style={subtitleStyle}>
              Keep your deal desk running with clear pricing for unlimited
              BHPH deal analysis and AI underwriting.
            </p>
          </div>

          <div style={layoutStyle}>
            {/* Left: explanation and current limits */}
            <div style={infoCardStyle}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "6px"
                }}
              >
                Free dealer plan
              </h2>
              <p style={subtitleStyle}>
                Great for trying the tool or low volume stores.
              </p>

              <ul
                style={{
                  fontSize: "13px",
                  color: colors.text,
                  margin: 0,
                  paddingLeft: "18px",
                  lineHeight: 1.6
                }}
              >
                <li>Up to 25 analyzed deals per month</li>
                <li>Core payment and profit calculations</li>
                <li>Basic underwriting summary from AI</li>
              </ul>

              <div style={metricsRowStyle}>
                <div style={metricStyle}>
                  <div style={metricLabelStyle}>Best for</div>
                  <div style={metricValueStyle}>Single rooftop</div>
                </div>
                <div style={metricStyle}>
                  <div style={metricLabelStyle}>Team size</div>
                  <div style={metricValueStyle}>One user</div>
                </div>
                <div style={metricStyle}>
                  <div style={metricLabelStyle}>Billing</div>
                  <div style={metricValueStyle}>No card required</div>
                </div>
              </div>

              <p style={{ ...finePrintStyle, marginTop: "14px" }}>
                You can stay on the free plan as long as you like.
                When you start bumping into the limit, you can move
                to Pro in a few seconds.
              </p>
            </div>

            {/* Right: Pro plan and checkout button */}
            <div style={planCardStyle}>
              <div style={planNameStyle}>Dealer Pro</div>
              <div style={priceRowStyle}>
                <span style={priceStyle}>59</span>
                <span style={priceUnitStyle}>per month per store</span>
              </div>
              <p style={subtitleStyle}>
                Flat price designed for BHPH dealers that live in their
                numbers every day.
              </p>

              <ul style={featureListStyle}>
                <li>Unlimited deal analyses</li>
                <li>Full AI underwriting commentary and risk reasons</li>
                <li>Priority access to new features and updates</li>
                <li>Export ready deal sheets for customers</li>
              </ul>

              {!authLoaded && (
                <p style={{ ...helperTextStyle, marginTop: "14px" }}>
                  Checking your account
                </p>
              )}

              {authLoaded && !userId && (
                <>
                  <p style={disabledNoteStyle}>
                    You must be logged in to upgrade. Use the login
                    link in the top bar, then come back here.
                  </p>
                </>
              )}

              {authLoaded && userId && (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={creatingCheckout}
                  style={buttonStyle}
                >
                  {creatingCheckout ? "Redirecting to Stripe" : "Upgrade to Dealer Pro"}
                </button>
              )}

              <p style={finePrintStyle}>
                You can cancel any time from your Stripe customer portal.
                Your access stays active through the end of the billing
                period.
              </p>

              {error && (
                <div style={errorTextStyle}>
                  <strong style={{ marginRight: 4 }}>Error:</strong>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
