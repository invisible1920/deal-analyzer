import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const make = searchParams.get("make");

  if (!year || !make) {
    return NextResponse.json(
      { error: "year and make are required" },
      { status: 400 }
    );
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
    make
  )}/modelyear/${encodeURIComponent(year)}?format=json`;

  const res = await fetch(url);
  const json = await res.json();

  const models = (json.Results || []).map(
    (item: any) => item.Model_Name
  ) as string[];

  return NextResponse.json({ models });
}
