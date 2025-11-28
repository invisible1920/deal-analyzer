export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";

// This endpoint now supports ALL users via Supabase auth.
// Supabase does the real authentication.
// This route ONLY sets your app-specific session cookie.
export async function POST() {
  // Create your secure dealer_session cookie
  setSessionCookie();

  return NextResponse.json({ success: true });
}
