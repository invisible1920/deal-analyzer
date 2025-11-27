"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

export default function LoginPage() {
  const router = useRouter();
  const colors = themeColors.light;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await supabaseClient.auth.signUp({
          email,
          password
        });
        if (error) {
          setError(error.message);
          return;
        }
        setMessage(
          "Sign up successful. If email confirmation is required, check your inbox."
        );
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          setError(error.message);
          return;
        }
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Auth error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError(null);
      setMessage(null);
      setGoogleLoading(true);

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google"
        // If you have an auth callback route configured:
        // options: { redirectTo: `${window.location.origin}/auth/callback` }
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
      // On success, Supabase will redirect according to your settings
    } catch (err: any) {
      setError(err?.message || "Google sign in failed");
      setGoogleLoading(false);
    }
  }

  // Styles using the shared theme
  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    display: "flex",
    alignItems: "center"
  };

  const shellStyle: CSSProperties = {
    width: "100%",
    maxWidth: "420px",
    margin: "0 auto"
  };

  const cardStyle: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)"
  };

  const titleStyle: CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "4px",
    textAlign: "center" as const,
    letterSpacing: "-0.03em"
  };

  const subtitleStyle: CSSProperties = {
    color: colors.textSecondary,
    fontSize: "13px",
    textAlign: "center" as const,
    marginBottom: "20px"
  };

  const labelStyle: CSSProperties = {
    fontSize: "12px",
    color: colors.textSecondary,
    marginBottom: "4px"
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontSize: "14px",
    outline: "none",
    marginBottom: "12px"
  };

  const primaryButtonStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "999px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    fontSize: "14px",
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
    marginTop: "4px"
  };

  const googleButtonStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "999px",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontSize: "14px",
    fontWeight: 500,
    cursor: googleLoading ? "default" : "pointer",
    opacity: googleLoading ? 0.7 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "8px"
  };

  const dividerRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "16px 0"
  };

  const dividerLineStyle: CSSProperties = {
    flex: 1,
    height: "1px",
    background: colors.border
  };

  const dividerTextStyle: CSSProperties = {
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: colors.textSecondary
  };

  const toggleStyle: CSSProperties = {
    fontSize: "13px",
    marginTop: "16px",
    color: colors.textSecondary,
    textAlign: "center" as const
  };

  const toggleButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    padding: 0,
    marginLeft: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500
  };

  const alertErrorStyle: CSSProperties = {
    marginTop: "10px",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "13px",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.6)",
    color: "#b91c1c"
  };

  const alertSuccessStyle: CSSProperties = {
    marginTop: "10px",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "13px",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.6)",
    color: "#15803d"
  };

  return (
    <main style={pageStyle}>
      <PageContainer>
        <div style={shellStyle}>
          <div style={cardStyle}>
            <h1 style={titleStyle}>
              {mode === "login" ? "Dealer login" : "Create dealer account"}
            </h1>
            <p style={subtitleStyle}>
              Sign in to run deals, save history and keep your BHPH numbers tight.
            </p>

            {/* Google SSO */}
            <button
              type="button"
              style={googleButtonStyle}
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {/* Simple G icon substitute so you do not need an asset set up */}
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "4px",
                  border: "1px solid rgba(148,163,184,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700
                }}
              >
                G
              </span>
              <span>
                {googleLoading ? "Connecting to Google..." : "Continue with Google"}
              </span>
            </button>

            <div style={dividerRowStyle}>
              <div style={dividerLineStyle} />
              <span style={dividerTextStyle}>or use email</span>
              <div style={dividerLineStyle} />
            </div>

            {/* Email login form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "6px" }}>
                <label style={labelStyle} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  style={inputStyle}
                  placeholder="you@dealership.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "4px" }}>
                <label style={labelStyle} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  style={inputStyle}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                style={primaryButtonStyle}
              >
                {loading
                  ? mode === "login"
                    ? "Logging in..."
                    : "Signing up..."
                  : mode === "login"
                  ? "Log in"
                  : "Sign up"}
              </button>
            </form>

            {error && (
              <div style={alertErrorStyle}>
                <strong style={{ marginRight: 4 }}>Error:</strong>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div style={alertSuccessStyle}>{message}</div>
            )}

            <div style={toggleStyle}>
              {mode === "login" ? "New here?" : "Already have an account?"}
              <button
                type="button"
                style={toggleButtonStyle}
                onClick={() =>
                  setMode((prev) => (prev === "login" ? "signup" : "login"))
                }
              >
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
