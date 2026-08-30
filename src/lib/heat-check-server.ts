import { NextRequest } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";
import {
  canPlayHeat,
  DEFAULT_HEAT_SETTINGS,
  HEAT_ROLES,
  parseHeatSettings,
  parseHeatTurn,
  parseJsonObject,
  splitScene,
  type HeatLevel,
  type HeatMood,
  type HeatRole,
  type HeatSettings,
  type HeatSkin,
  type HeatStarter,
  type HeatThread,
  type HeatTurnJson,
  type HeatVoice,
  type HeatLook,
  type HeatPronouns,
  type HeatOrientation,
  SEED_NAME_ROWS,
  chatIdentityBrief,
  calibrateHeatScore,
  imageFacePrompt,
  vibeForLook,
} from "@/lib/heat-check";

type Service = ReturnType<typeof createServiceClient>;

export async function loadHeatSettings(supabase?: Service): Promise<HeatSettings> {
  const db = supabase || createServiceClient();
  const { data } = await db.from("site_settings").select("heat_settings, heat_check").eq("id", 1).maybeSingle();
  const raw =
    data?.heat_settings && typeof data.heat_settings === "object" && Object.keys(data.heat_settings).length
      ? data.heat_settings
      : data?.heat_check;
  return parseHeatSettings(raw);
}

export async function saveHeatSettings(next: HeatSettings) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ heat_settings: next, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  return next;
}

export async function heatAuth(req: NextRequest) {
  const user = await userFromRequest(req);
  const settings = await loadHeatSettings();
  return { user, settings, play: canPlayHeat(user, settings) };
}

export async function requireHeatPlayer(req: NextRequest) {
  const ctx = await heatAuth(req);
  if (!ctx.user) return { ...ctx, error: "Log in to open a night.", status: 401 as const };
  if (!ctx.play) return { ...ctx, error: "coming_soon", status: 403 as const };
  return ctx;
}

export async function grokJsonChat(opts: {
  system: string;
  user: string;
  imageUrl?: string | null;
  maxTokens?: number;
  temperature?: number;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const userContent: Array<Record<string, unknown>> = [];
  if (opts.imageUrl) {
    userContent.push({
      type: "image_url",
      image_url: { url: opts.imageUrl },
    });
  }
  userContent.push({ type: "text", text: opts.user });
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
        { role: "user", content: userContent.length === 1 ? opts.user : userContent },
      ],
      temperature: opts.temperature ?? 0.95,
      max_tokens: opts.maxTokens ?? 700,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(clipUpstream(text, res.status));
  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(clipUpstream(text, res.status));
  }
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    return parseJsonObject(content);
  } catch {
    return {
      scene: String(content).replace(/[{}"\\]/g, " ").slice(0, 180).trim() || "hey. you there?",
      tip: "Keep it one thought. Let them answer.",
      score: 6,
      rewrite: null,
      mood: "same",
      read_delay_ms: 2800,
      reward_photo: false,
      ended: false,
      end_reason: null,
    };
  }
}

function clipUpstream(text: string, status: number) {
  const clip = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return clip || `Model failed (${status})`;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label = "Timed out") {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      },
    );
  });
}

export function fallbackHeatTurn(opening: boolean): HeatTurnJson {
  return parseHeatTurn({
    scene: opening ? "hey. this a bad time?" : "yeah?",
    tip: "Match their pace. Don't dump the whole night in one bubble.",
    score: 6,
    rewrite: null,
    mood: "same",
    read_delay_ms: 2600,
    reward_photo: false,
    ended: false,
    end_reason: null,
  });
}

export async function pickContactName(supabase: Service, userId: string, look?: HeatLook | string) {
  const { data: recent } = await supabase
    .from("heat_threads")
    .select("contact_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const used = new Set((recent || []).map((r) => String(r.contact_name || "").toLowerCase()));
  const vibe = vibeForLook(look || "unisex");

  const { data: pool } = await supabase.from("heat_names").select("name, vibe").order("name");
  let rows = (pool || []).map((r) => ({ name: String(r.name).trim(), vibe: String(r.vibe || "unisex") })).filter((r) => r.name);
  if (rows.length < 40) {
    await supabase.from("heat_names").upsert(SEED_NAME_ROWS, { onConflict: "name" });
    const { data: again } = await supabase.from("heat_names").select("name, vibe").order("name");
    rows = (again || []).map((r) => ({ name: String(r.name).trim(), vibe: String(r.vibe || "unisex") })).filter((r) => r.name);
  }
  const source = rows.length ? rows : SEED_NAME_ROWS;
  const matched = source.filter((r) => r.vibe === vibe || r.vibe === "unisex" || vibe === "unisex");
  const bag = (matched.length ? matched : source).filter((r) => !used.has(r.name.toLowerCase()));
  const pickFrom = bag.length ? bag : matched.length ? matched : source;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)]?.name || "Mara";
}

