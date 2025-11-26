import { supabaseAdmin } from "./supabase";

export type SavedDealInput = {
  userId: string | null;
  input: {
    vehicleCost: number;
    reconCost: number;
    salePrice: number;
    downPayment: number;
    apr: number;
    termWeeks: number;
    paymentFrequency: "monthly" | "biweekly" | "weekly";
    monthlyIncome: number | null;
    monthsOnJob: number | null;
    pastRepo: boolean;
  };
  result: {
    payment: number;
    totalInterest: number;
    totalProfit: number;
    breakEvenWeek: number;
    paymentToIncome: number | null;
    ltv: number;
    riskScore: string;
    underwritingVerdict: string;
    underwritingReasons: string[];
    aiExplanation?: string;
  };
};

export type SavedDeal = SavedDealInput & {
  id: string;
  createdAt: string;
};

export async function saveDeal(payload: SavedDealInput): Promise<void> {
  const { error } = await supabaseAdmin.from("deals").insert({
    user_id: payload.userId,
    input: payload.input,
    result: payload.result
  });

  if (error) {
    console.error("Failed to save deal to Supabase", error);
    throw new Error(error.message);
  }
}

export async function listDeals(
  userId?: string,
  limit = 50
): Promise<SavedDeal[]> {
  let query = supabaseAdmin
    .from("deals")
    .select("id, created_at, user_id, input, result")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to list deals from Supabase", error);
    throw new Error(error.message);
  }

  if (!data) return [];

  return data.map(
    (row: any): SavedDeal => ({
      id: row.id as string,
      createdAt: row.created_at as string,
      userId: (row.user_id as string | null) ?? null,
      input: row.input,
      result: row.result
    })
  );
}

export async function getDealById(id: string): Promise<SavedDeal | null> {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id, created_at, user_id, input, result")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch deal by id from Supabase", error);
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id as string,
    createdAt: data.created_at as string,
    userId: (data.user_id as string | null) ?? null,
    input: data.input,
    result: data.result
  } as SavedDeal;
}
