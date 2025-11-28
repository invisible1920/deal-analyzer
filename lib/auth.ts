import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "dealer_session";

function sign(value: string, secret: string) {
  return (
    value +
    "." +
    crypto.createHmac("sha256", secret).update(value).digest("hex")
  );
}

function verify(signedValue: string, secret: string) {
  const [value, signature] = signedValue.split(".");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");
  return expected === signature ? value : null;
}

/**
 * Helper used by the API route (and callback page) to get the signed cookie value.
 * This is defensive: if SESSION_SECRET is missing, we just return null instead of throwing.
 */
export function createSignedDealerSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail soft: do not crash the request if env is misconfigured.
    // You can log if you want:
    // console.error("SESSION_SECRET is not set; skipping dealer_session cookie");
    return null;
  }
  return sign("dealer", secret);
}

/**
 * Sets the dealer_session cookie for the current response.
 * If there is no secret or signing fails, this becomes a no-op instead of throwing.
 */
export function setSessionCookie() {
  const signed = createSignedDealerSession();
  if (!signed) {
    // No secret / could not sign – skip setting the cookie.
    return;
  }

  cookies().set({
    name: SESSION_COOKIE,
    value: signed,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // secure in prod, relaxed in dev
    sameSite: "lax",
    path: "/", // send cookie on all routes
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

/**
 * Safe auth check: never throws. If anything is off, returns false.
 */
export function isAuthenticated() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return false;

  try {
    return verify(cookie, secret) === "dealer";
  } catch {
    return false;
  }
}
