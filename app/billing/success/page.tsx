"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SuccessPageProps = {
  searchParams: {
    session_id?: string;
  };
};

export default function BillingSuccessPage({ searchParams }: SuccessPageProps) {
  const [sessionId] = useState<string | undefined>(searchParams.session_id);

  useEffect(() => {
    // Optional: you could call an API route here to verify the session
    // and refresh the user profile, but your webhook should already
    // upgrade the plan on checkout.session.completed.
  }, [sessionId]);

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
          Pro plan activated (test mode)
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#9ca3af",
            marginBottom: 16,
          }}
        >
          Thank you for your payment. Your BHPH Deal Analyzer account will now
          have Pro access with unlimited deal analyses and advanced AI
          underwriting.
        </p>

        {sessionId && (
          <p
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 16,
              wordBreak: "break-all",
            }}
          >
            Stripe session: <span style={{ fontFamily: "monospace" }}>{sessionId}</span>
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
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

          <Link
            href="/settings"
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid #374151",
              background: "transparent",
              color: "#e5e7eb",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View account settings
          </Link>
        </div>
      </div>
    </main>
  );
}
