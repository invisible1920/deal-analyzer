import { NextRequest, NextResponse } from "next/server";

const apiKey =
  process.env.OPENAI_API_KEY || process.env.PENAI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      console.warn("AI disabled: no API key for ai-closer-line");
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
    const termWeeks =
      typeof result.termWeeks === "number"
        ? result.termWeeks
        : typeof result.termInWeeks === "number"
        ? result.termInWeeks
        : null;
    const downPayment =
      typeof form?.downPayment === "number"
        ? form.downPayment
        : typeof result?.downPayment === "number"
        ? result.downPayment
        : null;

    const salePrice =
      typeof form?.salePrice === "number"
        ? form.salePrice
        : typeof result?.salePrice === "number"
        ? result.salePrice
        : null;

    const paymentFreq = form?.paymentFrequency || "weekly";

    const prompt = `
You are a BHPH desk manager writing a short closer line for a customer who is on the fence.

Deal snapshot:
- Payment: $${payment.toFixed(2)} ${paymentFreq}
- Term: ${termWeeks ?? "N A"} weeks
- Down payment today: ${
      downPayment !== null ? `$${downPayment.toFixed(0)}` : "N A"
    }
- Price: ${salePrice !== null ? `$${salePrice.toFixed(0)}` : "N A"}

Write something I can read word for word at the desk to close this structure or a very small tweak.

Rules:
1. Output two to three short sentences, no more.
2. Sound like a real finance or sales manager, not a robot.
3. Focus on the value of getting them approved today, being able to drive now, and keeping the payment where it fits.
4. You may gently frame a slightly stronger down payment as the way to keep the payment comfortable, but do not give a complicated lecture.

Output only the closer line, nothing else.
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
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content:
                "You are a seasoned BHPH closer. You speak in simple, confident lines that can be read right to a customer."
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
      console.error("ai-closer-line error:", text);
      return NextResponse.json(
        { text: "AI error from closer line." },
        { status: 200 }
      );
    }

    const json = await openaiRes.json();
    const content: string =
      json.choices?.[0]?.message?.content?.trim() ||
      "No AI closer line response.";

    return NextResponse.json({ text: content }, { status: 200 });
  } catch (err: any) {
    console.error("ai-closer-line exception:", err);
    return NextResponse.json(
      {
        text:
          "AI closer line request failed: " +
          (err?.message || "Unknown error")
      },
      { status: 200 }
    );
  }
}
