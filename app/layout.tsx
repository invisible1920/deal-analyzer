import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import { themeColors } from "@/app/theme";

export const metadata: Metadata = {
  title: "BHPH Deal Analyzer",
  description: "Quick BHPH deal analyzer with underwriting and history"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Force light app wide to match main page
  const colors = themeColors.light;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: colors.bg,
          color: colors.text,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif'
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #e2e8f0",
            background: "#020617",
            color: "#e5e7eb"
          }}
        >
          <TopNav />
        </header>

        <main style={{ minHeight: "100vh" }}>{children}</main>
      </body>
    </html>
  );
}
