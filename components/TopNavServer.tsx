// components/TopNavServer.tsx
import { isAuthenticated } from "@/lib/auth";
import TopNav from "./TopNav";

export default async function TopNavServer() {
  // server-side check, always correct, always up to date
  const dealerLoggedIn = isAuthenticated();

  return <TopNav dealerLoggedIn={dealerLoggedIn} />;
}
