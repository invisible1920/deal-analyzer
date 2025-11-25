import { supabaseAdmin } from "./supabase";
import { loadSettings, type DealerSettings } from "./settings";

type DealerSettingsRow = {
  dealer_name: string | null;
  default_apr: number | null;
  max_pti: number | null;
  max_ltv: number | null;
  min_down_payment: number | null;
  max_term_weeks: number | null;
};

export async function resolveDealerSettings(
  userId: string | null | undefined
): Promise<DealerSettings> {
  const fallback = loadSettings();

  if (!userId) {
    return fallback;
  }

  const { data, error } = await supabaseAdmin
    .from("dealer_settings")
    .select(
      "dealer_name, default_apr, max_pti, max_ltv, min_down_payment, max_term_weeks"
    )
    .eq("user_id", userId)
    .maybeSingle<DealerSettingsRow>();

  if (error || !data) {
    if (error) {
      console.warn("resolveDealerSettings error, using fallback", error.message);
    }
    return fallback;
  }

  return {
    dealerName: data.dealer_name ?? fallback.dealerName,
    defaultAPR: Number(
      data.default_apr !== null ? data.default_apr : fallback.defaultAPR
    ),
    maxPTI: Number(
      data.max_pti !== null ? data.max_pti : fallback.maxPTI
    ),
    maxLTV: Number(
      data.max_ltv !== null ? data.max_ltv : fallback.maxLTV
    ),
    minDownPayment: Number(
      data.min_down_payment !== null
        ? data.min_down_payment
        : fallback.minDownPayment
    ),
    maxTermWeeks: Number(
      data.max_term_weeks !== null
        ? data.max_term_weeks
        : fallback.maxTermWeeks
    )
  };
}
