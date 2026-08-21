import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const hint = String(body.hint || "").trim();
    const mode = body.mode === "article" ? "article" : "note";

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "XAI_API_KEY not configured on the server" },
        { status: 500 }
      );
    }

    const system =
      mode === "article"
        ? `You write for Thievn's Den — a dark, cynical, personal gaming site. Voice: blunt, human, short paragraphs, no corporate games-journalism. No hashtags. No emoji. Write 3-5 short paragraphs about the game or topic. Plain text only, paragraphs separated by blank lines.`
        : `You write one-liner takes for Thievn's Den. Blunt, cynical, human. 1-2 sentences max. No hashtags. No emoji. Plain text only.`;

    const user =
      mode === "article"
        ? `Title: ${title}\n${hint ? `Context: ${hint}\n` : ""}Write a short Den article body.`
        : `Title: ${title}\n${hint ? `Context: ${hint}\n` : ""}Write a short Den note.`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.9,
        max_tokens: mode === "article" ? 500 : 120,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("xAI gaming draft error:", response.status, errText);
      return NextResponse.json({ error: "Draft failed" }, { status: 502 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    if (mode === "article") {
      const note = text.split(/\n\n+/)[0]?.slice(0, 220) || text.slice(0, 220);
      return NextResponse.json({ body: text, note });
    }

    return NextResponse.json({ note: text, body: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Draft failed" }, { status: 500 });
  }
}
