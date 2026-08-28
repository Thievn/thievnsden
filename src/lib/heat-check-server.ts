import { createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import {
  BASE_HEAT_SYSTEM,
  DEFAULT_HEAT_SETTINGS,
  parseHeatTurn,
  parseModelJson,
  type HeatSettings,
  type HeatTurn,
} from "@/lib/heat-check";
import type { User } from "@supabase/supabase-js";

export async function loadHeatSettings(): Promise<HeatSettings> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("site_settings").select("heat_check").eq("id", 1).maybeSingle();
  const raw = (data?.heat_check && typeof data.heat_check === "object" ? data.heat_check : {}) as Partial<HeatSettings>;
  return { ...DEFAULT_HEAT_SETTINGS, ...raw };
}

export async function saveHeatSettings(next: HeatSettings) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ heat_check: next, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

export function canPlayHeat(user: User | null | undefined, settings: HeatSettings) {
  if (!user) return false;
  if (settings.kill) return false;
  if (isAdmin(user)) return true;
  return !!settings.live;
}

export async function heatBanned(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("heat_bans").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

export async function mayPlayHeat(user: User | null | undefined, settings: HeatSettings) {
  if (!canPlayHeat(user, settings) || !user) return false;
  if (isAdmin(user)) return true;
  return !(await heatBanned(user.id));
}

export async function grokHeatJson(opts: { system: string; user: string; maxTokens?: number }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.3",
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: 0.85,
      max_tokens: opts.maxTokens ?? 700,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 220));
  const data = JSON.parse(text);
  return parseModelJson(data.choices?.[0]?.message?.content || "{}");
}

export async function grokHeatTurn(opts: {
  settings: HeatSettings;
  setup: string;
  history: string;
  lastUser: string;
  extra: string;
}): Promise<HeatTurn> {
  const system = `${BASE_HEAT_SYSTEM}\n${opts.settings.system_prompt || ""}\n${opts.settings.tip_prompt || ""}`.trim();
  const parsed = await grokHeatJson({
    system,
    user: `${opts.setup}\n\nTHREAD:\n${opts.history || "(empty)"}\n\nPLAYER LAST:\n${opts.lastUser || "(they open)"}\n${opts.extra}`,
  });
  return parseHeatTurn(parsed);
}

export async function imagineHeatBytes(prompt: string, aspect = "3:4") {
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
      aspect_ratio: aspect,
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
      errors.push(`${model}: ${res.status}`);
      continue;
    }
    const data = JSON.parse(text) as { data?: { b64_json?: string; url?: string }[] };
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    if (b64) return new Uint8Array(Buffer.from(b64, "base64"));
    if (url) {
      const img = await fetch(url);
      if (img.ok) return new Uint8Array(await img.arrayBuffer());
    }
  }
  throw new Error(errors.join(" | ") || "Still failed");
}

export async function uploadHeatBytes(opts: {
  bucket: "heat-faces" | "heat-uploads" | "heat-rewards";
  path: string;
  bytes: Uint8Array;
  contentType: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(opts.bucket).upload(opts.path, opts.bytes, {
    contentType: opts.contentType,
    upsert: false,
  });
  if (!error) {
    const { data } = supabase.storage.from(opts.bucket).getPublicUrl(opts.path);
    const signed = await supabase.storage.from(opts.bucket).createSignedUrl(opts.path, 60 * 60 * 24 * 30);
    return signed.data?.signedUrl || data.publicUrl;
  }
  const fallback = `heat-check/${opts.bucket}/${opts.path}`;
  const { error: e2 } = await supabase.storage.from("afterimage").upload(fallback, opts.bytes, {
    contentType: opts.contentType,
    upsert: false,
  });
  if (e2) throw new Error(error.message || e2.message);
  const { data } = supabase.storage.from("afterimage").getPublicUrl(fallback);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function pickHeatName(userId: string) {
  const supabase = createServiceClient();
  const { data: recent } = await supabase
    .from("heat_threads")
    .select("contact_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const used = new Set((recent || []).map((r) => String(r.contact_name || "").toLowerCase()));
  const { data: names } = await supabase.from("heat_names").select("id, name, used_count").order("used_count", { ascending: true }).limit(80);
  const pool = (names || []).filter((n) => !used.has(String(n.name).toLowerCase()));
  const list = pool.length ? pool : names || [];
  const pick = list[Math.floor(Math.random() * list.length)];
  if (!pick) return "Alex";
  await supabase.from("heat_names").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id);
  return String(pick.name);
}

function storagePathFromUrl(url: string) {
  const marker = ["/heat-faces/", "/heat-uploads/", "/heat-rewards/", "/afterimage/"];
  for (const m of marker) {
    const i = url.indexOf(m);
    if (i >= 0) {
      const rest = url.slice(i + 1).split("?")[0];
      return rest;
    }
  }
  return null;
}

export async function wipeHeatThread(id: string) {
  const supabase = createServiceClient();
  const { data: thread } = await supabase.from("heat_threads").select("*").eq("id", id).maybeSingle();
  if (!thread) return;
  const { data: msgs } = await supabase.from("heat_messages").select("image_url").eq("thread_id", id);
  const urls = [thread.contact_face_url, thread.user_photo_url, ...(msgs || []).map((m) => m.image_url)].filter(Boolean) as string[];
  for (const url of urls) {
    const path = storagePathFromUrl(url);
    if (!path) continue;
    const bucket = path.startsWith("heat-faces/")
      ? "heat-faces"
      : path.startsWith("heat-uploads/")
        ? "heat-uploads"
        : path.startsWith("heat-rewards/")
          ? "heat-rewards"
          : "afterimage";
    const objectPath = bucket === "afterimage" ? path.replace(/^afterimage\//, "") : path.replace(`${bucket}/`, "");
    await supabase.storage.from(bucket).remove([objectPath, path, `heat-check/${path}`].filter(Boolean));
  }
  await supabase.from("heat_threads").delete().eq("id", id);
}

export function threadSetupLine(t: {
  role: string;
  heat: string;
  voice: string;
  they_start: boolean;
  contact_name: string;
  mood?: string;
  user_photo?: boolean;
}) {
  return `Contact: ${t.contact_name}. Role: ${t.role}. Heat: ${t.heat}. Voice: ${t.voice}. Mood: ${t.mood || "same"}. They start: ${t.they_start}. Player uploaded a selfie for tips: ${t.user_photo ? "yes — mention crop/lighting/frame only, never describe a celebrity" : "no"}.`;
}
