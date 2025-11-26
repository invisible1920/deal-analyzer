// app/api/profile-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getMonthlyDealCountForUser,
  FREE_DEALS_PER_MONTH,
} from "@/lib/usage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId as string | undefined;

    if (!userId) {
      return NextResponse.json(
        {
          planType: null,
          dealsThisMonth: 0,
          freeDealsPerMonth: FREE_DEALS_PER_MONTH,
        },
        { status: 200 }
      );
    }

    let planType: "free" | "pro" = "free";
    let freeDealsPerMonth = FREE_DEALS_PER_MONTH;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("plan_type, free_deals_per_month")
      .eq("id", userId)
      .maybeSingle();

    if (!error && profile) {
      if (profile.plan_type === "pro") {
        planType = "pro";
      }
      if (
        typeof profile.free_deals_per_month === "number" &&
        !Number.isNaN(profile.free_deals_per_month)
      ) {
        freeDealsPerMonth = profile.free_deals_per_month;
      }
    }

    const dealsThisMonth = await getMonthlyDealCountForUser(userId);

    return NextResponse.json(
      {
        planType,
        dealsThisMonth,
        freeDealsPerMonth,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("profile-plan error", err);
    return NextResponse.json(
      {
        error: err?.message || "Internal error",
        planType: null,
        dealsThisMonth: 0,
        freeDealsPerMonth: FREE_DEALS_PER_MONTH,
      },
      { status: 500 }
    );
  }
}
