import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { COVER_STYLES } from "@/lib/thoughts-packs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const excerpt = String(body.excerpt || "").trim();
    const styleId = String(body.style || "object");
    const style = COVER_STYLES.find((s) => s.id === styleId) || COVER_STYLES[0];
    if (!title) return NextResponse.json({ error: "Title first" }, { status: 400 });

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const prompt = `Editorial photograph for an essay titled "${title}". Mood: ${excerpt || title}. ${style.prompt}. 16:9 landscape. Photoreal or cinematic still. No logos. No readable words. No clocks reading 3:00. No neon void orbs.`;

    const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
    let b64 = "";
    let last = "";
    for (const model of models) {
      const payload: Record<string, unknown> = {
        model,
        prompt,
        n: 1,
        aspect_ratio: "16:9",
        response_format: "b64_json",
      };
      if (model.includes("2.0")) {
        payload.quality = "medium";
        payload.resolution = "1k";
      } else {
        payload.resolution = "1k";
      }
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        last = text.slice(0, 220);
        continue;
      }
      const data = JSON.parse(text);
      b64 = data.data?.[0]?.b64_json || "";
      if (b64) break;
    }
    if (!b64) return NextResponse.json({ error: last || "Cover failed" }, { status: 502 });

    const buf = Buffer.from(b64, "base64");
    const supabase = createServiceClient();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error: upErr } = await supabase.storage.from("thoughts").upload(path, buf, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (upErr) {
      const { error: again } = await supabase.storage.from("afterimage").upload("thoughts-" + path, buf, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (again) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from("afterimage").getPublicUrl("thoughts-" + path);
      return NextResponse.json({ cover_url: pub.publicUrl, prompt });
    }
    const { data: pub } = supabase.storage.from("thoughts").getPublicUrl(path);
    return NextResponse.json({ cover_url: pub.publicUrl, prompt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Cover failed" }, { status: 500 });
  }
}
