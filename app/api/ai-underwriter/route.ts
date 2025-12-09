import { NextRequest, NextResponse } from "next/server";

const apiKey =
  process.env.OPENAI_API_KEY || process.env.PENAI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      console.warn("AI disabled: no API key for ai-underwriter");
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
    const termWeeks =
      typeof result.termWeeks === "number"
        ? result.termWeeks
        : typeof result.termInWeeks === "number"
        ? result.termInWeeks
        : null;

    const monthlyIncome =
      typeof form?.monthlyIncome === "number" ? form.monthlyIncome : null;
    const repoCount =
      typeof form?.repoCount === "number" ? form.repoCount : 0;

    const ptiPercent = pti !== null ? (pti * 100).toFixed(1) : "N A";
    const ltvPercent = ltv !== null ? (ltv * 100).toFixed(1) : "N A";

    const prompt = `
You are a seasoned BHPH finance director talking to another manager in the office about a deal that was just structured.

Talk like a human manager. Be clear, direct and dealership first. No AI disclaimers.

Deal snapshot:
- Weekly payment: $${payment.toFixed(2)}
- PTI: ${ptiPercent} percent
- LTV: ${ltvPercent} percent
- Term: ${termWeeks ?? "N A"} weeks
- Customer monthly income: ${monthlyIncome ?? "N A"}
- Prior repos: ${repoCount}
- Total profit: ${
      typeof result.totalProfit === "number"
        ? `$${result.totalProfit.toFixed(2)}`
        : "N A"
    }
- Break even week: ${
      typeof result.breakEvenWeek === "number"
        ? result.breakEvenWeek
        : "N A"
    }

Underwriting style:
1. Start with a clear verdict line, like "Verdict: approve as written", "Verdict: approve with some caution" or "Verdict: decline, structure is too hot".
2. Then write three to five sentences explaining how you see PTI, LTV, profit and repos on this structure.
3. Call out early pay risk in the first ninety days.
4. End with one decisive recommendation, such as "I would fund this as is", "I would want at least five hundred more down" or "I would pass on this structure with this history".

Output as one paragraph with line breaks where it feels natural. Do not mention that you are an AI or a model.
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
          temperature: 0.35,
          messages: [
            {
              role: "system",
              content:
                "You are a seasoned Buy Here Pay Here finance director and part owner. Speak like a human manager and focus on risk, profit and portfolio health."
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
      console.error("ai-underwriter error:", text);
      return NextResponse.json(
        { text: "AI error from underwriter." },
        { status: 200 }
      );
    }

    const json = await openaiRes.json();
    const content: string =
      json.choices?.[0]?.message?.content?.trim() ||
      "No AI response from underwriter.";

    return NextResponse.json({ text: content }, { status: 200 });
  } catch (err: any) {
    console.error("ai-underwriter exception:", err);
    return NextResponse.json(
      {
        text:
          "AI underwriter request failed: " +
          (err?.message || "Unknown error")
      },
      { status: 200 }
    );
  }
}
