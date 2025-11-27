"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { themeColors } from "@/app/theme";
import PageContainer from "@/components/PageContainer";

export default function AuthCallbackPage() {
  const router = useRouter();
  const colors = themeColors.light;

  useEffect(() => {
    // Supabase stores the session in local storage on redirect
    // we just move the user into the app
    const timeout = setTimeout(() => {
      router.replace("/");
    }, 600);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        display: "flex",
        alignItems: "center",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
      }}
    >
      <PageContainer>
        <div
          style={{
            maxWidth: 420,
            margin: "0 auto",
            padding: 24,
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            background: colors.panel,
            textAlign: "center",
            boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)"
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 8,
              letterSpacing: "-0.02em"
            }}
          >
            Finishing sign in
          </h1>
          <p
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 4
            }}
          >
            One moment while we connect your dealer account.
          </p>
        </div>
      </PageContainer>
    </main>
  );
}
