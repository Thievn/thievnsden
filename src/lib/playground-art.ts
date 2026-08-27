import { createServiceClient } from "@/lib/supabase/server";
import {
  PLAYGROUND_ART_PROMPTS,
  type PlaygroundArtMap,
  type PlaygroundGameId,
} from "@/lib/playground-games";

async function imagineBytes(prompt: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");

  const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
  const errors: string[] = [];

  for (const model of models) {
    const payload: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      resolution: "1k",
      aspect_ratio: "16:9",
      response_format: "b64_json",
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
      errors.push(`${model}: ${res.status} ${text.slice(0, 160)}`);
      continue;
    }
    let data: { data?: { b64_json?: string; url?: string }[] } = {};
    try {
      data = JSON.parse(text);
    } catch {
      errors.push(`${model}: bad json`);
      continue;
    }
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    if (b64) return new Uint8Array(Buffer.from(b64, "base64"));
    if (url) {
      const img = await fetch(url);
      if (img.ok) return new Uint8Array(await img.arrayBuffer());
    }
    errors.push(`${model}: empty`);
  }

  throw new Error(errors.join(" | ") || "Playground still failed");
}

export async function loadPlaygroundArt(): Promise<PlaygroundArtMap> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("site_settings").select("playground_art").eq("id", 1).maybeSingle();
  const raw = data?.playground_art;
  return raw && typeof raw === "object" ? (raw as PlaygroundArtMap) : {};
}

export async function generatePlaygroundStill(id: PlaygroundGameId, extra = "") {
  const prompt = extra.trim()
    ? `${PLAYGROUND_ART_PROMPTS[id]} Extra direction: ${extra.trim().slice(0, 280)}`
    : PLAYGROUND_ART_PROMPTS[id];
  const bytes = await imagineBytes(prompt);
  const supabase = createServiceClient();
  const path = `playground/cards/${id}-${Date.now().toString(36)}.jpg`;
  const { error: upErr } = await supabase.storage.from("afterimage").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upErr) throw new Error(`STORAGE: ${upErr.message}`);
  const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;
  const current = await loadPlaygroundArt();
  const next: PlaygroundArtMap = {
    ...current,
    [id]: { url, prompt, updated_at: new Date().toISOString() },
  };
  const { error } = await supabase
    .from("site_settings")
    .update({ playground_art: next, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  return { id, url, prompt };
}
