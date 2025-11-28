export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.DEALER_PASSWORD;

  if (!correct) {
    return NextResponse.json(
      { error: "Server missing DEALER_PASSWORD" },
      { status: 500 }
    );
  }

  if (password !== correct) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  setSessionCookie();

  return NextResponse.json({ success: true });
}
