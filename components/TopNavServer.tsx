// components/TopNavServer.tsx
import { isAuthenticated } from "@/lib/auth";
import TopNav from "./TopNav";

export default function TopNavServer() {
  // server-side auth check using your HttpOnly dealer_session cookie
  const dealerLoggedIn = isAuthenticated();

  return <TopNav dealerLoggedIn={dealerLoggedIn} />;
}
