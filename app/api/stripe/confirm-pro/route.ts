import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { FREE_DEALS_PER_MONTH } from "@/lib/usage";
import { loadSettings } from "@/lib/settings";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20"
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body.sessionId as string | undefined;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    // 1) Load Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const userId = session.metadata?.supabase_user_id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Stripe session missing supabase_user_id metadata" },
        { status: 400 }
      );
    }

    // 2) Ensure profiles row exists and set plan_type = pro
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          plan_type: "pro",
          free_deals_per_month: 1_000_000
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("confirm-pro upsert profiles error", profileError.message);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // 3) Ensure dealer_settings row exists with defaults from dealer.json
    const defaults = loadSettings();

    const { error: dealerError } = await supabaseAdmin
      .from("dealer_settings")
      .upsert(
        {
          user_id: userId,
          dealer_name: defaults.dealerName,
          default_apr: defaults.defaultAPR,
          max_pti: defaults.maxPTI,
          max_ltv: defaults.maxLTV,
          min_down_payment: defaults.minDownPayment,
          max_term_weeks: defaults.maxTermWeeks
        },
        { onConflict: "user_id" }
      );

    if (dealerError) {
      console.error(
        "confirm-pro upsert dealer_settings error",
        dealerError.message
      );
      // We still return ok for the profile, but include the message
      return NextResponse.json(
        { ok: true, dealerSettingsError: dealerError.message },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("confirm-pro error", err);
    return NextResponse.json(
      { error: err?.message || "Stripe confirm-pro error" },
      { status: 500 }
    );
  }
}
