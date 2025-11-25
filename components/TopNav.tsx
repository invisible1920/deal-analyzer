"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type UserInfo = {
  id: string;
  email: string;
} | null;

export default function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabaseClient.auth.getUser();
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? ""
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    setUser(null);
    router.push("/login");
  }

  const navStyle: CSSProperties = {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  const linksStyle: CSSProperties = {
    display: "flex",
    gap: "16px",
    fontSize: "14px",
    alignItems: "center"
  };

  const linkStyle: CSSProperties = {
    color: "#e5e7eb",
    textDecoration: "none"
  };

  const secondaryLinkStyle: CSSProperties = {
    color: "#9ca3af",
    textDecoration: "none"
  };

  const userBoxStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#9ca3af"
  };

  const logoutButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#f97316",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0
  };

  return (
    <nav style={navStyle}>
      <div style={{ fontWeight: 700, fontSize: "16px" }}>
        BHPH Deal Analyzer
      </div>
      <div style={linksStyle}>
        <Link href="/" style={linkStyle}>
          Analyzer
        </Link>
        <Link href="/history" style={secondaryLinkStyle}>
          History
        </Link>

        {/* Right side auth area */}
        {loading ? (
          <span style={{ color: "#4b5563", fontSize: "12px" }}>Checking...</span>
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
