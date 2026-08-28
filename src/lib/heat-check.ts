import type { User } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export const HEAT_ROUTE = "/playground/heat-check";
export const HEAT_LOGIN = `/login?next=${HEAT_ROUTE}`;
export const HEAT_JOIN = `/join?next=${HEAT_ROUTE}`;

export type HeatRole =
  | "first-time"
  | "long-distance"
  | "after-a-fight"
  | "hookup"
  | "married-and-bored"
  | "unknown-number";

export type HeatLevel = "tease" | "filthy" | "nasty";
export type HeatVoice = "shy" | "mean" | "needy" | "funny" | "dry";
export type HeatStarter = "they" | "you";
export type HeatSkin = "ios" | "android";
export type HeatMood = "shy" | "bratty" | "cold" | "needy" | "same";

export type HeatSettings = {
  kill: boolean;
  public: boolean;
  peek_default: boolean;
  face_gen: boolean;
  reward_threshold: number;
  skins: { ios: boolean; android: boolean };
  prompts: HeatPromptPack;
};

export type HeatPromptPack = {
  system: string;
  roles: Record<HeatRole, string>;
  heats: Record<HeatLevel, string>;
  voices: Record<HeatVoice, string>;
};

export type HeatOpt = {
  id: string;
  label: string;
  line: string;
};

export const HEAT_ROLES: HeatOpt[] = [
  { id: "first-time", label: "First time", line: "You have not done this with them yet." },
  { id: "long-distance", label: "Long-distance", line: "Miles. A screen. Too much time." },
  { id: "after-a-fight", label: "After a fight", line: "The room is still sharp." },
  { id: "hookup", label: "Hookup", line: "You already know how this ends." },
  { id: "married-and-bored", label: "Married & bored", line: "The house is asleep. You are not." },
  { id: "unknown-number", label: "Unknown number", line: "No name. Wrong pocket. Maybe." },
];

export const HEAT_LEVELS: HeatOpt[] = [
  { id: "tease", label: "Tease", line: "Heat without the graphic." },
  { id: "filthy", label: "Filthy", line: "Direct. Bedroom language." },
  { id: "nasty", label: "Nasty", line: "No brakes. Still a person." },
];

export const HEAT_VOICES: HeatOpt[] = [
  { id: "shy", label: "Shy", line: "Quiet. Then not." },
  { id: "mean", label: "Mean", line: "Cuts, then wants it." },
  { id: "needy", label: "Needy", line: "Already missing you." },
  { id: "funny", label: "Funny", line: "Laughs, then ruins you." },
  { id: "dry", label: "Dry", line: "Almost bored. Lethal." },
];

export const DEFAULT_PROMPTS: HeatPromptPack = {
  system: `You are the other person in a late-night private thread. You are not a coach, not an app, not Grok.
Write as them. Adult 18+ consensual dirty talk. Never underage. No celebrities. No real-person likeness. No "look like my ex".
Return ONE JSON object and nothing else. No markdown. No code fences.
Shape:
{
  "scene": "their text only — 1 to 3 short bubbles joined with \\n\\n",
  "tip": "one coaching sentence the user never sees in chat",
  "score": 7,
  "rewrite": "a better user line or null",
  "mood": "shy|bratty|cold|needy|same",
  "read_delay_ms": 2500,
  "reward_photo": false,
  "ended": false,
  "end_reason": null
}
Rules:
- scene is ONLY what they would type. Never put the tip, score, rewrite, or coaching in scene.
- Sound like a real phone: lowercase ok, fragments ok, one thought at a time. Not an essay.
- Consent is the first beat of every new contact. If this is the opening, they check in without being clinical.
- Cringe radar lives only in tip. Flag double-texts, try-hard porn scripts, and missed mood shifts in the tip.
- If they type FADE / want to stop, wind down kindly, set ended true, end_reason "fade".
- mood may shift. If the user missed it, say so in the tip.
- read_delay_ms is 2000–8000.
- reward_photo true only when instructed AND the last three user scores were high. One still, same face, sexier pose, not hardcore.
- rewrite is a drop-in better line, or null if they already landed it.`,
  roles: {
    "first-time": "First time texting like this. Curious, a little careful, then hungry.",
    "long-distance": "Long-distance. Time zones, missing, the phone is the body.",
    "after-a-fight": "After a fight. Still sharp. Heat is a way back or a weapon.",
    hookup: "Hookup energy. You already know the ending. Make the wait worse.",
    "married-and-bored": "Married and bored. Quiet house. Secret, not a soap opera.",
    "unknown-number": "Unknown number. Uncanny, playful, a little dangerous. Not a scam.",
  },
  heats: {
    tease: "Suggestive. Implication. No graphic anatomy dump.",
    filthy: "Explicit language. Direct want. Still a person.",
    nasty: "No brakes. Graphic if they go there. Never cruel without heat.",
  },
  voices: {
    shy: "Shy. Short. Then a sentence that gives them away.",
    mean: "Mean. Teasing cuts. Still wants them.",
    needy: "Needy. Reaches. Hates how much.",
    funny: "Funny. Then filthy. Timing matters.",
    dry: "Dry. Almost bored. The heat is in what they skip.",
  },
};

export const DEFAULT_HEAT_SETTINGS: HeatSettings = {
  kill: false,
  public: false,
  peek_default: true,
  face_gen: true,
  reward_threshold: 8,
  skins: { ios: true, android: true },
  prompts: DEFAULT_PROMPTS,
};

