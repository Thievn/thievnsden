import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { TOPICS } from "@/lib/thoughts-packs";
import { EMOTE_PACKS, SIGNOFFS, X_HEATS, X_LENGTHS, X_OUTLOOKS, X_PREMIUM_CAP } from "@/lib/x-thoughts";

async function recentPostedLines() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("x_posts")
      .select("body,posted_at")
      .order("posted_at", { ascending: false })
      .limit(12);
    const lines = (data || [])
      .map((row) => String(row.body || "").replace(/\s+/g, " ").trim().slice(0, 220))
      .filter(Boolean);
    if (!lines.length) return "";
    return `\nAlready posted — do not repeat these ideas:\n${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}`;
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const seed = String(body.seed || "").trim();
    const source = String(body.source || "").trim();
    const outlook = X_OUTLOOKS.find((o) => o.id === body.outlook)?.id || "honest";
    const heat = X_HEATS.find((h) => h.id === body.heat)?.label || "Sharp";
    const topic = TOPICS.find((t) => t.id === body.topic);
    const pack = EMOTE_PACKS.find((p) => p.id === body.pack) || EMOTE_PACKS[0];
    const sign = SIGNOFFS.find((s) => s.id === body.signoff) || SIGNOFFS[0];
    const length = X_LENGTHS.find((l) => l.id === body.length) || X_LENGTHS[1];
    const tweak = String(body.tweak || "fresh");
    const existing = String(body.existing || "").trim();

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const posted = await recentPostedLines();
    const system = `You write posts for the X account @Thievn / Thievn's Den. X Premium — long posts allowed.
Voice: human, adult-ok, not a brand intern. No hashtags. No URLs. No http. No thievnsden. No @mentions unless in the seed. Never use 👇.
Aim for about ${length.target} characters before the sign-off. Hard max ${X_PREMIUM_CAP}.
Short = tight lines. Medium = a few beats. Long/Premium = real thought with short paragraphs and blank lines.
Emotes: at most 2 from ${pack.emotes || "(none)"}.
Outlook: ${outlook}. Heat: ${heat}.
Do not write "link in bio" yourself. Return plain text only.${posted}`;

    let user = "";
    if (tweak !== "fresh" && existing) {
      const how =
        tweak === "shorter" ? "cut it down" : tweak === "meaner" ? "sharper / meaner" : "softer, still honest";
      user = `Rewrite this X post. Tweak: ${how}. Keep the idea.\n\n${existing}`;
    } else {
      const bits = [
        topic ? `Topic: ${topic.label}` : "",
        seed ? `Seed: ${seed}` : "",
        source ? `Essay to cut down:\n${source.slice(0, 2500)}` : "",
      ].filter(Boolean);
      user = bits.join("\n") || "Write one Den thought as an X post. Everyday human mess.";
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
        max_tokens: length.tokens,
      }),
    });
    const text = await response.text();
    if (!response.ok) return NextResponse.json({ error: text.slice(0, 220) || "Draft failed" }, { status: 502 });
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: text.slice(0, 180) }, { status: 502 });
    }
    let post = String(data.choices?.[0]?.message?.content || "").trim();
    post = post.replace(/https?:\/\/\S+/gi, "").replace(/thievnsden\.com/gi, "").trim();
    if (sign.line) post = `${post.replace(/\s+$/, "")}\n\n${sign.line}`;
    if (post.length > X_PREMIUM_CAP) post = post.slice(0, X_PREMIUM_CAP - 1).trimEnd();
    return NextResponse.json({ post, chars: post.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Draft failed" }, { status: 500 });
  }
}
