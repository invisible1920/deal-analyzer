import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");

  if (!year) {
    return NextResponse.json({ makes: [] });
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`;

  const res = await fetch(url);
  const data = await res.json();

  const makes =
    data.Results?.map((m: any) => ({
      id: m.MakeId,
      name: m.MakeName,
    })) || [];

  makes.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return NextResponse.json({ makes });
}
