"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type UserInfo = {
  id: string;
  email: string;
} | null;

export default function TopNav({
  dealerLoggedIn,
}: {
  dealerLoggedIn: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>(null);

  useEffect(() => {
    // Load Supabase user ONLY for email display / Google login
    async function loadUser() {
      const { data } = await supabaseClient.auth.getUser();
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? "",
        });
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    // sign out supabase
    await supabaseClient.auth.signOut();

    // clear UI
    setUser(null);

    // redirect to dealer login
    router.push("/dealer/login");
  }

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
      <div style={{ fontWeight: 700, fontSize: "16px" }}>BHPH Deal Analyzer</div>

      <div style={linksStyle}>
        <Link href="/" style={linkStyle}>
          Analyzer
        </Link>
        <Link href="/history" style={secondaryLinkStyle}>
          History
        </Link>
        <Link href="/settings" style={secondaryLinkStyle}>
          Settings
        </Link>

        {dealerLoggedIn ? (
          <div style={userBoxStyle}>
            <span>{user?.email ?? "Dealer"}</span>
            <button
              type="button"
              onClick={handleLogout}
              style={logoutButtonStyle}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/dealer/login" style={secondaryLinkStyle}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
