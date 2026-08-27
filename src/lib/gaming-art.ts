import { createServiceClient } from "@/lib/supabase/server";
import type { GamingItem } from "@/lib/gaming-data";

export async function generateGrokCover(opts: {
  title: string;
  note?: string;
  body?: string;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");

  const mood = (opts.note || opts.body || opts.title).slice(0, 500);
  const prompt = `Cinematic 16:9 editorial photograph for a gaming-culture piece titled "${opts.title}". Mood: ${mood}. Photoreal, moody, dark den lighting, no logos, no readable text, no UI, no watermarks, fill the frame edge to edge.`;

  const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
  let bytes: Uint8Array | null = null;
  let last = "";

  for (const model of models) {
    const payload: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      aspect_ratio: "16:9",
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

  if (!bytes) throw new Error(last || "Cover failed");

  const supabase = createServiceClient();
  const path = `gaming/covers/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  const { error } = await supabase.storage.from("afterimage").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
  return pub.publicUrl;
}

export async function persistItemCover(id: string, cover: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("site_settings")
    .select("gaming_config, gaming_items")
    .eq("id", 1)
    .maybeSingle();
  const items: GamingItem[] = Array.isArray(data?.gaming_items) ? data.gaming_items : [];
  const next = items.map((i) => (i.id === id ? { ...i, cover } : i));
  await supabase.from("site_settings").upsert({
    id: 1,
    gaming_config: data?.gaming_config || {},
    gaming_items: next,
    updated_at: new Date().toISOString(),
  });
  return next;
}
