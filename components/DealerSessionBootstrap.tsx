"use client";

import { useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function DealerSessionBootstrap() {
  useEffect(() => {
    let cancelled = false;

    async function ensureDealerSessionCookie() {
      // Check if the user is logged in with Supabase
      const { data, error } = await supabaseClient.auth.getSession();
      if (error || !data.session) return; // not logged in, nothing to do

      try {
        // Ask the server to set dealer_session (idempotent)
        await fetch("/api/dealer/session", {
          method: "POST",
          credentials: "include"
        });
      } catch {
        // swallow errors – worst case, the cookie is not set
      }
    }

    ensureDealerSessionCookie();

    return () => {
      cancelled = true;
    };
  }, []);

  // This renders nothing in the UI
  return null;
}
