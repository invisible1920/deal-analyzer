import { NextResponse } from "next/server";

const CARQUERY_BASE = "https://www.carqueryapi.com/api/0.3/";

// CarQuery returns JSONP like ?({...});
// this helper strips the wrapper and parses the JSON
async function carQueryFetch(params: Record<string, string | number>) {
  const url =
    CARQUERY_BASE +
    "?callback=?&" +
    new URLSearchParams(params as Record<string, string>).toString();

  const res = await fetch(url, { cache: "force-cache" });
  const text = await res.text();

  // Remove leading ?( and trailing );
  const jsonText = text
    .trim()
    .replace(/^\?\(/, "")
    .replace(/\);?$/, "");

  return JSON.parse(jsonText);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const makeId = searchParams.get("makeId");
  const modelName = searchParams.get("model");

  // 1) Years: build full range from min to max
  const yearsRes = await carQueryFetch({ cmd: "getYears" });
  const minYear = parseInt(yearsRes.Years.min_year, 10);
const apiMaxYear = parseInt(yearsRes.Years.max_year, 10);

// Hack: extend to the current year
const currentYear = new Date().getFullYear();
const maxYear = Math.max(apiMaxYear, currentYear);

const years: string[] = [];
for (let y = maxYear; y >= minYear; y -= 1) {
  years.push(String(y));
}


  // Defaults
  let makes: { id: string; name: string }[] = [];
  let models: string[] = [];
  let trims: string[] = [];

  // 2) Makes for selected year
  if (year) {
    const makesRes = await carQueryFetch({
      cmd: "getMakes",
      year,
      sold_in_us: 1,
    });

    makes =
      (makesRes.Makes || []).map((m: any) => ({
        id: m.make_id, // used for later API calls
        name: m.make_display as string, // pretty name for UI
      })) ?? [];
    makes.sort((a, b) => a.name.localeCompare(b.name));
  }

  // 3) Models for selected year + make
  if (year && makeId) {
    const modelsRes = await carQueryFetch({
      cmd: "getModels",
      year,
      make: makeId,
      sold_in_us: 1,
    });

    models =
      (modelsRes.Models || []).map(
        (m: any) => m.model_name as string
      ) ?? [];
    models.sort((a, b) => a.localeCompare(b));
  }

  // 4) Trims for selected year + make + model
  if (year && makeId && modelName) {
    const trimsRes = await carQueryFetch({
      cmd: "getTrims",
      year,
      make: makeId,
      model: modelName,
      sold_in_us: 1,
      full_results: 0,
    });

    trims =
      (trimsRes.Trims || [])
        .map((t: any) => t.model_trim as string)
        .filter((t: string) => t && t.trim().length > 0) ?? [];
    trims.sort((a, b) => a.localeCompare(b));
  }

  return NextResponse.json({
    years,
    makes,
    models,
    trims,
  });
}
