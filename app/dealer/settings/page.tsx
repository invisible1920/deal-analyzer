import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function DealerSettingsPage() {
  if (!isAuthenticated()) {
    redirect("/dealer/login");
  }

  return (
    <main style={{ padding: "24px", color: "white", background: "#020617", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Dealer Settings</h1>

      <p style={{ marginTop: "12px", color: "#9ca3af" }}>
        (Coming next — APR defaults, LTV policy, PTI limits, minimum down payment, etc)
      </p>
    </main>
  );
}
