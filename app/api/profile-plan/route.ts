import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("plan_type, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("profile-plan error", error);
    return NextResponse.json(
      { error: "Failed to load plan" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      plan_type: data?.plan_type ?? "free",
      subscription_status: data?.subscription_status ?? "none"
    },
    { status: 200 }
  );
}
