"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password || !confirm) {
      setError("Enter and confirm your new password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // At this point the recovery link has already created a session
      // in this browser, so we can call updateUser directly.
      const { error } = await supabaseClient.auth.updateUser({
        password
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("Password updated. You can log in with your new password.");
      // Optional: redirect back to login after a short delay
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err?.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          background: "white",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)",
          border: "1px solid #e2e8f0"
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
            textAlign: "center",
            letterSpacing: "-0.03em"
          }}
        >
          Reset password
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            textAlign: "center",
            marginBottom: 20
          }}
        >
          Choose a new password for your BHPH Deal Analyzer account.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="password"
              style={{ fontSize: 12, color: "#64748b", marginBottom: 4, display: "block" }}
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 14
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="confirm"
              style={{ fontSize: 12, color: "#64748b", marginBottom: 4, display: "block" }}
            >
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 14
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 999,
              border: "none",
              background: "#4f46e5",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop: 10,
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 13,
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.6)",
              color: "#b91c1c"
            }}
          >
            <strong style={{ marginRight: 4 }}>Error:</strong>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            style={{
              marginTop: 10,
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 13,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.6)",
              color: "#15803d"
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
