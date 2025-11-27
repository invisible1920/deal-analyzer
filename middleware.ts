import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const SESSION_COOKIE = "dealer_session";

function verifySessionCookie(raw: string | undefined): boolean {
  if (!raw) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const [value, signature] = raw.split(".");
  if (!value || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");

  // value should be "dealer" because that is what you sign in setSessionCookie
  return value === "dealer" && expected === signature;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const protectedPaths = ["/dealer/settings"];

  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE)?.value;

  if (!verifySessionCookie(session)) {
    const loginUrl = new URL("/dealer/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dealer/:path*"]
};
