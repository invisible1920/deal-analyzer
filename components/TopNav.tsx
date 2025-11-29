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

  // detect mobile
  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  async function handleLogout() {
    try {
      setLoading(true);

      await supabaseClient.auth.signOut();
      setUser(null);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || pathname === "/login") {
      setLoading(false);
    }
  }, [user, pathname]);

  // ----------- FIXED RESPONSIVE NAV -----------
  const navStyle: CSSProperties = {
    maxWidth: "100%",
    width: "100%",
    margin: "0 auto",
    padding: isMobile ? "10px 16px" : "12px 24px",
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: "space-between",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? "10px" : "0px",
    boxSizing: "border-box",
    overflowX: "hidden",
  };

  const linksStyle: CSSProperties = {
    display: "flex",
    flexWrap: isMobile ? "wrap" : "nowrap",
    gap: isMobile ? "12px" : "16px",
    fontSize: isMobile ? "13px" : "14px",
    alignItems: "center",
    width: isMobile ? "100%" : "auto",
  };

  const linkStyle: CSSProperties = {
    color: "#e5e7eb",
    textDecoration: "none",
    lineHeight: 1.4,
    whiteSpace: isMobile ? "normal" : "nowrap",
  };

  const secondaryLinkStyle: CSSProperties = {
    color: "#9ca3af",
    textDecoration: "none",
    lineHeight: 1.4,
    whiteSpace: isMobile ? "normal" : "nowrap",
  };

  const userBoxStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: isMobile ? "12px" : "13px",
    color: "#9ca3af",
    flexWrap: isMobile ? "wrap" : "nowrap",
    lineHeight: 1.3,
    maxWidth: isMobile ? "100%" : "none",
  };

  const logoutButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#f97316",
    cursor: "pointer",
    fontSize: isMobile ? "12px" : "13px",
    padding: 0,
  };

  const titleStyle: CSSProperties = {
    fontWeight: 700,
    fontSize: isMobile ? "15px" : "16px",
    whiteSpace: "nowrap",
  };

  return (
    <nav style={navStyle}>
      <div style={titleStyle}>BHPH Deal Analyzer</div>

      <div style={linksStyle}>
        <Link href="/" style={linkStyle}>Analyzer</Link>
        <Link href="/history" style={secondaryLinkStyle}>History</Link>
        <Link href="/settings" style={secondaryLinkStyle}>Settings</Link>

        {loading ? (
          <span style={{ color: "#4b5563", fontSize: isMobile ? "11px" : "12px" }}>
            Logging out...
          </span>
        ) : user ? (
          <div style={userBoxStyle}>
            <span>{user.email}</span>
            <button type="button" onClick={handleLogout} style={logoutButtonStyle}>
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
