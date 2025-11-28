import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth";

export default function AuthCallbackPage() {
  // Supabase has just redirected the browser here after Google SSO.
  // This runs on the server. We set the dealer_session cookie here.
  setSessionCookie();

  // Then immediately send the user into the dealer area (or "/" if you prefer).
  redirect("/dealer/settings");
}
