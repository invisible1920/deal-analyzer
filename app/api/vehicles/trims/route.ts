import { NextResponse } from "next/server";
import { TRIM_DICTIONARY } from "@/data/trimDictionary";

// Helper: Normalize keys like "Audi S5" → "AUDI_S5"
function keyify(make: string, model: string) {
  return `${make}_${model}`.toUpperCase().replace(/[^A-Z0-9_]/g, "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const make = searchParams.get("make");
  const model = searchParams.get("model");

  if (!make || !model) {
    return NextResponse.json({ trims: [] });
  }

  const dictionaryKey = keyify(make, model);

  // 1️⃣ First try OEM-style data from NHTSA (Vehicle Types)
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeModel/${make}/${model}?format=json`;
  
  let trims: string[] = [];

  try {
    const res = await fetch(url);
    const data = await res.json();

    trims =
      data.Results?.map((t: any) => t.VehicleTypeName)
        .filter(Boolean) ?? [];

    trims = trims.filter((t) => t && t.trim().length > 1);

  } catch (err) {
    // NHTSA failed — move on to dictionary
  }

  // 2️⃣ If NHTSA has nothing useful, use dictionary
  if (!trims.length) {
    const dict = TRIM_DICTIONARY[dictionaryKey];

    if (dict && dict.length) {
      trims = dict;
    }
  }

  // 3️⃣ If dictionary is missing, use generic fallback trims
  if (!trims.length) {
    trims = TRIM_DICTIONARY["_GENERIC"];
  }

  // 4️⃣ Clean duplicates
  trims = Array.from(new Set(trims));

  return NextResponse.json({ trims });
}