const FACE_BASE = `Amateur candid iPhone still of a fictional adult 26–34. One person. Not a celebrity. Not a real person. No likeness of anyone famous. Tight head-and-shoulders portrait, face centered, eyes in the upper third, square-crop friendly. SFW-sexy, tasteful, no nudity, no explicit anatomy, no pornography. Night indoor lamp, film grain, looking toward camera. Attractive, lived-in, expensive den energy.`;

export async function imagineStill(prompt: string, aspect: "3:4" | "1:1" = "3:4") {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  // One model, one wait. Chaining 2.0 then v1 blew the 60s Hobby cap and wrote nothing.
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
    if (model.includes("2.0")) payload.quality = "low";
    try {
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(50000),
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
      if (b64) return Buffer.from(b64, "base64");
      const url = data.data?.[0]?.url;
      if (url) {
        const img = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (img.ok) return Buffer.from(await img.arrayBuffer());
        errors.push(`${model}: url fetch ${img.status}`);
        continue;
      }
      errors.push(`${model}: empty`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "imagine failed";
      errors.push(`${model}: ${msg}`);
      if (/timeout|aborted|timed out/i.test(msg)) break;
    }
  }
  throw new Error(errors.join(" | ") || "image failed");
}

function stillFromImaginePayload(text: string) {
  let data: { data?: { b64_json?: string; url?: string }[]; url?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const b64 = data.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, "base64");
  const url = data.data?.[0]?.url || data.url;
  return url || null;
}

export async function imagineStillFromRef(prompt: string, faceUrl: string, aspect: "3:4" | "1:1" = "3:4") {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image-2.0",
      prompt,
      aspect_ratio: aspect,
      resolution: "1k",
      response_format: "b64_json",
      image: { url: faceUrl, type: "image_url" },
    }),
    signal: AbortSignal.timeout(50000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`edit ${res.status} ${text.slice(0, 160)}`);
  const got = stillFromImaginePayload(text);
  if (got instanceof Buffer) return got;
  if (typeof got === "string") {
    const img = await fetch(got, { signal: AbortSignal.timeout(15000) });
    if (img.ok) return Buffer.from(await img.arrayBuffer());
  }
  throw new Error("edit empty");
}

