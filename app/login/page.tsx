"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
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

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    padding: "24px",
    background: "#020617",
    color: "#e5e7eb"
  };

  const cardStyle: CSSProperties = {
    maxWidth: "400px",
    margin: "0 auto",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "40px",
    background: "#020617"
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #374151",
    background: "#020617",
    color: "#e5e7eb",
    marginBottom: "8px"
  };

  const buttonStyle: CSSProperties = {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.6 : 1,
    marginTop: "8px"
  };

  const toggleStyle: CSSProperties = {
    fontSize: "13px",
    marginTop: "8px",
    color: "#9ca3af",
    cursor: "pointer",
    textAlign: "center"
  };

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "8px",
            textAlign: "center"
          }}
        >
          {mode === "login" ? "Dealer login" : "Create dealer account"}
        </h1>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "13px",
            textAlign: "center",
            marginBottom: "16px"
          }}
        >
          Use your email and password to access your deals.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            style={inputStyle}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            style={inputStyle}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
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
          <p style={{ color: "#f87171", fontSize: "13px", marginTop: "8px" }}>
            Error: {error}
          </p>
        )}
        {message && (
          <p style={{ color: "#4ade80", fontSize: "13px", marginTop: "8px" }}>
            {message}
          </p>
        )}

        <div
          style={toggleStyle}
          onClick={() =>
            setMode((prev) => (prev === "login" ? "signup" : "login"))
          }
        >
          {mode === "login"
            ? "New here? Create an account."
            : "Already have an account? Log in."}
        </div>
      </div>
    </main>
  );
}
