"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (!res.ok) return setError(data.error || "Login failed");

    window.location.href = "/dealer/settings";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#020617",
        color: "white"
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "#111827",
          padding: "24px",
          borderRadius: "8px",
          width: "320px"
        }}
      >
        <h1 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 600 }}>
          Dealer Login
        </h1>

        <input
          type="password"
          placeholder="Enter dealer password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "12px",
            borderRadius: "4px",
            background: "#1f2937",
            border: "1px solid #374151",
            color: "white"
          }}
        />

        {error && (
          <p style={{ color: "#f87171", marginBottom: "12px" }}>{error}</p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#4f46e5",
            borderRadius: "6px",
            border: "none",
            color: "white",
            cursor: "pointer"
          }}
        >
          Login
        </button>
      </form>
    </main>
  );
}
