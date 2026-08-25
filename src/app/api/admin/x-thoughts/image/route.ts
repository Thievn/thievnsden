import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { TOPICS } from "@/lib/thoughts-packs";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(msg: string, status = 500) {
  return NextResponse.json({ error: msg.slice(0, 280) }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = TOPICS.find((t) => t.id === body.topic);
    const post = String(body.post || body.seed || "").trim();
    const seed = String(body.seed || "").trim();
    const aspect = body.aspect === "9:16" ? "9:16" : "16:9";
    if (!post && !topic && !seed) return jsonError("Draft or topic first", 400);

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return jsonError("XAI_API_KEY missing");

    const mood = (post || seed).replace(/\s+/g, " ").slice(0, 420);
    const label = topic?.label || "a human thought";
    const shape = aspect === "9:16" ? "tall phone 9:16 portrait" : "wide 16:9 landscape";
    const prompt = `Cinematic ${shape} still photograph for an X post about ${label}. Mood of the writing: ${mood || label}. Photoreal, moody, dark den lighting, adult-ok but not pornographic, no logos, no readable text, no UI, no watermarks, fill the frame edge to edge. Make it feel like the thought, not a stock smile.`;

    const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
    let bytes: Uint8Array | null = null;
    let last = "";

    for (const model of models) {
      const payload: Record<string, unknown> = {
        model,
        prompt,
        n: 1,
        aspect_ratio: aspect,
        response_format: "url",
        resolution: "1k",
      };
      if (model.includes("2.0")) payload.quality = "medium";
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
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        last = text.slice(0, 180);
        continue;
      }
      const url = data.data?.[0]?.url;
      const b64 = data.data?.[0]?.b64_json;
      if (url) {
        const img = await fetch(url);
        if (img.ok) {
          bytes = new Uint8Array(await img.arrayBuffer());
          break;
        }
        last = "image url fetch failed";
      } else if (b64) {
        bytes = new Uint8Array(Buffer.from(b64, "base64"));
        break;
      }
    }

    if (!bytes) return jsonError(last || "Image failed", 502);

    const supabase = createServiceClient();
    const path = `x-thoughts/${aspect.replace(":", "x")}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error: upErr } = await supabase.storage.from("afterimage").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (upErr) return jsonError(upErr.message);
    const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
    return NextResponse.json({ image: pub.publicUrl, aspect });
  } catch (err: any) {
    return jsonError(err?.message || "Image failed");
  }
}
