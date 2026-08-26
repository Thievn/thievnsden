import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { dropFeature } from "@/lib/x-drop";
import { SIGNOFFS } from "@/lib/x-thoughts";
import { rowToPair } from "@/lib/wyr-map";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const feature = dropFeature(String(body.feature || "den"));
    const sign = SIGNOFFS.find((s) => s.id === body.signoff) || SIGNOFFS[0];
    const heat = String(body.heat || "sharp");
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const supabase = createServiceClient();
    let seed = String(body.seed || "").trim();
    if (feature.id === "ftd" && body.id) {
      const { data } = await supabase
        .from("judgments")
        .select("id, user_id, score, verdict, image_url")
        .eq("id", body.id)
        .maybeSingle();
      let username = "someone";
      if (data?.user_id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user_id)
          .maybeSingle();
        if (p?.username) username = p.username;
      }
      seed = [
        `Face The Den card`,
        `@${username}`,
        `score ${Number(data?.score || 0).toFixed(1)}`,
        `verdict: ${String(data?.verdict || "").slice(0, 180)}`,
        seed,
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (feature.id === "floor" && body.id) {
      const { data } = await supabase.from("wyr_pairs").select("*").eq("id", body.id).maybeSingle();
      const pair = data ? rowToPair(data) : null;
      if (pair) {
        seed = `The Floor pair.\nA: ${pair.a}\nB: ${pair.b}\n${seed}`.trim();
      }
    }
    if (feature.id === "afterimage" && body.id) {
      const { data } = await supabase
        .from("afterimage_prints")
        .select("want, username, heat, finish")
        .eq("id", body.id)
        .maybeSingle();
      if (data) {
        seed = `Afterimage lock screen by @${data.username || "den"}. Want: ${String(data.want || "").slice(0, 180)}. Heat ${data.heat || ""}. ${seed}`.trim();
      }
    }

    const system = `You write an X post for @Thievn advertising one room of Thievn's Den.
Voice: human, adult, not a brand intern. No hashtags. No URLs. No http. No thievnsden.com. Never 👇.
You MAY name the feature (${feature.label}). You may quote a verdict or a would-you-rather side.
Keep it under 280 characters before the sign-off. One beat, then stop.
Heat: ${heat}.
Do not write "link in bio" yourself. Plain text only.`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Feature: ${feature.label}. Tagline: ${feature.line}.\n${seed || "Write a teaser that makes someone tap."}`,
          },
        ],
        temperature: 0.95,
        max_tokens: 180,
      }),
    });
    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: text.slice(0, 200) }, { status: 502 });
    const data = JSON.parse(text);
    let post = String(data.choices?.[0]?.message?.content || "").trim();
    post = post.replace(/https?:\/\/\S+/gi, "").replace(/thievnsden\.com/gi, "").trim();
    if (sign.line) post = `${post}\n\n${sign.line}`;
    return NextResponse.json({ post, feature: feature.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Draft failed" }, { status: 500 });
  }
}
