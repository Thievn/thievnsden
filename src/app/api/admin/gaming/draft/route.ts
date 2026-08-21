import { NextRequest, NextResponse } from "next/server";

type Tone = "den" | "positive" | "critical" | "balanced" | "hype";

const TONE_GUIDE: Record<Tone, string> = {
  den: `Default Den voice: honest and human. Can be positive, critical, or mixed — match the subject. No forced negativity. No corporate games-journalism. Short paragraphs. Sound like a real person writing for a personal site called Thievn's Den.`,
  positive: `Lean positive. Call out what works and why it's worth time. Still honest — no empty hype or press-release language.`,
  critical: `Lean critical. Focus on problems, friction, and fatigue. Still specific and fair — not pure ragebait.`,
  balanced: `Give both sides. What works and what doesn't. Keep it short and human.`,
  hype: `Genuinely excited. Energy is allowed. Still sound human, not like a trailer caption.`,
};

function normalizeTone(raw: unknown): Tone {
  const t = String(raw || "den").toLowerCase();
  if (t in TONE_GUIDE) return t as Tone;
  return "den";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const hint = String(body.hint || "").trim();
    const pulse = String(body.pulse || "").trim();
    const existing = String(body.existing || "").trim();
    const mode = body.mode === "article" ? "article" : body.mode === "rewrite" ? "rewrite" : "note";
    const tone = normalizeTone(body.tone);

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

    const base = `You write for Thievn's Den — a personal gaming site. ${TONE_GUIDE[tone]} No hashtags. No emoji. Plain text only.`;

    let system = base;
    let user = "";

    if (mode === "rewrite" && existing) {
      system += ` Rewrite the provided text in the requested tone. Keep roughly the same length and facts.`;
      user = `Title: ${title}\nTone: ${tone}\n\nText to rewrite:\n${existing}`;
    } else if (mode === "article") {
      system += ` Write 3-5 short paragraphs. Separate paragraphs with blank lines.`;
      user = `Title: ${title}\nTone: ${tone}\n${hint ? `Meta/context: ${hint}\n` : ""}${pulse ? `Community pulse / what people are saying (use this, don't invent a different consensus):\n${pulse}\n` : ""}Write a short Den article body.`;
    } else {
      system += ` Write 1-2 sentences max for a card blurb.`;
      user = `Title: ${title}\nTone: ${tone}\n${hint ? `Meta/context: ${hint}\n` : ""}${pulse ? `Community pulse:\n${pulse}\n` : ""}Write a short Den note.`;
    }

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
        temperature: 0.85,
        max_tokens: mode === "note" ? 120 : 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("xAI gaming draft error:", response.status, errText);
      return NextResponse.json({ error: "Draft failed" }, { status: 502 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    if (mode === "note") {
      return NextResponse.json({ note: text, body: text, tone });
    }

    const note = text.split(/\n\n+/)[0]?.slice(0, 220) || text.slice(0, 220);
    return NextResponse.json({ body: text, note, tone });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Draft failed" }, { status: 500 });
  }
}
