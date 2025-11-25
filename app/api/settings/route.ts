import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";

export async function GET(_req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = loadSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}
