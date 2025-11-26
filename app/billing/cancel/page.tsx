"use client";

import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        background: "#0b1120",
        color: "#e2e8f0",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          background: "#111827",
          borderRadius: 16,
          border: "1px solid #1f2937",
          padding: 32,
          boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Checkout canceled
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#9ca3af",
            marginBottom: 20,
          }}
        >
          Your card was not charged. You can restart checkout at any time from
          the analyzer.
        </p>

        <Link
          href="/"
          style={{
            padding: "10px 20px",
            borderRadius: 999,
            border: "none",
            background:
              "linear-gradient(to right, #4f46e5, #6366f1, #0ea5e9)",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: ".04em",
            textDecoration: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          Back to analyzer
        </Link>
      </div>
    </main>
  );
}
