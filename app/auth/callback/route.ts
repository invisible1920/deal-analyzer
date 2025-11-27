import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // At this point Supabase has redirected back after Google SSO.
  // We set our dealer_session cookie so middleware will treat the user as logged in.
  setSessionCookie();

  // Redirect wherever you want the user to land after SSO
  const url = new URL("/", req.url);
  return NextResponse.redirect(url);
}
