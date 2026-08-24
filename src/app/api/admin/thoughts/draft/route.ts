import { NextRequest, NextResponse } from "next/server";
import { FORMS, HEATS, OUTLOOKS, TOPICS } from "@/lib/thoughts-packs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const seed = String(body.seed || "").trim();
    const topicId = String(body.topic || "");
    const outlookId = String(body.outlook || "honest");
    const heatId = String(body.heat || "sharp");
    const formId = String(body.form || "essay");

    const topic = TOPICS.find((t) => t.id === topicId);
    const outlook = OUTLOOKS.find((o) => o.id === outlookId) || OUTLOOKS[1];
    const heat = HEATS.find((h) => h.id === heatId) || HEATS[1];
    const form = FORMS.find((f) => f.id === formId) || FORMS[0];

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const system = `You write short essays for Thievn's Den. Adult site. Truthful. Human.
Voice: first or close third. Short paragraphs. No motivational coach. No "in today's world". No listicle numbered headers unless form is truths.
Outlook: ${outlook.label}. ${outlook.guide}
Heat: ${heat.label}.
Form: ${form.label}.
Crude, sexual, unhinged is allowed when it fits. Stay specific to real life people actually live. No fantasy magic. No 3am-kitchen cliche language.
Return ONLY valid JSON with keys: title, excerpt, body, slug.
slug is lowercase kebab-case, short.
body is 4-7 short paragraphs separated by \n\n.
excerpt is 1-2 sentences.`;

    const user = [
      topic ? `Topic: ${topic.label}` : "",
      seed ? `Seed / extra: ${seed}` : "",
      !topic && !seed ? "Pick a real human topic yourself." : "",
    ]
      .filter(Boolean)
      .join("\n");

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
          { role: "user", content: user || "Write one Den thought." },
        ],
        temperature: 0.95,
        max_tokens: 900,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json({ error: text.slice(0, 240) || "Draft failed" }, { status: 502 });
    }
    const data = JSON.parse(text);
    const raw = String(data.choices?.[0]?.message?.content || "").trim();
    const jsonText = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({
        title: "Draft",
        excerpt: raw.slice(0, 180),
        body: raw,
        slug: "draft-" + Date.now().toString(36),
      });
    }
    return NextResponse.json({
      title: String(parsed.title || "Untitled").slice(0, 140),
      excerpt: String(parsed.excerpt || "").slice(0, 280),
      body: String(parsed.body || ""),
      slug: String(parsed.slug || "thought")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80),
      topic: topic?.label || "",
      outlook: outlook.id,
      heat: heat.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Draft failed" }, { status: 500 });
  }
}
