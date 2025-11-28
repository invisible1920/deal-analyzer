"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";
import { useState, useEffect, type CSSProperties } from "react";

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await supabaseClient.auth.signOut();
      setUser(null);
      router.push("/login");
    } finally {
      // 🔥 ALWAYS reset after navigation
      setLoading(false);
    }
  }

  // 🔥 Extra safeguard: if user is null OR we are on the login page,
  // force loading=false
  useEffect(() => {
    if (!user || pathname === "/login") {
      setLoading(false);
    }
  }, [user, pathname]);

  const navStyle: CSSProperties = {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const linksStyle: CSSProperties = {
    display: "flex",
    gap: "16px",
    fontSize: "14px",
    alignItems: "center",
  };

  const linkStyle: CSSProperties = {
    color: "#e5e7eb",
    textDecoration: "none",
  };

  const secondaryLinkStyle: CSSProperties = {
    color: "#9ca3af",
    textDecoration: "none",
  };

  const userBoxStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#9ca3af",
  };

  const logoutButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#f97316",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
  };

  return (
    <nav style={navStyle}>
      <div style={{ fontWeight: 700, fontSize: "16px" }}>
        BHPH Deal Analyzer
      </div>

      <div style={linksStyle}>
        <Link href="/" style={linkStyle}>Analyzer</Link>
        <Link href="/history" style={secondaryLinkStyle}>History</Link>
        <Link href="/settings" style={secondaryLinkStyle}>Settings</Link>

        {loading ? (
          <span style={{ color: "#4b5563", fontSize: "12px" }}>
            Logging out...
          </span>
        ) : user ? (
          <div style={userBoxStyle}>
            <span>{user.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              style={logoutButtonStyle}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" style={secondaryLinkStyle}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
