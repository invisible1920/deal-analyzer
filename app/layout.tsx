import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import DealerSessionBootstrap from "@/components/DealerSessionBootstrap";

export const metadata: Metadata = {
  title: "BHPH Deal Analyzer",
  description: "Quick BHPH deal analyzer with underwriting and history",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif',
        }}
      >
        {/* optional: keeps dealer_session in sync based on Supabase session */}
        <DealerSessionBootstrap />

        <header
          style={{
            borderBottom: "1px solid #e2e8f0",
            background: "#020617",
            color: "#e5e7eb",
          }}
        >
          {/* use the client TopNav directly */}
          <TopNav />
        </header>

        <main style={{ minHeight: "100vh" }}>{children}</main>
      </body>
    </html>
  );
}
