import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "dealer_session";

function sign(value: string, secret: string) {
  return value + "." +
    crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function verify(signedValue: string, secret: string) {
  const [value, signature] = signedValue.split(".");
  const expected = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return expected === signature ? value : null;
}

// Create a cookie value like: "auth.<signature>"
export function createSignedDealerSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return sign("auth", secret);
}

export function setSessionCookie() {
  const signed = createSignedDealerSession();
  if (!signed) return;

  cookies().set({
    name: SESSION_COOKIE,
    value: signed,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
}

// AUTH CHECK
export function isAuthenticated() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return false;

  try {
    return verify(cookie, secret) === "auth";
  } catch {
    return false;
  }
}
