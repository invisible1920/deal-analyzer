import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const protectedPaths = ["/dealer/settings"];

  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get("dealer_session")?.value;

  if (!session) {
    const loginUrl = new URL("/dealer/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dealer/:path*"]
};
