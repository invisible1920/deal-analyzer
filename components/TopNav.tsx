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
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 768);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleLogout() {
    try {
      setLoading(true);
      await supabaseClient.auth.signOut();
      setUser(null);
      setMenuOpen(false);
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

  const navStyle: CSSProperties = {
    width: "100%",
    padding: "12px 24px",
    boxSizing: "border-box",
    backgroundColor: "transparent",
  };

  const titleStyle: CSSProperties = {
    fontWeight: 700,
    fontSize: isMobile ? "15px" : "16px",
    whiteSpace: "nowrap",
    color: "#f9fafb",
  };

  const linkStyle: CSSProperties = {
    color: "#e5e7eb",
    textDecoration: "none",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  };

  const secondaryLinkStyle: CSSProperties = {
    color: "#9ca3af",
    textDecoration: "none",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  };

  const userBoxStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#9ca3af",
    whiteSpace: "nowrap",
  };

  const emailStyle: CSSProperties = {
    maxWidth: 260,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const logoutButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#f97316",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
  };

  const leftSectionStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    minWidth: 0,
  };

  const desktopLinksStyle: CSSProperties = {
    display: "flex",
    gap: "16px",
    fontSize: "14px",
    alignItems: "center",
  };

  const mobileTopRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  };

  const mobileMenuButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: "22px",
    cursor: "pointer",
    padding: 4,
    lineHeight: 1,
  };

  const mobileMenuStyle: CSSProperties = {
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid rgba(148, 163, 184, 0.4)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: "14px",
  };

  const isCurrentPath = (href: string) => pathname === href;

  const getPrimaryLinkStyle = (href: string): CSSProperties =>
    isCurrentPath(href)
      ? { ...linkStyle, color: "#ffffff", fontWeight: 600 }
      : linkStyle;

  const getSecondaryLinkStyle = (href: string): CSSProperties =>
    isCurrentPath(href)
      ? { ...secondaryLinkStyle, color: "#ffffff", fontWeight: 600 }
      : secondaryLinkStyle;

  // mobile layout
  if (isMobile) {
    return (
      <nav style={{ ...navStyle, padding: "10px 16px" }}>
        <div style={mobileTopRowStyle}>
          <div style={titleStyle}>BHPH Deal Analyzer</div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            style={mobileMenuButtonStyle}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div style={mobileMenuStyle}>
            <Link
              href="/"
              style={getPrimaryLinkStyle("/")}
              onClick={() => setMenuOpen(false)}
            >
              Analyzer
            </Link>
            <Link
              href="/market-pricing"
              style={getPrimaryLinkStyle("/market-pricing")}
              onClick={() => setMenuOpen(false)}
            >
              Market pricing and LTV
            </Link>
            <Link
              href="/history"
              style={getSecondaryLinkStyle("/history")}
              onClick={() => setMenuOpen(false)}
            >
              History
            </Link>
            <Link
              href="/settings"
              style={getSecondaryLinkStyle("/settings")}
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>

            {loading ? (
              <span style={{ color: "#4b5563", fontSize: "12px" }}>
                Logging out...
              </span>
            ) : user ? (
              <div
                style={{
                  ...userBoxStyle,
                  flexDirection: "column",
                  alignItems: "flex-start",
                  whiteSpace: "normal",
                }}
              >
                <span style={{ fontSize: "12px", wordBreak: "break-all" }}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{ ...logoutButtonStyle, fontSize: "12px" }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                style={secondaryLinkStyle}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </nav>
    );
  }

  // desktop layout
  return (
    <nav
      style={{
        ...navStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={leftSectionStyle}>
        <div style={titleStyle}>BHPH Deal Analyzer</div>
        <div style={desktopLinksStyle}>
          <Link href="/" style={getPrimaryLinkStyle("/")}>
            Analyzer
          </Link>
          <Link
            href="/market-pricing"
            style={getPrimaryLinkStyle("/market-pricing")}
          >
            Market pricing and LTV
          </Link>
          <Link href="/history" style={getSecondaryLinkStyle("/history")}>
            History
          </Link>
          <Link href="/settings" style={getSecondaryLinkStyle("/settings")}>
            Settings
          </Link>
        </div>
      </div>

      {loading ? (
        <span style={{ color: "#4b5563", fontSize: "12px" }}>
          Logging out...
        </span>
      ) : user ? (
        <div style={userBoxStyle}>
          <span style={emailStyle}>{user.email}</span>
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
    </nav>
  );
}
