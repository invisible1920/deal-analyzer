"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function BillingPage() {
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
    padding: "24px",
    background: "radial-gradient(circle at top, #0f172a, #020617 55%)",
    color: "#e5e7eb",
    display: "flex",
    justifyContent: "center",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
  };

  const cardStyle: CSSProperties = {
    maxWidth: "640px",
    width: "100%",
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid #1f2937",
    borderRadius: "16px",
    padding: "20px",
    boxShadow:
      "0 18px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(15, 23, 42, 0.7)"
  };

  const titleStyle: CSSProperties = {
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: "4px"
  };

  const subtitleStyle: CSSProperties = {
    fontSize: "13px",
    color: "#9ca3af",
    marginBottom: "12px"
  };

  const featureListStyle: CSSProperties = {
    fontSize: "13px",
    color: "#e5e7eb",
    margin: 0,
    paddingLeft: "18px",
    lineHeight: 1.5
  };

  const buttonStyle: CSSProperties = {
    padding: "9px 18px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
    color: "white",
    cursor: creatingCheckout ? "default" : "pointer",
    opacity: creatingCheckout ? 0.7 : 1,
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    boxShadow:
      "0 10px 30px rgba(37, 99, 235, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.7)",
    marginTop: "16px"
  };

  const infoTextStyle: CSSProperties = {
    fontSize: "13px",
    color: "#9ca3af"
  };

  const warningTextStyle: CSSProperties = {
    fontSize: "13px",
    color: "#facc15",
    marginTop: "8px"
  };

  const errorTextStyle: CSSProperties = {
    fontSize: "13px",
    color: "#f87171",
    marginTop: "10px"
  };

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Upgrade to Pro</h1>
        <p style={subtitleStyle}>
          Free tier includes 25 analyzed deals each month. Pro unlocks unlimited deals and advanced AI underwriting.
        </p>

        <p style={infoTextStyle}>Pro plan includes:</p>
        <ul style={featureListStyle}>
          <li>Unlimited deal analyses</li>
          <li>Advanced AI underwriting commentary</li>
          <li>Priority access to new features</li>
        </ul>

        {!authLoaded && (
          <p style={{ ...infoTextStyle, marginTop: "12px" }}>
            Checking your account
          </p>
        )}

        {authLoaded && !userId && (
          <p style={warningTextStyle}>
            You must be logged in to upgrade. Use the Login link in the top bar.
          </p>
        )}

        {authLoaded && userId && (
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={creatingCheckout}
            style={buttonStyle}
          >
            {creatingCheckout ? "Redirecting..." : "Upgrade with Stripe"}
          </button>
        )}

        {error && <p style={errorTextStyle}>Error: {error}</p>}
      </div>
    </main>
  );
}
