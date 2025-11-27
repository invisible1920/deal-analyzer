import type { Metadata } from "next";
import TopNav from "@/components/TopNav";

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
          backgroundColor: "#f8fafc", // light background everywhere
          color: "#0f172a",           // dark text by default
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif',
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #e2e8f0",
            background: "#020617",   // dark nav bar is fine
            color: "#e5e7eb",
          }}
        >
          <TopNav />
        </header>

        <main style={{ minHeight: "100vh" }}>{children}</main>
      </body>
    </html>
  );
}
