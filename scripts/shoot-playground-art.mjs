const PROMPTS = {
  "face-the-den":
    "Cinematic 16:9 atmospheric background plate for a dark premium arcade card. Photoreal, moody, deep blacks, large empty dark area on the left for overlay text. Soft bokeh, film grain, one accent color only. Not a poster, not a collage, not a UI mock. No readable text, no logos, no watermarks, no bright faces looking at camera, no clutter. Quiet luxury, low contrast haze, edge-to-edge fill. Scene: a crimson velvet judgment booth in near-dark, unfocused vanity bulbs as rose bokeh, a chair silhouette facing away, faint smoke, analog film. Accent: blood rose.",
  "would-you-rather":
    "Cinematic 16:9 atmospheric background plate for a dark premium arcade card. Photoreal, moody, deep blacks, large empty dark area on the left for overlay text. Soft bokeh, film grain, one accent color only. Not a poster, not a collage, not a UI mock. No readable text, no logos, no watermarks, no bright faces looking at camera, no clutter. Quiet luxury, low contrast haze, edge-to-edge fill. Scene: empty late-night game-show floor split by two pools of light, violet left and amber right, glossy black stage, no host, no crowd. Accent: split neon.",
  "highway-hunter":
    "Cinematic 16:9 atmospheric background plate for a dark premium arcade card. Photoreal, moody, deep blacks, large empty dark area on the left for overlay text. Soft bokeh, film grain, one accent color only. Not a poster, not a collage, not a UI mock. No readable text, no logos, no watermarks, no bright faces looking at camera, no clutter. Quiet luxury, low contrast haze, edge-to-edge fill. Scene: wet night interstate from a low hood angle, orange sodium lamps, rain streaks, distant headlights as bokeh, empty road. Accent: sodium orange.",
  "den-arena":
    "Cinematic 16:9 atmospheric background plate for a dark premium arcade card. Photoreal, moody, deep blacks, large empty dark area on the left for overlay text. Soft bokeh, film grain, one accent color only. Not a poster, not a collage, not a UI mock. No readable text, no logos, no watermarks, no bright faces looking at camera, no clutter. Quiet luxury, low contrast haze, edge-to-edge fill. Scene: unused circular pit in a dark den, one cold spotlight on dust, empty ropes in shadow, waiting. Accent: cool steel.",
};

async function imagine(prompt) {
  const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
  let last = "";
  for (const model of models) {
    const payload = {
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
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      last = `${model} ${res.status} ${text.slice(0, 180)}`;
      continue;
    }
    const data = JSON.parse(text);
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    if (b64) return Buffer.from(b64, "base64");
    if (url) {
      const img = await fetch(url);
      if (img.ok) return Buffer.from(await img.arrayBuffer());
    }
    last = `${model} empty`;
  }
  throw new Error(last || "imagine failed");
}

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: row } = await supabase.from("site_settings").select("playground_art").eq("id", 1).maybeSingle();
  const art = row?.playground_art && typeof row.playground_art === "object" ? { ...row.playground_art } : {};
  for (const [id, prompt] of Object.entries(PROMPTS)) {
    process.stdout.write(`shoot ${id}...\n`);
    const bytes = await imagine(prompt);
    const path = `playground/cards/${id}-${Date.now().toString(36)}.jpg`;
    const { error: upErr } = await supabase.storage.from("afterimage").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (upErr) throw new Error(`${id} storage ${upErr.message}`);
    const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
    art[id] = { url: `${pub.publicUrl}?v=${Date.now()}`, prompt, updated_at: new Date().toISOString() };
    process.stdout.write(`ok ${id} ${art[id].url}\n`);
  }
  const { error } = await supabase
    .from("site_settings")
    .update({ playground_art: art, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(art).map(([k, v]) => [k, v.url])), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
