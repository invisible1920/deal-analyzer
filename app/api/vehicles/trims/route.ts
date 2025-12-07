import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const make = searchParams.get("make");
  const model = searchParams.get("model");

  if (!make || !model) {
    return NextResponse.json({ trims: [] });
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeModel/${make}/${model}?format=json`;

  const res = await fetch(url);
  const data = await res.json();

  // Fake trims from model variants
  const trims =
    data.Results?.map((t: any) => t.VehicleTypeName)
      .filter(Boolean) || [];

  const uniqueTrims = Array.from(new Set(trims));

  return NextResponse.json({ trims: uniqueTrims });
}
