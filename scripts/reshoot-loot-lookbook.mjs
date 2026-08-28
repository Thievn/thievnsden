const { createClient } = require("@supabase/supabase-js");

function hashSalt(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const LIGHTS = [
  "cool cyan rim against a warm key, like a nightclub still",
  "hard side light with a thin gold edge, fashion editorial",
  "soft overhead with a teal bounce and deep falloff",
  "low hero light, almost black surround, luxury catalog",
  "split amber and steel lighting, cinematic",
];
const BACKS = [
  "void black with a faint smoke catch-light",
  "brushed gunmetal plate, barely visible",
  "obsidian acrylic with a single reflection",
  "dark carbon weave out of focus",
  "matte charcoal cyc, infinite",
];
const ANGLES = ["three-quarter catalog hero", "slightly low hero angle", "eye-level packshot", "tight 50mm product crop"];

function promptFor(pick) {
  const term = pick.search_query || pick.name;
  const salt = hashSalt(`${pick.id}|${pick.name}|${term}|lookbook`);
  const light = LIGHTS[salt % LIGHTS.length];
  const back = BACKS[(salt >> 3) % BACKS.length];
  const angle = ANGLES[(salt >> 7) % ANGLES.length];
  return [
    "Luxury editorial product photograph for a dark lookbook, 4:3, photoreal, tactile, expensive lighting.",
    "Shot like a museum catalog — never a generic Amazon listing, never CGI, never a 3D render.",
    `The only subject is this exact object: ${pick.name}. Search intent: ${term}. Section: ${pick.section}.`,
    `Lighting: ${light}. Background: ${back}. Camera: ${angle}.`,
    "Unique still. No living rooms, bedrooms, kitchens, sofas, nightstands, staged homes. No faces, text, watermark, collage.",
  ].join(" ");
}

async function imagine(prompt) {
  const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
  let last = "";
  for (const model of models) {
    const payload = {
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
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      last = `${model} ${res.status} ${text.slice(0, 160)}`;
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
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: picks, error } = await supabase.from("loot_picks").select("*").eq("active", true).order("sort_order");
  if (error) throw error;
  for (const pick of picks || []) {
    process.stdout.write(`shoot ${pick.id}...\n`);
    const prompt = promptFor(pick);
    const bytes = await imagine(prompt);
    const path = `covers/${pick.id}-${Date.now().toString(36)}.jpg`;
    const { error: upErr } = await supabase.storage.from("loot").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (upErr) throw new Error(`${pick.id} storage ${upErr.message}`);
    const { data: pub } = supabase.storage.from("loot").getPublicUrl(path);
    const image_url = `${pub.publicUrl}?v=${Date.now()}`;
    await supabase.from("loot_covers").upsert({
      id: pick.id,
      image_url,
      prompt,
      updated_at: new Date().toISOString(),
    });
    await supabase.from("loot_picks").update({ image_url }).eq("id", pick.id);
    process.stdout.write(`ok ${pick.id}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
