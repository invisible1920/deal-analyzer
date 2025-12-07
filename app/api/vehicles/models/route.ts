import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const year = searchParams.get("year");
  const make = searchParams.get("make");

  if (!year || !make) {
    return NextResponse.json({ models: [] });
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${make}/modelyear/${year}?format=json`;

  const res = await fetch(url);
  const data = await res.json();

  const models =
    data.Results?.map((m: any) => m.Model_Name) || [];

  models.sort((a: string, b: string) => a.localeCompare(b));

  return NextResponse.json({ models });
}
