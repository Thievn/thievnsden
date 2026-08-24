import { NextRequest, NextResponse } from "next/server";
import { EMOTE_PACKS, SIGNOFFS, X_OUTLOOKS } from "@/lib/x-thoughts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const seed = String(body.seed || "").trim();
    const source = String(body.source || "").trim();
    const outlook = X_OUTLOOKS.find((o) => o.id === body.outlook)?.id || "honest";
    const pack = EMOTE_PACKS.find((p) => p.id === body.pack) || EMOTE_PACKS[0];
    const sign = SIGNOFFS.find((s) => s.id === body.signoff) || SIGNOFFS[0];
    const tweak = String(body.tweak || "fresh");
    const existing = String(body.existing || "").trim();

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const system = `You write posts for the X account @Thievn / Thievn's Den.
Voice: human, short, adult-ok, not a brand intern. No hashtags. No URLs. No http. No thievnsden. No @mentions unless in the seed.
Format: 1-4 short lines. Max 260 characters BEFORE the sign-off.
Emotes: use at most 2 from this set only: ${pack.emotes || "(none — use zero emotes)"}. Never use 👇.
Outlook: ${outlook}.
Do not add a call to action except we will append a sign-off separately. Do not write "link in bio" yourself.
Return plain text only.`;

    let user = "";
    if (tweak !== "fresh" && existing) {
      user = `Rewrite this X post. Tweak: ${tweak === "shorter" ? "cut it down" : tweak === "meaner" ? "sharper / meaner" : "softer, still honest"}. Keep the idea.\n\n${existing}`;
    } else if (source) {
      user = `Turn this essay into one X post. Keep the charge, lose the length.\n\nTitle/excerpt/body:\n${source.slice(0, 1800)}`;
    } else {
      user = seed || "Write one Den thought as an X post. Everyday human mess. Not generic quotes.";
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
        temperature: tweak === "fresh" ? 0.95 : 0.7,
        max_tokens: 220,
      }),
    });
    const text = await response.text();
    if (!response.ok) return NextResponse.json({ error: text.slice(0, 220) || "Draft failed" }, { status: 502 });
    const data = JSON.parse(text);
    let post = String(data.choices?.[0]?.message?.content || "").trim();
    post = post.replace(/https?:\/\/\S+/gi, "").replace(/thievnsden\.com/gi, "").trim();
    if (sign.line) post = `${post.replace(/\s+$/, "")}\n\n${sign.line}`;
    if (post.length > 280) post = post.slice(0, 277).trimEnd() + "…";
    return NextResponse.json({ post, chars: post.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Draft failed" }, { status: 500 });
  }
}
