import { NextRequest, NextResponse } from "next/server";
import { createSignedDealerSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const signed = createSignedDealerSession();

  const res = NextResponse.json({ success: true });

  const weekInSeconds = 60 * 60 * 24 * 7;

  res.cookies.set({
    name: "dealer_session",
    value: signed,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: weekInSeconds,
    expires: new Date(Date.now() + weekInSeconds * 1000)
  });

  return res;
}
