import type { Metadata, Viewport } from "next";
import TopNav from "@/components/TopNav";
import DealerSessionBootstrap from "@/components/DealerSessionBootstrap";
import { AuthProvider } from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "BHPH Deal Analyzer",
  description: "Quick BHPH deal analyzer with underwriting and history",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      style={{
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <body
        style={{
          margin: 0,
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, Roboto, sans-serif',
          maxWidth: "100vw",
          overflowX: "hidden",
        }}
      >
        {/* PROVIDER WRAPS YOUR ENTIRE APP */}
        <AuthProvider>
          {/* keeps dealer_session synced with Supabase session */}
          <DealerSessionBootstrap />

          <header
            style={{
              borderBottom: "1px solid #e2e8f0",
              background: "#020617",
              color: "#e5e7eb",
            }}
          >
            {/* TopNav must remain client component */}
            <TopNav />
          </header>

          <main
            style={{
              minHeight: "100vh",
              maxWidth: "100vw",
              overflowX: "hidden",
            }}
          >
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
