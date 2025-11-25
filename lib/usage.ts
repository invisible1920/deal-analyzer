import { supabaseAdmin } from "./supabase";

export const FREE_DEALS_PER_MONTH = 25;

export async function getMonthlyDealCountForUser(
  userId: string | null
): Promise<number> {
  if (!userId) return 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { count, error } = await supabaseAdmin
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString())
    .lt("created_at", startOfNextMonth.toISOString());

  if (error) {
    console.error("Failed to count monthly deals", error);
    return 0;
  }

  return count ?? 0;
}
