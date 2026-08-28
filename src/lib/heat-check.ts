export const HEAT_ROLES = [
  { id: "first-time", label: "First time" },
  { id: "long-distance", label: "Long-distance" },
  { id: "after-a-fight", label: "After a fight" },
  { id: "hookup", label: "Hookup" },
  { id: "married-and-bored", label: "Married and bored" },
  { id: "unknown-number", label: "Unknown number" },
] as const;

export const HEAT_LEVELS = [
  { id: "tease", label: "Tease" },
  { id: "filthy", label: "Filthy" },
  { id: "nasty", label: "Nasty" },
] as const;

export const HEAT_VOICES = [
  { id: "shy", label: "Shy" },
  { id: "mean", label: "Mean" },
  { id: "needy", label: "Needy" },
  { id: "funny", label: "Funny" },
  { id: "dry", label: "Dry" },
] as const;

export const HEAT_SKINS = [
  { id: "ios", label: "iOS" },
  { id: "android", label: "Android" },
] as const;

export type HeatRole = (typeof HEAT_ROLES)[number]["id"];
export type HeatLevel = (typeof HEAT_LEVELS)[number]["id"];
export type HeatVoice = (typeof HEAT_VOICES)[number]["id"];
export type HeatSkin = (typeof HEAT_SKINS)[number]["id"];
export type HeatMood = "shy" | "bratty" | "cold" | "needy" | "same";

export type HeatOpt = { id: string; label: string };

export type HeatSettings = {
  kill: boolean;
  live: boolean;
  peek_default: boolean;
  face_gen: boolean;
  reward_threshold: number;
  skins_ios: boolean;
  skins_android: boolean;
  system_prompt: string;
  tip_prompt: string;
  roles: HeatOpt[];
  heats: HeatOpt[];
  voices: HeatOpt[];
};

export const DEFAULT_HEAT_SETTINGS: HeatSettings = {
  kill: false,
  live: false,
  peek_default: true,
  face_gen: true,
  reward_threshold: 8,
  skins_ios: true,
  skins_android: true,
  system_prompt: "",
  tip_prompt: "",
  roles: [...HEAT_ROLES],
  heats: [...HEAT_LEVELS],
  voices: [...HEAT_VOICES],
};

export function catalogFromSettings(s: HeatSettings) {
  return {
    roles: s.roles?.length ? s.roles : [...HEAT_ROLES],
    heats: s.heats?.length ? s.heats : [...HEAT_LEVELS],
    voices: s.voices?.length ? s.voices : [...HEAT_VOICES],
  };
}

export type HeatTurn = {
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

export type HeatRecap = {
  heat: string;
  pacing: string;
  cringe: string;
  mood: string;
  best_line: string;
};

export function parseModelJson(raw: string) {
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

export function parseHeatTurn(raw: unknown): HeatTurn {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const delay = Number(o.read_delay_ms);
  const score = Math.max(0, Math.min(10, Math.round(Number(o.score) || 0)));
  const mood = String(o.mood || "same");
  const moods: HeatMood[] = ["shy", "bratty", "cold", "needy", "same"];
  return {
    scene: String(o.scene || "").trim().slice(0, 800),
    tip: String(o.tip || "").trim().slice(0, 240),
    score,
    rewrite: o.rewrite ? String(o.rewrite).trim().slice(0, 500) : null,
    mood: (moods.includes(mood as HeatMood) ? mood : "same") as HeatMood,
    read_delay_ms: Number.isFinite(delay) ? Math.max(1200, Math.min(8000, delay)) : 2500 + Math.floor(Math.random() * 3500),
    reward_photo: o.reward_photo === true,
    ended: o.ended === true,
    end_reason: o.end_reason ? String(o.end_reason).slice(0, 80) : null,
  };
}

const MINOR_RE =
  /\b(under\s*18|minor|child|kid|teen(?:ager)?|sixteen|seventeen|15\s*year|16\s*year|17\s*year|middle school|high school freshman)\b/i;

export function blocksMinors(text: string) {
  return MINOR_RE.test(text);
}

export function isFade(text: string) {
  return text.trim().toUpperCase() === "FADE";
}

export const BASE_HEAT_SYSTEM = `You are the other adult in a private text thread. You also return a hidden coaching tip for the PLAYER, never shown as a text bubble.

HARD:
- Adults 18+ only. If they mention minors, refuse in JSON: scene empty, ended true, end_reason "refused".
- No celebrity names or likeness. No "look like my ex" or real-person copies.
- First beat on a NEW contact must establish consent. Do not jump past a no.
- If they say no / stop / fade, cool off. Never coach past a no.
- scene = THEIR next text only. Never put the tip in scene. No markdown.
- JSON only, exactly:
{"scene":"their next text only","tip":"one sentence","score":7,"rewrite":null,"mood":"same","read_delay_ms":2500,"reward_photo":false,"ended":false,"end_reason":null}
- score 1-10 rates the PLAYER's last line (0 if they have not sent yet).
- rewrite is a better player line or null. Short.
- mood is shy|bratty|cold|needy|same. You MAY shift mid-thread. If the player missed a mood shift, the tip must say so.
- read_delay_ms 2000-8000. Sometimes stay "delivered" by using 8000.
- reward_photo true ONLY if asked and last three player scores were all >= threshold.
- If player sent FADE, wind down kindly, ended true, end_reason "fade".
- If they double-texted while unread, the tip flags it.
- Texts are SMS length. Not essays. Match heat: tease / filthy / nasty. Stay in voice.`;
