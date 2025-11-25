import { supabaseAdmin } from "./supabase";

export type SavedDealInput = {
  input: {
    vehicleCost: number;
    reconCost: number;
    salePrice: number;
    downPayment: number;
    apr: number;
    termWeeks: number;
    paymentFrequency: "weekly" | "biweekly";
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
    input: payload.input,
    result: payload.result
  });

  if (error) {
    console.error("Failed to save deal to Supabase", error);
    throw new Error(error.message);
  }
}

export async function listDeals(limit = 50): Promise<SavedDeal[]> {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id, created_at, input, result")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to list deals from Supabase", error);
    throw new Error(error.message);
  }

  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    input: row.input,
    result: row.result
  }));
}