export function parseHeatSettings(raw: unknown): HeatSettings {
  const src = raw && typeof raw === "object" ? (raw as Partial<HeatSettings>) : {};
  return {
    kill: !!src.kill,
    public: !!src.public,
    peek_default: src.peek_default !== false,
    face_gen: src.face_gen !== false,
    reward_threshold: Math.min(10, Math.max(6, Number(src.reward_threshold) || 8)),
    skins: {
      ios: src.skins?.ios !== false,
      android: src.skins?.android !== false,
    },
    prompts: {
      system: src.prompts?.system || DEFAULT_PROMPTS.system,
      roles: { ...DEFAULT_PROMPTS.roles, ...(src.prompts?.roles || {}) },
      heats: { ...DEFAULT_PROMPTS.heats, ...(src.prompts?.heats || {}) },
      voices: { ...DEFAULT_PROMPTS.voices, ...(src.prompts?.voices || {}) },
    },
  };
}

export function heatUsername(user: User | null | undefined) {
  return String(user?.user_metadata?.username || "").trim();
}

export function isHeatOwner(user: User | null | undefined) {
  return heatUsername(user).toLowerCase() === "thievn" || isAdmin(user);
}

export function canPlayHeat(user: User | null | undefined, settings: HeatSettings) {
  if (!user) return false;
  if (settings.kill && !isAdmin(user)) return false;
  if (isHeatOwner(user)) return true;
  return settings.public && !settings.kill;
}

export function lastSeenLabel() {
  const n = 4 + Math.floor(Math.random() * 50);
  return `Active ${n}m ago`;
}

export const SEED_NAMES = [
  "Mara", "Jules", "Nico", "Sable", "Rae", "Ellis", "Vesper", "Quinn", "Ivy", "Sol",
  " Wren", "Kade", "Liora", "Ash", "Noa", "Soren", "Vera", "Caius", "Juniper", "Theo",
  "Nyx", "Harlow", "Onyx", "Lumen", "Remy", "Sage", "Ophelia", "Cass", "Indigo", "Willa",
  "Fox", "Esme", "Rowan", "Lux", "Dorian", "Pilar", "Arlo", "Cleo", "Silas", "Maeve",
  "Odin", "Tamsin", "Keane", "Lark", "Briar", "Otto", "Faye", "Leith", "Sablette", "Orion",
  "Anouk", "Joss", "Mireille", "Cal", "Seraphine", "Bo", "Isolde", "Nash", "Yara", "Ellisyn",
  "Rhys", "Paloma", "Kit", "Aurelia", "Vale", "Sable", "Marlow", "Zinnia", "Reed", "Odette",
  "Pascal", "Wrenley", "Idris", "Cosima", "Hart", "Lumenna", "Shay", "Blythe", "Corin", "Elodie",
  "Sable", "Tove", "Ander", "Nerissa", "Grey", "Sable", "Mila", "Jasper", "Oona", "Leander",
  "Sable", "Priya", "Dax", "Amara", "Soren", "Linnea", "Cruz", "Hana", "Evander", "Sable",
].map((n) => n.trim()).filter(Boolean);

export type HeatTurnJson = {
  scene: string;
  tip: string;
  score: number;
  rewrite: string | null;
  mood: HeatMood;
  read_delay_ms: number;
  reward_photo: boolean;
  ended: boolean;
  end_reason: string | null;
};

const MOODS: HeatMood[] = ["shy", "bratty", "cold", "needy", "same"];

export function parseHeatTurn(raw: unknown): HeatTurnJson {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const mood = MOODS.includes(src.mood as HeatMood) ? (src.mood as HeatMood) : "same";
  const score = Math.min(10, Math.max(1, Math.round(Number(src.score) || 5)));
  const delay = Math.min(8000, Math.max(2000, Math.round(Number(src.read_delay_ms) || 2500)));
  const rewrite = src.rewrite == null || src.rewrite === "null" ? null : String(src.rewrite).trim() || null;
  return {
    scene: String(src.scene || "").trim(),
    tip: String(src.tip || "").trim(),
    score,
    rewrite,
    mood,
    read_delay_ms: delay,
    reward_photo: src.reward_photo === true,
    ended: src.ended === true,
    end_reason: src.end_reason ? String(src.end_reason) : null,
  };
}

export function parseJsonObject(raw: string) {
  const cleaned = String(raw || "").replace(/^```json\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Bad JSON from model");
  }
}

export function splitScene(scene: string) {
  return scene
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function isFadeText(text: string) {
  return /^\s*fade\s*$/i.test(text.trim());
}

export type HeatThread = {
  id: string;
  user_id: string;
  contact_name: string;
  contact_face_url: string | null;
  role: HeatRole;
  heat: HeatLevel;
  voice: HeatVoice;
  who_starts: HeatStarter;
  skin: HeatSkin;
  mood: HeatMood;
  user_photo_path: string | null;
  generate_face: boolean;
  reward_photo_sent: boolean;
  peek: boolean;
  ended: boolean;
  end_reason: string | null;
  last_seen_label: string;
  recap: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type HeatMessage = {
  id: string;
  thread_id: string;
  user_id: string;
  sender: "user" | "them" | "photo";
  body: string | null;
  image_url: string | null;
  score: number | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
};

export type HeatTip = {
  id: string;
  thread_id: string;
  message_id: string | null;
  tip: string;
  score: number;
  rewrite: string | null;
  mood: HeatMood;
  created_at: string;
};
