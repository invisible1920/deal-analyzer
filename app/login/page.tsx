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

        // include email as well so your api route can find the user
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error || "Failed to create session cookie");
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

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo
        }
      });

      if (error) {
        if (
          error.message?.includes("provider is not enabled") ||
          error.message?.includes("Unsupported provider")
        ) {
          setError(
            "Google sign in is not configured yet. Please contact the admin or use email login."
          );
        } else {
          setError(error.message);
        }
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Google sign in failed");
      setGoogleLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError("Enter your email above first so we know where to send the link.");
      return;
    }

    try {
      setError(null);
      setMessage(null);

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/update-password`
          : undefined;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("Password reset link sent. Check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Could not send reset link");
    }
  }

  // layout styles
  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: colors.bg,
    color: colors.text,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // centers the card inside the viewport
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
    textAlign: "center",
    letterSpacing: "-0.03em"
  };

  const subtitleStyle: CSSProperties = {
    color: colors.textSecondary,
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "20px"
  };

  const formGroupStyle: CSSProperties = {
    marginBottom: "14px"
  };

  const labelRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px"
  };

  const labelStyle: CSSProperties = {
    fontSize: "12px",
    color: colors.textSecondary
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontSize: "14px",
    outline: "none"
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
    marginTop: "8px"
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
    marginBottom: "12px"
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
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: colors.textSecondary
  };

  const toggleStyle: CSSProperties = {
    fontSize: "13px",
    marginTop: "16px",
    color: colors.textSecondary,
    textAlign: "center"
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

  const forgotPasswordButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: "12px",
    color: "#2563eb",
    cursor: "pointer"
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

            <button
              type="button"
              style={googleButtonStyle}
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
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

            <form onSubmit={handleSubmit}>
              <div style={formGroupStyle}>
                <div style={labelRowStyle}>
                  <label style={labelStyle} htmlFor="email">
                    Email
                  </label>
                </div>
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

              <div style={formGroupStyle}>
                <div style={labelRowStyle}>
                  <label style={labelStyle} htmlFor="password">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      style={forgotPasswordButtonStyle}
                      onClick={handlePasswordReset}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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

            {message && <div style={alertSuccessStyle}>{message}</div>}

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