export async function phoneStillBytes(bytes: Buffer | Uint8Array) {
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(bytes))
    .rotate()
    .resize(768, 1024, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function uploadHeatBytes(opts: {
  bucket: "heat-faces" | "heat-uploads" | "heat-rewards";
  path: string;
  bytes: Buffer | Uint8Array;
  contentType?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(opts.bucket).upload(opts.path, opts.bytes, {
    contentType: opts.contentType || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(opts.bucket).getPublicUrl(opts.path);
  return { path: opts.path, url: data.publicUrl };
}

export async function squareFaceBytes(bytes: Buffer | Uint8Array) {
  const sharp = (await import("sharp")).default;
  const img = sharp(Buffer.from(bytes));
  const meta = await img.metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;
  const side = Math.min(w, h);
  const left = Math.max(0, Math.round((w - side) / 2));
  const top = Math.max(0, Math.min(h - side, Math.round((h - side) * 0.18)));
  return img.extract({ left, top, width: side, height: side }).resize(512, 512).jpeg({ quality: 84 }).toBuffer();
}

export async function generateContactFace(
  userId: string,
  seed?: string,
  identity?: { who?: string; look?: string; presentation?: string; appearance?: string; threadId?: string },
) {
  const extra = (seed || "").trim().slice(0, 180);
  const who = identity?.who || identity?.look || "woman";
  const visual = imageFacePrompt(who, identity?.presentation || "default", identity?.appearance);
  const prompt = `${FACE_BASE} ${visual} ${extra || "night indoor lamp, messy hair, lived-in room."} STRICT: clothes on or implied, no hardcore. Do not use pronouns or orientation. No celebrities. No real-person likeness. No 'look like my ex'.`;
  const raw = await imagineStill(prompt, "1:1");
  const bytes = await squareFaceBytes(raw);
  const path = `${userId}/${Date.now().toString(36)}.jpg`;
  const up = await uploadHeatBytes({ bucket: "heat-faces", path, bytes });
  const supabase = createServiceClient();
  await supabase.from("heat_assets").insert({
    user_id: userId,
    thread_id: identity?.threadId || null,
    kind: "face",
    bucket: "heat-faces",
    path: up.path,
    url: up.url,
    status: "ready",
  });
  return { ...up, prompt };
}

export async function generateRewardStill(userId: string, threadId: string, facePrompt: string) {
  const prompt = `${FACE_BASE} SAME PERSON as previously described: ${facePrompt.slice(0, 280)} Now a sexier pose, still SFW, clothes thinner or more undone, looking at the camera like they just sent this. STRICT: no hardcore, no explicit anatomy.`;
  const bytes = await imagineStill(prompt);
  const path = `${userId}/${threadId}/${Date.now().toString(36)}.jpg`;
  const up = await uploadHeatBytes({ bucket: "heat-rewards", path, bytes });
  const supabase = createServiceClient();
  await supabase.from("heat_assets").insert({
    user_id: userId,
    thread_id: threadId,
    kind: "reward",
    bucket: "heat-rewards",
    path: up.path,
    url: up.url,
    status: "pending",
  });
  return up;
}

export async function signedUploadUrl(path: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from("heat-uploads").createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export type TurnContext = {
  thread: HeatThread;
  history: { sender: string; body: string | null }[];
  userLine: string | null;
  opening: boolean;
  fade: boolean;
  nudge?: boolean;
  doubleText: boolean;
  lastScores: number[];
  settings: HeatSettings;
  photoUrl?: string | null;
  visionImageUrl?: string | null;
  compiledSystem?: string;
};

export async function runHeatTurn(ctx: TurnContext): Promise<HeatTurnJson> {
  const p = ctx.settings.prompts;
  const compiled = ctx.compiledSystem || p.system;
  const role = p.roles[ctx.thread.role as HeatRole] || p.roles["first-time"] || "";
  const heat = p.heats[ctx.thread.heat as HeatLevel] || p.heats.tease;
  const voice = p.voices[ctx.thread.voice as HeatVoice] || p.voices.shy;
  const transcript = ctx.history
    .filter((m) => m.body)
    .slice(-18)
    .map((m) => `${m.sender === "user" ? "THEM (the player)" : "YOU"}: ${m.body}`)
    .join("\n");
  const maybeReward =
    !ctx.thread.reward_photo_sent &&
    ctx.lastScores.length >= 2 &&
    ctx.lastScores.slice(-2).every((s) => s >= ctx.settings.reward_threshold);
  const meta = (ctx.thread.meta || {}) as Record<string, unknown>;
  const look = String(ctx.thread.they_look || meta.look || "woman");
  const pronouns = String(ctx.thread.they_pronouns || meta.pronouns || "she");
  const orientation = String(ctx.thread.they_orientation || meta.orientation || "bi");
  const user = `Contact name: ${ctx.thread.contact_name}
${chatIdentityBrief(look, pronouns, orientation)}
Role: ${ctx.thread.role} — ${role}
Heat: ${ctx.thread.heat} — ${heat}
Voice: ${ctx.thread.voice} — ${voice}
Current mood: ${ctx.thread.mood}
Who starts: ${ctx.thread.who_starts}
Opening turn: ${ctx.opening ? "yes — consent first beat. They have not spoken yet. Do not reuse a stock 'you still up'." : "no"}
Fade requested: ${ctx.fade ? "yes — wind down, ended true, end_reason fade" : "no"}
Silence follow-up: ${ctx.nudge ? "yes — they went quiet. 1–2 short bubbles about the last thing said. Tease or check in. Do not restart. Do not fade. Do not mention being a trainer." : "no"}
Player double-texted while unread: ${ctx.doubleText ? "yes — flag it in tip" : "no"}
Last user scores: ${ctx.lastScores.join(", ") || "none"}
Reward photo allowed this turn: ${maybeReward ? "yes, maybe one still of the SAME contact, sexier, not hardcore, if this score is also high" : "no"}
Player sent a photo in chat: ${ctx.visionImageUrl ? "yes — you can see it. React in character in scene. Tip may note crop, lighting, heat, whether it fits. Do NOT dump a Face-the-Den score unless they asked to be judged. Match heat + mood. Mean = sharper. Shy = softer." : "no"}
Player profile still on file: ${ctx.photoUrl && !ctx.visionImageUrl ? "yes — you may mention lighting/crop in the TIP only, never in scene" : ctx.photoUrl ? "yes, separate from the chat photo" : "no"}

Night:
${transcript || "(empty)"}

${ctx.nudge ? "They have not answered. Text them like a person who is still in this thread." : ctx.userLine ? `Latest player text: ${ctx.userLine}` : "No player text yet. You text first."}

You control the night. Stay human. Stay in their body. JSON only.`;

  const raw = await grokJsonChat({
    system: compiled,
    user,
    imageUrl: ctx.visionImageUrl || undefined,
    maxTokens: 800,
    temperature: ctx.fade ? 0.6 : 0.98,
  });
  const parsed = parseHeatTurn(raw || {});
  parsed.score = calibrateHeatScore((raw as { score?: number } | null)?.score, ctx.userLine);
  if (!parsed.scene && !ctx.fade) {
    parsed.scene = ctx.opening ? "you still up?" : "yeah?";
  }
  const withThis = ctx.userLine ? [...ctx.lastScores, parsed.score] : ctx.lastScores;
  const earned =
    !ctx.fade &&
    withThis.length >= 3 &&
    withThis.slice(-3).every((s) => s >= ctx.settings.reward_threshold) &&
    !ctx.thread.reward_photo_sent;
  parsed.reward_photo = earned;
  if (!ctx.fade) parsed.ended = false;
  return parsed;
}

export function buildRecap(opts: {
  scores: number[];
  tips: { tip: string; rewrite: string | null; score: number }[];
  userLines: string[];
  mood: HeatMood;
  heat: HeatLevel;
}) {
  const scores = opts.scores.length ? opts.scores : [5];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const heatScore = Math.round(avg * 10) / 10;
  const low = scores.filter((s) => s <= 4).length;
  const cringe = Math.min(10, low * 2 + (avg < 6 ? 2 : 0));
  const pacing = Math.max(1, Math.min(10, Math.round(8 - low)));
  const moodHandled = /mood|shifted|colder|needier|brat/i.test(opts.tips.map((t) => t.tip).join(" "))
    ? 6
    : 8;
  let best = opts.userLines[0] || "Stay.";
  let bestScore = -1;
  opts.tips.forEach((t, i) => {
    if (t.score >= bestScore && opts.userLines[i]) {
      bestScore = t.score;
      best = opts.userLines[i];
    }
  });
  const dirty = /(cock|pussy|fuck|dick|cunt|cum|slut|whore|rape)/i;
  const clean = dirty.test(best) ? "Don't hang up the night yet." : best.slice(0, 90);
  return {
    heat: heatScore,
    pacing,
    cringe,
    mood_handled: moodHandled,
    best_line: best,
    clean_quote: clean,
    mood: opts.mood,
    heat_level: opts.heat,
  };
}

export function splitThem(scene: string) {
  const parts = splitScene(scene);
  return parts.length ? parts : [scene.trim()].filter(Boolean);
}

export async function writeOpeningMessages(opts: {
  thread: HeatThread;
  settings: HeatSettings;
  compiledSystem?: string;
}) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("heat_messages")
    .select("id")
    .eq("thread_id", opts.thread.id)
    .limit(1);
  if (existing?.length) {
    const { data: rows } = await supabase
      .from("heat_messages")
      .select("*")
      .eq("thread_id", opts.thread.id)
      .order("created_at", { ascending: true });
    return { messages: rows || [], already: true as const };
  }

  const turn = await withTimeout(
    runHeatTurn({
      thread: opts.thread,
      history: [],
      userLine: null,
      opening: true,
      fade: false,
      doubleText: false,
      lastScores: [],
      settings: opts.settings,
      compiledSystem: opts.compiledSystem,
    }),
    28000,
    "Opening timed out",
  ).catch((err: unknown) => {
    console.error("heat opening", err);
    return fallbackHeatTurn(true);
  });

  const bubbles = splitThem(turn.scene);
  const rows = bubbles.map((bodyText) =>
    heatMessageRow({
      thread_id: opts.thread.id,
      user_id: opts.thread.user_id,
      sender: "them",
      body: bodyText,
      delivered_at: new Date().toISOString(),
      read_at: new Date().toISOString(),
    }),
  );
  const { data: inserted } = await supabase.from("heat_messages").insert(rows).select("*");
  if (turn.mood && turn.mood !== "same") {
    await supabase
      .from("heat_threads")
      .update({ mood: turn.mood, updated_at: new Date().toISOString() })
      .eq("id", opts.thread.id);
  }
  return { messages: inserted || [], already: false as const };
}

export const VALID_ROLE = new Set(HEAT_ROLES.map((r) => r.id));
export const VALID_HEAT = new Set(["tease", "filthy", "nasty"]);
export const VALID_VOICE = new Set(["shy", "mean", "needy", "funny", "dry"]);
export const VALID_STARTER = new Set(["they", "you"]);
export const VALID_SKIN = new Set(["ios", "android"]);
export const VALID_LOOK = new Set(["woman", "man", "nonbinary", "trans-woman", "trans-man", "androgynous"]);
export const VALID_PRONOUNS = new Set(["she", "he", "they", "she-they", "he-they", "any"]);
export const VALID_ORIENTATION = new Set(["straight", "gay", "lesbian", "bi", "pan", "queer", "questioning", "ace"]);
export const VALID_PRESENTATION = new Set(["default", "masculine", "feminine", "androgynous", "andromorph"]);
export const VALID_APPEARANCE = new Set([
  "any",
  "black",
  "east-asian",
  "south-asian",
  "southeast-asian",
  "white",
  "mena",
  "latino",
  "indigenous",
  "mixed",
  "prefer-not",
]);

export function asRole(v: unknown): HeatRole {
  const s = String(v || "").trim().toLowerCase();
  if (VALID_ROLE.has(s) || /^[a-z0-9-]{2,40}$/.test(s)) return s;
  return "first-time";
}
export function asHeat(v: unknown): HeatLevel {
  return VALID_HEAT.has(String(v)) ? (v as HeatLevel) : "tease";
}
export function asVoice(v: unknown): HeatVoice {
  return VALID_VOICE.has(String(v)) ? (v as HeatVoice) : "shy";
}
export function asStarter(v: unknown): HeatStarter {
  return VALID_STARTER.has(String(v)) ? (v as HeatStarter) : "they";
}
export function asSkin(v: unknown): HeatSkin {
  return VALID_SKIN.has(String(v)) ? (v as HeatSkin) : "ios";
}
export function asLook(v: unknown): HeatLook {
  return VALID_LOOK.has(String(v)) ? (v as HeatLook) : "woman";
}
export function asPronouns(v: unknown): HeatPronouns {
  return VALID_PRONOUNS.has(String(v)) ? (v as HeatPronouns) : "she";
}
export function asOrientation(v: unknown): HeatOrientation {
  return VALID_ORIENTATION.has(String(v)) ? (v as HeatOrientation) : "bi";
}
export function asPresentation(v: unknown) {
  return VALID_PRESENTATION.has(String(v)) ? String(v) : "default";
}
export function asAppearance(v: unknown) {
  return VALID_APPEARANCE.has(String(v)) ? String(v) : "any";
}

export function heatMessageRow(opts: {
  thread_id: string;
  user_id: string;
  sender: "user" | "them" | "photo";
  body?: string | null;
  image_url?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  score?: number | null;
}) {
  return {
    thread_id: opts.thread_id,
    user_id: opts.user_id,
    sender: opts.sender,
    role: opts.sender === "photo" ? "photo" : opts.sender,
    body: opts.body ?? null,
    image_url: opts.image_url ?? null,
    delivered_at: opts.delivered_at ?? null,
    read_at: opts.read_at ?? null,
    score: opts.score ?? null,
  };
}
