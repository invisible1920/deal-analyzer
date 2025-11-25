import type { Metadata } from "next";
import TopNav from "@/components/TopNav";

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
          <TopNav />
        </header>
        <div>{children}</div>
      </body>
    </html>
  );
}
