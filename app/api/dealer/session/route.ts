import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Set the dealer_session cookie for the current user
  setSessionCookie();

  return NextResponse.json({ success: true });
}
