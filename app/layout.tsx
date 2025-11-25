import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BHPH Deal Analyzer",
  description: "Quick BHPH deal analyzer with underwriting and history"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#020617", color: "#e5e7eb" }}>
        <header
          style={{
            borderBottom: "1px solid #111827",
            background: "#020617"
          }}
        >
          <nav
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "16px" }}>
              BHPH Deal Analyzer
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "14px"
              }}
            >
              <Link
                href="/"
                style={{
                  color: "#e5e7eb",
                  textDecoration: "none"
                }}
              >
                Analyzer
              </Link>
              <Link
                href="/history"
                style={{
                  color: "#9ca3af",
                  textDecoration: "none"
                }}
              >
                History
              </Link>
            </div>
          </nav>
        </header>
        <div>{children}</div>
      </body>
    </html>
  );
}
