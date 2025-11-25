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

export function setSessionCookie() {
  const secret = process.env.SESSION_SECRET!;
  const signed = sign("dealer", secret);

  cookies().set({
    name: SESSION_COOKIE,
    value: signed,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export function clearSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0
  });
}

export function isAuthenticated() {
  const secret = process.env.SESSION_SECRET!;
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return false;
  return verify(cookie, secret) === "dealer";
}
