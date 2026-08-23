import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { LOOT_ITEMS, lootCoverPrompt } from "@/lib/loot-data";

export const runtime = "nodejs";
export const maxDuration = 120;

async function generateProduct(prompt: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
  const errors: string[] = [];
  for (const model of models) {
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        resolution: "1k",
        aspect_ratio: "4:3",
        response_format: "b64_json",
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      errors.push(`${model}: ${res.status} ${text.slice(0, 180)}`);
      continue;
    }
    const data = JSON.parse(text);
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      errors.push(`${model}: empty`);
      continue;
    }
    return b64 as string;
  }
  throw new Error(errors.join(" | ") || "gen failed");
}

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("loot_covers").select("*");
  const covers: Record<string, any> = {};
  (data || []).forEach((row) => {
    covers[row.id] = row;
  });
  return NextResponse.json({ items: LOOT_ITEMS, covers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const extra = String(body.extra || "");
    const item = LOOT_ITEMS.find((i) => i.id === id);
    if (!item) return NextResponse.json({ error: "Unknown loot id" }, { status: 400 });
    const prompt = lootCoverPrompt(item, extra);
    const b64 = await generateProduct(prompt);
    const supabase = createServiceClient();
    const bytes = Buffer.from(b64, "base64");
    const path = `${id}.jpg`;
    const { error: upErr } = await supabase.storage.from("loot").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (upErr) throw new Error(`STORAGE: ${upErr.message}. Create public bucket loot.`);
    const { data: pub } = supabase.storage.from("loot").getPublicUrl(path);
    const image_url = `${pub.publicUrl}?v=${Date.now()}`;
    const { error } = await supabase.from("loot_covers").upsert({
      id,
      image_url,
      prompt,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    await writeAudit({ action: "loot_cover", details: id });
    return NextResponse.json({ success: true, image_url, prompt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
