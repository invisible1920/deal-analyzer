import { NextRequest, NextResponse } from "next/server";

const apiKey =
  process.env.OPENAI_API_KEY || process.env.PENAI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      console.warn("AI disabled: no API key for ai-risk-movie");
      return NextResponse.json(
        { text: "AI unavailable: missing API key." },
        { status: 200 }
      );
    }

    const body = await req.json();
    const { form, result } = body as {
      form: any;
      result: any;
    };

    if (!result) {
      return NextResponse.json(
        { text: "No deal result in request." },
        { status: 200 }
      );
    }

    const payment = typeof result.payment === "number" ? result.payment : 0;
    const pti =
      typeof result.paymentToIncome === "number"
        ? result.paymentToIncome
        : null;
    const ltv = typeof result.ltv === "number" ? result.ltv : null;

    const monthlyIncome =
      typeof form?.monthlyIncome === "number" ? form.monthlyIncome : null;
    const repoCount =
      typeof form?.repoCount === "number" ? form.repoCount : 0;

    const breakEvenWeek =
      typeof result.breakEvenWeek === "number"
        ? result.breakEvenWeek
        : null;

    const ptiPercent = pti !== null ? (pti * 100).toFixed(1) : "N A";
    const ltvPercent = ltv !== null ? (ltv * 100).toFixed(1) : "N A";

    const prompt = `
You are a BHPH portfolio manager describing the "twelve month movie" for this account.

Deal snapshot:
- Weekly payment: $${payment.toFixed(2)}
- PTI: ${ptiPercent} percent
- LTV: ${ltvPercent} percent
- Customer monthly income: ${monthlyIncome ?? "N A"}
- Prior repos: ${repoCount}
- Break even week: ${breakEvenWeek ?? "N A"}

Describe how this account is likely to behave over the first 12 months if we fund it.

Rules:
1. Output four to six short sentences.
2. Walk through months 1 to 3, 4 to 6, 7 to 12 in plain language.
3. Talk about payment behavior, likelihood of slow pays, contact needed and real charge off risk.
4. Mention how down, PTI, LTV and repos are shaping that risk.
5. End with one clear instruction to the store on how to protect itself on this note (for example GPS, closer follow up, stronger down, or just standard follow up).

Write as if you are talking to another owner reviewing the portfolio. Do not mention AI or that this is a prediction. Keep it real and dealership focused.
`.trim();

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.45,
          messages: [
            {
              role: "system",
              content:
                "You are a BHPH portfolio manager explaining how notes really behave over twelve months."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      console.error("ai-risk-movie error:", text);
      return NextResponse.json(
        { text: "AI error from risk movie." },
        { status: 200 }
      );
    }

    const json = await openaiRes.json();
    const content: string =
      json.choices?.[0]?.message?.content?.trim() ||
      "No AI risk movie response.";

    return NextResponse.json({ text: content }, { status: 200 });
  } catch (err: any) {
    console.error("ai-risk-movie exception:", err);
    return NextResponse.json(
      {
        text:
          "AI risk movie request failed: " +
          (err?.message || "Unknown error")
      },
      { status: 200 }
    );
  }
}
