import { createServiceClient } from "@/lib/supabase/server";
import { lootCoverPrompt } from "@/lib/loot-data";

export async function generateLootStill(opts: {
  id: string;
  name: string;
  section?: string;
  search_query?: string;
  extra?: string;
  scene?: string;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const prompt = lootCoverPrompt(
    {
      id: opts.id,
      name: opts.name,
      section: opts.section,
      search_query: opts.search_query,
    },
    opts.extra || "",
    opts.scene || "auto"
  );
  const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
  let bytes: Uint8Array | null = null;
  const errors: string[] = [];

  for (const model of models) {
    const payload: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      resolution: "1k",
      aspect_ratio: "4:3",
      response_format: "b64_json",
    };
    if (model.includes("2.0")) payload.quality = "high";
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
      errors.push(`${model}: ${res.status} ${text.slice(0, 160)}`);
      continue;
    }
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      errors.push(`${model}: bad json`);
      continue;
    }
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    if (b64) {
      bytes = new Uint8Array(Buffer.from(b64, "base64"));
      break;
    }
    if (url) {
      const img = await fetch(url);
      if (img.ok) {
        bytes = new Uint8Array(await img.arrayBuffer());
        break;
      }
    }
    errors.push(`${model}: empty`);
  }

  if (!bytes) throw new Error(errors.join(" | ") || "Loot still failed");

  const supabase = createServiceClient();
  const path = `covers/${opts.id}-${Date.now().toString(36)}.jpg`;
  const { error: upErr } = await supabase.storage.from("loot").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upErr) throw new Error(`STORAGE: ${upErr.message}. Create public bucket loot.`);
  const { data: pub } = supabase.storage.from("loot").getPublicUrl(path);
  const image_url = `${pub.publicUrl}?v=${Date.now()}`;
  await supabase.from("loot_covers").upsert({
    id: opts.id,
    image_url,
    prompt,
    updated_at: new Date().toISOString(),
  });
  return { image_url, prompt };
}
