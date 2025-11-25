import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveSettings, DealerSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<DealerSettings>;

    const required: (keyof DealerSettings)[] = [
      "dealerName",
      "defaultAPR",
      "maxPTI",
      "maxLTV",
      "minDownPayment",
      "maxTermWeeks"
    ];

    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 }
        );
      }
    }

    saveSettings(body as DealerSettings);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
