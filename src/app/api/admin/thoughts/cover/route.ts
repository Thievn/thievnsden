import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { COVER_STYLES } from "@/lib/thoughts-packs";

export const runtime = "nodejs";
export const maxDuration = 60;

async function toLandscape(buf: Buffer) {
  try {
    const sharp = (await import("sharp")).default;
    return sharp(buf, { failOn: "none" }).rotate().resize(1600, 900, { fit: "cover" }).jpeg({ quality: 86 }).toBuffer();
  } catch {
    return buf;
  }
}

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

    const prompt = `Wide landscape editorial photograph 16:9. Essay titled "${title}". Mood: ${excerpt || title}. ${style.prompt}. Photoreal cinematic still. Fill the full frame edge to edge. No logos. No readable words. No clocks. No 3am kitchen. No letterboxing.`;

    const models = ["grok-imagine-image-2.0", "grok-imagine-image"];
    let b64 = "";
    let last = "";
    for (const model of models) {
      const payload: Record<string, unknown> = {
        model,
        prompt,
        n: 1,
        aspect_ratio: "16:9",
        response_format: "b64_json",
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
      const data = JSON.parse(text);
      b64 = data.data?.[0]?.b64_json || "";
      if (b64) break;
    }
    if (!b64) return NextResponse.json({ error: last || "Cover failed" }, { status: 502 });

    const raw = Buffer.from(b64, "base64");
    const jpg = await toLandscape(raw);
    const supabase = createServiceClient();
    const path = `thoughts/covers/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error: upErr } = await supabase.storage.from("afterimage").upload(path, jpg, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
    return NextResponse.json({ cover_url: pub.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Cover failed" }, { status: 500 });
  }
}
