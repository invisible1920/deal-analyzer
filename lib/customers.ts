// lib/customers.ts
import { supabaseAdmin } from "./supabase";

export async function getCustomerRunCountThisMonth(
  customerId: string
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc(
    "count_customer_deals_this_month",
    { customer_id_in: customerId }
  );
  if (error || !data) return 0;
  return data as number;
}
