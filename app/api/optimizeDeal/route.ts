// app/api/optimizeDeal/route.ts

import { NextResponse } from "next/server";

// Temporary stub endpoint.
// Your main analysis + profit optimization now lives in /api/analyzeDeal,
// which already returns profitOptimizer.variants for Pro users.
export async function POST(req: Request) {
  return NextResponse.json(
    {
      error:
        "The /api/optimizeDeal endpoint is not implemented. Use /api/analyzeDeal, which already returns profitOptimizer variants.",
    },
    { status: 501 }
  );
}
