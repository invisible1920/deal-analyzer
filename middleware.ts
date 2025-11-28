import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "dealer_session";

// Protect ALL routes under /dealer/*
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtected = path.startsWith("/dealer");

  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE)?.value;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dealer/:path*"]
};
