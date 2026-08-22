import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const a = String(body.a || "").slice(0, 240);
    const b = String(body.b || "").slice(0, 240);
    const picked = body.picked === "b" ? b : a;
    const other = body.picked === "b" ? a : b;
    if (!a || !b) {
      return NextResponse.json({ error: "Missing pair" }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ line: "" });
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [
          {
            role: "system",
            content:
              "One short human line for Thievn's Den. Honest, not forced-mean. No hashtags. No emoji. Max 22 words.",
          },
          {
            role: "user",
            content: `They picked: ${picked}\nInstead of: ${other}\nClock them in one line.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 60,
      }),
    });

    if (!res.ok) return NextResponse.json({ line: "" });
    const data = await res.json();
    const line = data.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ line });
  } catch {
    return NextResponse.json({ line: "" });
  }
}
