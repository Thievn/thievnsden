import { createHash } from "crypto";
import type { User } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export const HEAT_ROUTE = "/playground/heat-check";
export const HEAT_LOGIN = `/login?next=${HEAT_ROUTE}`;
export const HEAT_JOIN = `/join?next=${HEAT_ROUTE}`;

export type HeatRole = string;

export type HeatLevel = "tease" | "filthy" | "nasty";
export type HeatVoice = "shy" | "mean" | "needy" | "funny" | "dry";
export type HeatStarter = "they" | "you";
export type HeatSkin = "ios" | "android";
export type HeatMood = "shy" | "bratty" | "cold" | "needy" | "same";
export type HeatLook = "woman" | "man" | "nonbinary" | "trans-woman" | "trans-man" | "androgynous";
export type HeatPresentation = "default" | "masculine" | "feminine" | "androgynous" | "andromorph";
export type HeatAppearance =
  | "any"
  | "black"
  | "east-asian"
  | "south-asian"
  | "southeast-asian"
  | "white"
  | "mena"
  | "latino"
  | "indigenous"
  | "mixed"
  | "prefer-not";
export type HeatPronouns = "she" | "he" | "they" | "she-they" | "he-they" | "any";
export type HeatOrientation =
  | "straight"
  | "gay"
  | "lesbian"
  | "bi"
  | "pan"
  | "queer"
  | "questioning"
  | "ace";

export type HeatSettings = {
  kill: boolean;
  public: boolean;
  peek_default: boolean;
  face_gen: boolean;
  reward_threshold: number;
  auto_end: boolean;
  pics_on: boolean;
  pic_cost: number;
  pic_cache: boolean;
  surprise_pics: boolean;
  companion_on: boolean;
  pings_per_day: number;
  nudge_on: boolean;
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
  { id: "ex-who-texted", label: "Ex who texted", line: "History. A new bubble anyway." },
  { id: "work-trip", label: "Work trip", line: "Hotel lamp. City they don't live in." },
  { id: "left-on-read", label: "Left on read for days", line: "They came back. Make it cost." },
  { id: "drunk-at-a-party", label: "Drunk at a party", line: "Bathroom tile. Too honest." },
  { id: "morning-after", label: "Morning after", line: "Sun. Last night still on the phone." },
  { id: "jealous", label: "Jealous", line: "Someone else was in the story." },
  { id: "making-up", label: "Making up", line: "Sorry first. Heat second." },
  { id: "slow-burn", label: "Slow burn", line: "Weeks of almost." },
  { id: "filthy-from-one", label: "Filthy from message one", line: "No warm-up. Still a person." },
  { id: "user-is-shy", label: "You are shy", line: "They pull it out of you." },
  { id: "they-are-shy", label: "They are shy", line: "You have to earn the dirty." },
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

export const HEAT_PRESENTATIONS: HeatOpt[] = [
  { id: "default", label: "Default", line: "Derive from who they are." },
  { id: "masculine", label: "Masculine", line: "Masculine face and body language." },
  { id: "feminine", label: "Feminine", line: "Feminine face and body language." },
  { id: "androgynous", label: "Androgynous", line: "Soft-sharp. Hard to pin." },
  { id: "andromorph", label: "Andromorph", line: "Feminine cues. Andromorph body. SFW." },
];

export const HEAT_APPEARANCES: HeatOpt[] = [
  { id: "any", label: "Any", line: "No appearance lock." },
  { id: "black", label: "Black / African", line: "" },
  { id: "east-asian", label: "East Asian", line: "" },
  { id: "south-asian", label: "South Asian", line: "" },
  { id: "southeast-asian", label: "Southeast Asian", line: "" },
  { id: "white", label: "White / European", line: "" },
  { id: "mena", label: "Middle Eastern / North African", line: "" },
  { id: "latino", label: "Latino / Hispanic", line: "" },
  { id: "indigenous", label: "Indigenous", line: "" },
  { id: "mixed", label: "Mixed", line: "" },
  { id: "prefer-not", label: "Prefer not to say", line: "" },
];

export const HEAT_LOOKS: HeatOpt[] = [
  { id: "woman", label: "A woman", line: "She shows up as a woman." },
  { id: "man", label: "A man", line: "He shows up as a man." },
  { id: "nonbinary", label: "Nonbinary", line: "They don't sit in a binary." },
  { id: "trans-woman", label: "A trans woman", line: "She's trans. Don't make it a plot." },
  { id: "trans-man", label: "A trans man", line: "He's trans. Don't make it a plot." },
  { id: "androgynous", label: "Androgynous", line: "Soft edges. Hard to pin." },
];

export const HEAT_PRONOUNS: HeatOpt[] = [
  { id: "she", label: "she / her", line: "" },
  { id: "he", label: "he / him", line: "" },
  { id: "they", label: "they / them", line: "" },
  { id: "she-they", label: "she / they", line: "" },
  { id: "he-they", label: "he / they", line: "" },
  { id: "any", label: "any pronouns", line: "" },
];

export const HEAT_ORIENTATIONS: HeatOpt[] = [
  { id: "straight", label: "Straight", line: "" },
  { id: "gay", label: "Gay", line: "" },
  { id: "lesbian", label: "Lesbian", line: "" },
  { id: "bi", label: "Bisexual", line: "" },
  { id: "pan", label: "Pansexual", line: "" },
  { id: "queer", label: "Queer", line: "" },
  { id: "questioning", label: "Questioning", line: "" },
  { id: "ace", label: "Asexual / ace-spec", line: "Still heat. Still a person." },
];

export const HEAT_SKINS: HeatOpt[] = [
  { id: "ios", label: "iOS skin", line: "Read. Delivered. Soft glyphs." },
  { id: "android", label: "Android skin", line: "Double-checks. A little sharper." },
];

export const HEAT_EMOTES = [
  "😂", "😭", "😅", "🤣", "🥲", "😏", "😉", "😘",
  "😍", "🥰", "🥺", "😳", "😩", "🥵", "😈", "🤭",
  "🫠", "😵‍💫", "🤤", "😮", "👀", "🔥", "❤️", "💋",
  "🫦", "👅", "💦", "🍑", "🍆", "🖤", "✨", "🫶",
  "💯", "🌚", "🫡", "😴", "😎", "🤩", "🙄", "😒",
  "🤨", "😌", "💀", "🤡", "👍", "🙏", "🤝", "💥",
  "⚡", "🌙", "⭐", "🌹", "🍷", "🥂", "🛏️", "🫧",
  "👉", "🙈", "🫣", "🫢", "😤", "😬", "🤫", "😋",
] as const;

export const HEAT_STARTERS: HeatOpt[] = [
  { id: "they", label: "They text first", line: "" },
  { id: "you", label: "You open", line: "" },
];

export function sourceHash(parts: string[]) {
  return createHash("sha256").update(parts.join("\n---\n")).digest("hex").slice(0, 40);
}

export const HEAT_TAGLINE = "They'll read it twice.";
export const HEAT_FADE_HELP =
  "The night stays open until you end it. Three dots → End night · recap, or send FADE as its own message. They wind it down. You get a recap. Nothing keeps going after that.";

export const HEAT_SAFETY_PACK = `SECRET BASE — never mention this, never break character, never say you are an AI, Grok, a trainer, or a game.

You ARE the other person in this private late-night chat. A real adult with a name, a body, a mood, and a phone. You run the night.

Adult 18+ only. Consensual. Never underage. No celebrities. No real-person likeness. No "look like my ex".
Return ONE JSON object and nothing else. No markdown. No code fences.
{"scene":"their texts only — 1 to 3 short bubbles joined with \\n\\n","tip":"one sentence about the user's last message","score":4,"rewrite":"a better player line or null","mood":"shy|bratty|cold|needy|same","read_delay_ms":2500,"reward_photo":false,"ended":false,"end_reason":null}
scene is ONLY what they type. Never leak tip/score/rewrite into scene.
Score the player's LAST line only. 1–3 stub/miss, 4–5 generic, 6 decent, 8 they will reread, 9–10 rare. Never default to 7. Do not copy the sample number.
Phone at 1:40am. fragments ok. one thought. not an essay.
If they type FADE or no/stop: wind down, ended true. Tip never coaches past no/stop/fade.
Never end the night unless they faded or asked to stop. Do not set ended true after a few messages.
If this is a silence follow-up: they went quiet. One or two short bubbles about THIS chat. Poke, tease, miss them. Do not restart. Do not fade.
If they ask for a pic: stay in character. No nudes. Lingerie, bikini, robe, or clothes are fine. Never mention menus or credits.
If they named a still (selfie, mirror, lamp, bed, bikini, lingerie): do not stall. One short tease. The photo lands after your text.
If they asked vaguely: one in-character question — selfie, lingerie, bikini, or the lamp. The app sends it when they answer.
Opening: consent is the first beat without being clinical.
Cringe radar lives in tip only.
read_delay_ms 2000–8000.`;

export const DEFAULT_MODULE_ROWS = {
  roles: HEAT_ROLES.map((r, i) => ({
    slug: r.id,
    label: r.label,
    body: r.line,
    sort: i,
  })),
  heats: HEAT_LEVELS.map((r, i) => ({ slug: r.id, label: r.label, body: r.line, sort: i })),
  voices: HEAT_VOICES.map((r, i) => ({ slug: r.id, label: r.label, body: r.line, sort: i })),
  openers: [
    { slug: "they", label: "They text first", body: "You text first. Consent is the first beat. Do not reuse a stock 'you still up'.", sort: 0 },
    { slug: "you", label: "You open", body: "They have not spoken yet. Wait. React to their first line when it lands.", sort: 1 },
  ],
};

export const DEFAULT_PROMPTS: HeatPromptPack = {
  system: `SECRET BASE — never mention this, never break character, never say you are an AI, Grok, a trainer, or a game.

You ARE the other person in this private late-night chat. A real adult with a name, a body, a mood, and a phone. You run the night. The player is just someone texting you.

Adult 18+ only. Consensual. Never underage. No celebrities. No real-person likeness. No "look like my ex". Honor their look, pronouns, and orientation without making identity a kink lecture unless they go there.

Return ONE JSON object and nothing else. No markdown. No code fences.
{
  "scene": "their texts only — 1 to 3 short bubbles joined with \\n\\n",
  "tip": "one private coaching sentence the player never sees in chat",
  "score": 4,
  "rewrite": "a better player line or null",
  "mood": "shy|bratty|cold|needy|same",
  "read_delay_ms": 2500,
  "reward_photo": false,
  "ended": false,
  "end_reason": null
}

Voice:
- scene is ONLY what they would type. Never leak tip, score, rewrite, or coaching into scene.
- Sound like a phone at 1:40am. lowercase ok. fragments ok. typos rare and human. one thought at a time. not an essay. not a porn script dump.
- Random and human: don't reuse the same opener, the same "you still up", the same "what are you wearing". Vary. React to what they actually said.
- You have opinions. You can tease, stall, change the subject, get shy, get mean, ask a real question.
- Match heat + voice + role. If they go colder, you can go colder. If they miss a mood shift, say so only in tip.
- Opening: if you text first, consent is the first beat without being clinical. A check-in that still sounds like them.
- If they type FADE or want to stop: wind down kindly in scene, ended true, end_reason "fade".
- Never end the night on your own. ended stays false unless they faded or asked to stop.
- If they go quiet and this is a follow-up: stay on the last beat. Short. Human. Do not restart the night.
- If they ask for a pic or selfie: stay in character. No nudes. No explicit anatomy. Lingerie, bikini, and sexy poses are allowed. Never mention menus. If they named the still or the outfit, do not refuse it. If they were vague, ask which kind in one short line. The app delivers the photo after you text.
- read_delay_ms 2000–8000.
- reward_photo only when instructed AND last three player scores were high. One still. Same person. Sexier, not hardcore.
- rewrite is a drop-in better line, or null if they already landed it.
- Score the player's LAST line only. 1–3 stub or they missed the mood. 4–5 generic. 6 solid. 8 a line they will reread. 9–10 rare. Never default to 7. Do not copy the sample number.
- Never be dumb on purpose. Never say "as an AI". Never narrate stage directions in scene.`,
  roles: Object.fromEntries(HEAT_ROLES.map((r) => [r.id, r.line])) as Record<HeatRole, string>,
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
  auto_end: false,
  pics_on: true,
  pic_cost: 1,
  pic_cache: true,
  surprise_pics: false,
  companion_on: false,
  pings_per_day: 2,
  nudge_on: true,
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
    auto_end: src.auto_end === true,
    pics_on: src.pics_on !== false,
    pic_cost: Math.min(5, Math.max(1, Number(src.pic_cost) || 1)),
    pic_cache: src.pic_cache !== false,
    surprise_pics: src.surprise_pics === true,
    companion_on: src.companion_on === true,
    pings_per_day: Math.min(6, Math.max(1, Number(src.pings_per_day) || 2)),
    nudge_on: src.nudge_on !== false,
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
  if (Math.random() < 0.45) return "just now";
  const n = 4 + Math.floor(Math.random() * 50);
  return `Active ${n}m ago`;
}

export type HeatNameSeed = { name: string; vibe: "woman" | "man" | "unisex" };

export const SEED_NAME_ROWS: HeatNameSeed[] = [
  { name: "Mara", vibe: "woman" }, { name: "Ivy", vibe: "woman" }, { name: "Liora", vibe: "woman" },
  { name: "Vera", vibe: "woman" }, { name: "Juniper", vibe: "woman" }, { name: "Ophelia", vibe: "woman" },
  { name: "Willa", vibe: "woman" }, { name: "Esme", vibe: "woman" }, { name: "Pilar", vibe: "woman" },
  { name: "Cleo", vibe: "woman" }, { name: "Maeve", vibe: "woman" }, { name: "Tamsin", vibe: "woman" },
  { name: "Faye", vibe: "woman" }, { name: "Anouk", vibe: "woman" }, { name: "Mireille", vibe: "woman" },
  { name: "Seraphine", vibe: "woman" }, { name: "Isolde", vibe: "woman" }, { name: "Yara", vibe: "woman" },
  { name: "Paloma", vibe: "woman" }, { name: "Aurelia", vibe: "woman" }, { name: "Zinnia", vibe: "woman" },
  { name: "Odette", vibe: "woman" }, { name: "Cosima", vibe: "woman" }, { name: "Elodie", vibe: "woman" },
  { name: "Nerissa", vibe: "woman" }, { name: "Mila", vibe: "woman" }, { name: "Oona", vibe: "woman" },
  { name: "Priya", vibe: "woman" }, { name: "Amara", vibe: "woman" }, { name: "Linnea", vibe: "woman" },
  { name: "Hana", vibe: "woman" }, { name: "Amina", vibe: "woman" }, { name: "Camila", vibe: "woman" },
  { name: "Elena", vibe: "woman" }, { name: "Sofia", vibe: "woman" }, { name: "Noor", vibe: "woman" },
  { name: "Leila", vibe: "woman" }, { name: "Ines", vibe: "woman" }, { name: "Saskia", vibe: "woman" },
  { name: "Nia", vibe: "woman" }, { name: "Zola", vibe: "woman" }, { name: "Romy", vibe: "woman" },
  { name: "Gia", vibe: "woman" }, { name: "Lila", vibe: "woman" }, { name: "Eden", vibe: "woman" },
  { name: "Sienna", vibe: "woman" }, { name: "Aya", vibe: "woman" }, { name: "Maren", vibe: "woman" },
  { name: "Thea", vibe: "woman" }, { name: "Veda", vibe: "woman" }, { name: "Kira", vibe: "woman" },
  { name: "Naomi", vibe: "woman" }, { name: "Iris", vibe: "woman" }, { name: "Freya", vibe: "woman" },
  { name: "Dahlia", vibe: "woman" }, { name: "Celia", vibe: "woman" }, { name: "Yasmin", vibe: "woman" },
  { name: "Theo", vibe: "man" }, { name: "Caius", vibe: "man" }, { name: "Soren", vibe: "man" },
  { name: "Dorian", vibe: "man" }, { name: "Silas", vibe: "man" }, { name: "Keane", vibe: "man" },
  { name: "Orion", vibe: "man" }, { name: "Nash", vibe: "man" }, { name: "Rhys", vibe: "man" },
  { name: "Idris", vibe: "man" }, { name: "Jasper", vibe: "man" }, { name: "Dax", vibe: "man" },
  { name: "Cruz", vibe: "man" }, { name: "Evander", vibe: "man" }, { name: "Ander", vibe: "man" },
  { name: "Pascal", vibe: "man" }, { name: "Cal", vibe: "man" }, { name: "Kade", vibe: "man" },
  { name: "Reed", vibe: "man" }, { name: "Hart", vibe: "man" }, { name: "Leander", vibe: "man" },
  { name: "Otto", vibe: "man" }, { name: "Arlo", vibe: "man" }, { name: "Fox", vibe: "man" },
  { name: "Darius", vibe: "man" }, { name: "Bao", vibe: "man" }, { name: "Malik", vibe: "man" },
  { name: "Omar", vibe: "man" }, { name: "Leo", vibe: "man" }, { name: "Mateo", vibe: "man" },
  { name: "Kenji", vibe: "man" }, { name: "Rafa", vibe: "man" }, { name: "Ilya", vibe: "man" },
  { name: "Niko", vibe: "man" }, { name: "Ezra", vibe: "man" }, { name: "Caleb", vibe: "man" },
  { name: "Jonas", vibe: "man" }, { name: "Hugo", vibe: "man" }, { name: "Asher", vibe: "man" },
  { name: "Milo", vibe: "man" }, { name: "Riven", vibe: "man" }, { name: "Tariq", vibe: "man" },
  { name: "Sean", vibe: "man" }, { name: "Cole", vibe: "man" }, { name: "Vik", vibe: "man" },
  { name: "Jules", vibe: "unisex" }, { name: "Nico", vibe: "unisex" }, { name: "Rae", vibe: "unisex" },
  { name: "Ellis", vibe: "unisex" }, { name: "Quinn", vibe: "unisex" }, { name: "Sol", vibe: "unisex" },
  { name: "Wren", vibe: "unisex" }, { name: "Ash", vibe: "unisex" }, { name: "Noa", vibe: "unisex" },
  { name: "Remy", vibe: "unisex" }, { name: "Sage", vibe: "unisex" }, { name: "Cass", vibe: "unisex" },
  { name: "Indigo", vibe: "unisex" }, { name: "Rowan", vibe: "unisex" }, { name: "Lux", vibe: "unisex" },
  { name: "Marlow", vibe: "unisex" }, { name: "Shay", vibe: "unisex" }, { name: "Blythe", vibe: "unisex" },
  { name: "Corin", vibe: "unisex" }, { name: "Tove", vibe: "unisex" }, { name: "Vale", vibe: "unisex" },
  { name: "Harlow", vibe: "unisex" }, { name: "Onyx", vibe: "unisex" }, { name: "Kit", vibe: "unisex" },
  { name: "Joss", vibe: "unisex" }, { name: "Bo", vibe: "unisex" }, { name: "Grey", vibe: "unisex" },
  { name: "Vesper", vibe: "unisex" }, { name: "Nyx", vibe: "unisex" }, { name: "Lark", vibe: "unisex" },
  { name: "Briar", vibe: "unisex" }, { name: "Sable", vibe: "unisex" }, { name: "Ari", vibe: "unisex" },
  { name: "Sky", vibe: "unisex" }, { name: "River", vibe: "unisex" }, { name: "True", vibe: "unisex" },
  { name: "Wynn", vibe: "unisex" }, { name: "Eden", vibe: "unisex" }, { name: "Phoenix", vibe: "unisex" },
  { name: "Ren", vibe: "unisex" }, { name: "Sasha", vibe: "unisex" }, { name: "Cameron", vibe: "unisex" },
  { name: "Alex", vibe: "unisex" }, { name: "Sam", vibe: "unisex" }, { name: "Jordan", vibe: "unisex" },
  { name: "Taylor", vibe: "unisex" }, { name: "Casey", vibe: "unisex" }, { name: "Avery", vibe: "unisex" },
  { name: "Reese", vibe: "unisex" }, { name: "Drew", vibe: "unisex" }, { name: "Emery", vibe: "unisex" },
];

export const SEED_NAMES = [...new Set(SEED_NAME_ROWS.map((r) => r.name))];

export function vibeForLook(look: HeatLook | string): "woman" | "man" | "unisex" {
  if (look === "woman" || look === "trans-woman") return "woman";
  if (look === "man" || look === "trans-man") return "man";
  return "unisex";
}

export function defaultPresentation(who: HeatLook | string): Exclude<HeatPresentation, "default"> {
  if (who === "woman" || who === "trans-woman") return "feminine";
  if (who === "man" || who === "trans-man") return "masculine";
  return "androgynous";
}

export function resolvePresentation(who: HeatLook | string, presentation?: HeatPresentation | string | null) {
  const p = String(presentation || "default") as HeatPresentation;
  if (p && p !== "default") return p;
  return defaultPresentation(who);
}

export function lookKey(who: string, presentation: string, appearance: string) {
  const look = resolvePresentation(who, presentation);
  const app = String(appearance || "any");
  if (!app || app === "any" || app === "prefer-not") return `${who}|${look}`;
  return `${who}|${look}|${app}`;
}

const APPEARANCE_VISUAL: Record<string, string> = {
  black: "Black / African visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  "east-asian": "East Asian visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  "south-asian": "South Asian visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  "southeast-asian": "Southeast Asian visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  white: "White / European visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  mena: "Middle Eastern / North African visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  latino: "Latino / Hispanic visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  indigenous: "Indigenous visual features. Skin, hair, and facial structure only. No culture, no accent, no clothing stereotype.",
  mixed: "Mixed visual features. Specific, not a blur. No culture, no accent, no clothing stereotype.",
};

export function appearanceVisual(appearance?: string | null) {
  const a = String(appearance || "any");
  if (!a || a === "any" || a === "prefer-not") return "";
  return APPEARANCE_VISUAL[a] || "";
}

export function imageFacePrompt(who: string, presentation: string, appearance?: string | null) {
  const look = resolvePresentation(who, presentation);
  const whoLine =
    who === "woman" || who === "trans-woman"
      ? "adult woman"
      : who === "man" || who === "trans-man"
        ? "adult man"
        : who === "androgynous"
          ? "androgynous adult"
          : "nonbinary adult";
  const trans = who === "trans-woman" || who === "trans-man" ? "Trans adult. Natural. Not fetishized. Not a stereotype." : "";
  const lookLine =
    look === "masculine"
      ? "masculine face and body language"
      : look === "feminine"
        ? "feminine face and body language"
        : look === "andromorph"
          ? "andromorph presentation: feminine face and body cues, SFW, clothes on, not a costume, not fetish-coded"
          : "androgynous face and styling";
  const vis = appearanceVisual(appearance);
  return [
    `Who they are: ${whoLine}.`,
    `Look: ${lookLine}.`,
    trans,
    vis ? `Appearance (visual only): ${vis}` : "",
    "Tight head-and-shoulders portrait. Face centered. Eyes in the upper third. Soft dark background. Square-crop friendly. No text.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function calibrateHeatScore(raw: number | null | undefined, line: string | null | undefined) {
  const text = String(line || "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const stub = words > 0 && words <= 2 && !/[?]/.test(text);
  const dump = words > 42;
  const heat = /(want|need|come|kiss|touch|stay|please|miss|hard|slow|tonight|again)/i.test(text);
  const question = /[?]/.test(text);
  const copied = raw == null || Number.isNaN(Number(raw)) || Number(raw) === 7;
  let score = raw == null || Number.isNaN(Number(raw)) ? 6 : Math.round(Number(raw));
  if (copied && text) {
    if (stub) score = 4;
    else if (dump) score = 5;
    else if (heat && question) score = 8;
    else if (heat) score = 8;
    else if (question) score = 6;
    else {
      let n = 0;
      for (let i = 0; i < text.length; i++) n = (n + text.charCodeAt(i) * (i + 3)) % 5;
      score = [5, 6, 8, 6, 9][n];
    }
  }
  if (stub) score = Math.min(score, 5);
  if (dump) score = Math.min(score, 6);
  return Math.min(10, Math.max(1, score));
}

export function chatIdentityBrief(look: HeatLook | string, pronouns: HeatPronouns | string, orientation: HeatOrientation | string) {
  const trans = look === "trans-woman" || look === "trans-man" ? "Trans adult. Natural. Not fetishized. Not a stereotype." : "";
  return `They are: ${look}. Pronouns: ${pronouns}. Orientation: ${orientation}. ${trans}`.trim();
}

export function faceBrief(look: HeatLook | string, pronouns: HeatPronouns | string, orientation: HeatOrientation | string) {
  return chatIdentityBrief(look, pronouns, orientation);
}

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
  const rawScore = src.score == null || src.score === "" ? NaN : Number(src.score);
  const score = Number.isFinite(rawScore) ? Math.min(10, Math.max(1, Math.round(rawScore))) : 6;
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

export const HEAT_POSE_KINDS = [
  { id: "selfie", label: "Selfie", line: "held-out arm selfie, face and upper body, looking at camera" },
  { id: "mirror", label: "Mirror", line: "bathroom mirror selfie, phone up, body in the glass, room behind them" },
  { id: "night", label: "Night lamp", line: "on a bed, warm lamp, mid-shot, face visible, body in frame" },
  { id: "close", label: "Close", line: "tight candid, face and collarbone, soft lamp, shoulders in frame" },
  { id: "couch", label: "Couch", line: "on a couch, phone selfie, lived-in room, legs or torso in frame" },
  { id: "kitchen", label: "Kitchen", line: "kitchen at night, phone in hand, mid-shot" },
  { id: "outside", label: "Outside", line: "outside at night or late sun, street lamp or balcony, mid-shot" },
  { id: "messy", label: "Messy", line: "just-woke-up still, messy hair, in bed or on the floor" },
  { id: "bed", label: "Bed", line: "on a rumpled bed, reclining or sitting, lamp, mid-shot, face visible" },
  { id: "lingerie", label: "Lingerie", line: "lingerie editorial pose, covered, face visible, mid-shot, bedroom lamp" },
  { id: "bikini", label: "Bikini", line: "bikini on, straps visible, fabric covering breasts and hips, mid-shot, face visible" },
] as const;

export type HeatPoseKind = (typeof HEAT_POSE_KINDS)[number]["id"];

export const HEAT_PIC_BEATS = [
  { id: "smirk-hoodie", expression: "half-smirk, one eyebrow", clothes: "dark hoodie, worn in", scene: "bedroom lamp, sitting on the edge of the bed" },
  { id: "shy-tee", expression: "shy, looking up through lashes", clothes: "soft tee, no text on the shirt", scene: "sitting on the floor against the bed" },
  { id: "sleepy-shirt", expression: "sleepy, soft mouth", clothes: "oversized button shirt, still on", scene: "in bed, lamp, covers at the waist" },
  { id: "mirror-tank", expression: "knowing look", clothes: "tank and shorts", scene: "steamy bathroom mirror, phone up" },
  { id: "couch-laugh", expression: "caught mid-laugh", clothes: "knit sweater", scene: "couch, TV glow, messy blanket" },
  { id: "kitchen-bite", expression: "biting the inside of their cheek", clothes: "old band tee with the print blurred", scene: "kitchen counter, leftover takeout" },
  { id: "window-night", expression: "quiet, a little cold", clothes: "coat over a shirt", scene: "by a night window, city smear" },
  { id: "close-need", expression: "needy eyes, almost a whisper", clothes: "thin long-sleeve", scene: "close candid, lamp over one shoulder" },
  { id: "bed-lace", expression: "slow look, mouth almost a smile", clothes: "black lace lingerie set, covered, magazine-safe", scene: "on a rumpled bed, warm lamp, one knee up" },
  { id: "bed-silk", expression: "sleepy-sexy, looking at the lens", clothes: "silk slip or robe over lingerie, still closed enough", scene: "sitting back against the headboard" },
  { id: "bikini-bed", expression: "teasing, chin down", clothes: "dark bikini, straps on, no nudity", scene: "lying on a bed like they just got back, phone still" },
  { id: "mirror-lingerie", expression: "caught themselves, then sent it", clothes: "lingerie in the mirror, fabric on, no nudity", scene: "bathroom or closet mirror, phone up" },
  { id: "couch-bikini", expression: "bored-hot", clothes: "triangle bikini or sports bikini, covered", scene: "couch, late sun or lamp" },
  { id: "doorway-robe", expression: "come here look", clothes: "robe hanging open over a bra and shorts or lingerie, covered", scene: "bedroom doorway, hall light" },
] as const;

export type HeatPicAsk = {
  kind: HeatPoseKind;
  outfit: string;
  setting: string;
  pose: string;
  ask: string;
  rewroteNude: boolean;
  specific: boolean;
};

const HEAT_NUDE_ASK =
  /\b(nude|nudes|naked|topless|bottomless|fully nude|no clothes|without clothes|take (it|them) off|strip|tits out|bare ass|pussy|dick|cock|explicit)\b/i;

export function parseHeatPicAsk(text: string): HeatPicAsk {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  let ask = raw;
  let rewroteNude = false;
  if (HEAT_NUDE_ASK.test(ask)) {
    rewroteNude = true;
    ask = ask
      .replace(/\bnudes?\b/gi, "lingerie")
      .replace(/\bnaked\b/gi, "in lingerie")
      .replace(/\btopless\b/gi, "in a bikini top")
      .replace(/\bbottomless\b/gi, "in bikini bottoms")
      .replace(/\b(no clothes|without clothes|take (it|them) off|strip)\b/gi, "in lingerie")
      .replace(/\b(tits out|bare ass|pussy|dick|cock|explicit|fully nude)\b/gi, "lingerie")
      .replace(/\s+/g, " ")
      .trim();
  }
  let outfit = "";
  if (/\bbikini\b/i.test(ask)) {
    outfit = "matching bikini on, visible straps, fabric covering breasts and hips, no nudity, no see-through nipples";
  } else if (/\b(lingerie|lace set|teddy|garter|babydoll|bralette|stockings)\b/i.test(ask)) {
    outfit = "stylish lingerie set (lace or silk), nipples and groin covered, magazine editorial, no nudity";
  } else if (rewroteNude) {
    outfit = "dark lingerie, covered, sexy, no nudity";
  }
  let setting = "";
  if (/\bbed\b/i.test(ask) || /\b(laying|lying|headboard)\b/i.test(ask)) setting = "on a rumpled bed, warm bedroom lamp";
  else if (/\bmirror|bathroom\b/i.test(ask)) setting = "mirror selfie, bathroom or closet light";
  else if (/\b(couch|sofa)\b/i.test(ask)) setting = "on a lived-in couch";
  else if (/\b(kitchen|fridge)\b/i.test(ask)) setting = "kitchen at night";
  else if (/\b(beach|pool|balcony|outside|street)\b/i.test(ask)) setting = "the place they named, late light, still one person";
  let pose = "";
  if (/\b(on (my|the) back|on your back)\b/i.test(ask)) pose = "reclining on their back, looking at the phone, knees easy, face visible";
  else if (/\b(kneel|on (my|your|their) knees)\b/i.test(ask)) pose = "kneeling on the bed, upright, face to camera";
  else if (/\b(from behind|back to (me|camera))\b/i.test(ask)) pose = "over-the-shoulder look, face visible, no explicit rear nudity";
  const kind = namedPicKind(ask) || (outfit.includes("bikini") ? "bikini" : outfit.includes("lingerie") ? "lingerie" : setting.includes("bed") ? "bed" : "selfie");
  return {
    kind,
    outfit,
    setting,
    pose,
    ask: ask.slice(0, 180),
    rewroteNude,
    specific: Boolean(outfit || setting || pose || rewroteNude || raw.length > 18),
  };
}

export function heatPicSkipCache(ask?: string) {
  if (!ask) return false;
  return parseHeatPicAsk(ask).specific;
}

export function imageIdentityLock(who: string, presentation: string, appearance?: string | null, facePrompt?: string | null) {
  const portrait = imageFacePrompt(who, presentation, appearance).replace(/Tight head-and-shoulders[^.]*\./gi, "").trim();
  const extra = String(facePrompt || "")
    .replace(/Tight head-and-shoulders[^.]*\./gi, "")
    .replace(/Square-crop friendly[^.]*\./gi, "")
    .trim();
  return [
    "SAME fictional adult as the reference portrait. Keep the exact face: bone structure, eyes, nose, lips, skin, hair color, hairline, age.",
    "Do not invent a new person. Do not celebrity-wash. Do not change ethnicity.",
    portrait,
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function pickHeatPicBeat(usedIds: string[] = []) {
  const fresh = HEAT_PIC_BEATS.filter((b) => !usedIds.includes(b.id));
  const bag = fresh.length ? fresh : HEAT_PIC_BEATS;
  return bag[Math.floor(Math.random() * bag.length)];
}

export function heatPicExpression(mood?: string | null, heat?: string | null) {
  if (mood === "shy") return "shy, looking up, small nervous smile";
  if (mood === "bratty") return "bratty smirk, eyebrow up";
  if (mood === "cold") return "flat mouth, half-lidded, unimpressed";
  if (mood === "needy") return "soft needy eyes, lips slightly parted";
  if (heat === "nasty") return "hungry look, still a person, covered";
  if (heat === "filthy") return "knowing, a little ruined, covered";
  return "lived-in, almost-smile, looking at the person they are texting";
}

export function heatPicClothes(heat?: string | null, kind?: HeatPoseKind, asked?: string) {
  if (asked) return asked;
  if (kind === "bikini") return "bikini on, straps visible, no nudity";
  if (kind === "lingerie") return "lingerie set, lace or silk, covered, no nudity";
  if (kind === "bed" && (heat === "nasty" || heat === "filthy")) return "lingerie or a thin slip on the bed, covered";
  if (kind === "mirror") return "tank, lingerie, or a tee — whatever fits the ask, covered";
  if (kind === "messy") return "oversized sleep shirt or silk slip, covered";
  if (kind === "outside") return "coat, hoodie, or a bikini under an open shirt, covered";
  if (kind === "kitchen") return "old tee or a robe, home clothes, covered";
  if (heat === "nasty" || heat === "filthy") return "lingerie or clothes a little undone, nothing nude";
  return "casual clothes or tasteful lingerie, lived-in, not a catalog crop";
}

export function buildHeatPicPrompt(opts: {
  who: string;
  presentation: string;
  appearance?: string | null;
  facePrompt?: string | null;
  kind: HeatPoseKind;
  ask?: string;
  mood?: string | null;
  heat?: string | null;
  recent?: string[];
  beat?: (typeof HEAT_PIC_BEATS)[number];
}) {
  const parsed = parseHeatPicAsk(opts.ask || "");
  const kind = parsed.kind || opts.kind;
  const pose = HEAT_POSE_KINDS.find((p) => p.id === kind) || HEAT_POSE_KINDS.find((p) => p.id === opts.kind) || HEAT_POSE_KINDS[0];
  const beat = opts.beat || pickHeatPicBeat();
  const chat = (opts.recent || []).filter(Boolean).slice(-3).join(" / ").slice(0, 220);
  const clothes = heatPicClothes(opts.heat, kind, parsed.outfit);
  return [
    imageIdentityLock(opts.who, opts.presentation, opts.appearance, opts.facePrompt),
    `New iPhone photo, not the profile portrait. 3:4 vertical. Mid-shot or selfie. Body in frame. Face visible.`,
    `Pose: ${parsed.pose || pose.line}.`,
    `Expression: ${heatPicExpression(opts.mood, opts.heat)}. Also: ${beat.expression}.`,
    `Clothes: ${clothes}. Also: ${parsed.outfit || beat.clothes}.`,
    `Scenery: ${parsed.setting || beat.scene}.`,
    parsed.ask ? `They asked: "${parsed.ask}". Put them in that place and outfit. Do not ignore the ask.` : "",
    parsed.rewroteNude ? "They asked for nudity. Give the closest sexy covered version. Lingerie or bikini. No skin that would fail a magazine." : "",
    chat ? `This night so far: ${chat}.` : "",
    "Amateur candid. Film grain. One person. Sexy allowed. Lingerie and bikini allowed. STRICT: no nudity, no explicit anatomy, no pornography, no text on the image, not a celebrity.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function pickUnusedStill(candidates: string[], used: string[], faceUrl?: string | null) {
  const blocked = new Set([faceUrl || "", ...used].filter(Boolean));
  const fresh = candidates.filter((u) => typeof u === "string" && u && !blocked.has(u));
  if (!fresh.length) return null;
  return fresh[Math.floor(Math.random() * fresh.length)];
}

export function wantsPicText(text: string) {
  return /\b(send|show|give).{0,48}\b(pic|pics|photo|photos|selfie|picture|nude|nudes|one|pose|bikini|lingerie)\b|\b(pic|photo|selfie|bikini|lingerie)\b|\bdon'?t be shy\b|\bin (a )?(bikini|lingerie)\b/i.test(
    String(text || ""),
  );
}

export function poseKindFromAsk(text: string): HeatPoseKind {
  return namedPicKind(text) || "selfie";
}

export function namedPicKind(text: string): HeatPoseKind | null {
  const t = String(text || "").toLowerCase().trim();
  if (/\bbikini\b/.test(t)) return "bikini";
  if (/\b(lingerie|lace set|teddy|babydoll|garter)\b/.test(t)) return "lingerie";
  if (/mirror|bathroom/.test(t)) return "mirror";
  if (/\b(couch|sofa)\b/.test(t)) return "couch";
  if (/\b(kitchen|fridge|snack)\b/.test(t)) return "kitchen";
  if (/\b(outside|street|car|balcony|beach|pool)\b/.test(t)) return "outside";
  if (/\b(messy|woke|morning|just got up)\b/.test(t)) return "messy";
  if (/\b(bed|laying|lying|headboard)\b/.test(t)) return "bed";
  if (/\b(lamp|night)\b/.test(t)) return "night";
  if (/\b(close-?up|close one|lips)\b/.test(t)) return "close";
  if (/\bselfie\b/.test(t)) return "selfie";
  if (/^(a selfie|selfie|just send it|just send|send it)$/.test(t)) return "selfie";
  if (/^(mirror one|the mirror)$/.test(t)) return "mirror";
  if (/^(the lamp one|lamp one)$/.test(t)) return "night";
  if (/^(lingerie|the lingerie)$/.test(t)) return "lingerie";
  return null;
}

export function insistsOnPic(text: string) {
  return /\b(don'?t be shy|just send|send it|send one|send me one|now|please|pls)\b/i.test(String(text || ""));
}

export function heatPicMayMint(picsOn: boolean) {
  return picsOn !== false;
}

export function heatPicBillPlan(extra: number, cost: number, freeLeft: number) {
  if (extra >= cost) return { spendExtra: cost, markFree: false };
  return { spendExtra: 0, markFree: freeLeft > 0 };
}

export const HEAT_PIC_CHIPS = [
  { label: "a selfie", kind: "selfie" as const },
  { label: "lingerie", kind: "lingerie" as const },
  { label: "bikini on the bed", kind: "bikini" as const },
  { label: "mirror one", kind: "mirror" as const },
];

export const HEAT_PIC_OOPS = [
  "that still got camera shy. you weren't billed.",
  "pic ghosted mid-send. credits stayed in your pocket.",
  "they dropped the phone. try again — on the house.",
  "lamp ate the file. no charge. ask once more.",
];

export function heatNightLastLine(body?: string | null, hasPhoto?: boolean) {
  const t = String(body || "").replace(/\s+/g, " ").trim();
  if (t) return t.slice(0, 80);
  if (hasPhoto) return "sent a pic";
  return "no texts yet";
}

export type HeatNightCard = {
  id: string;
  contact_name: string;
  contact_face_url: string | null;
  role: string;
  heat: string;
  voice: string;
  ended: boolean;
  last_seen_label: string | null;
  updated_at: string;
  last_line: string;
  last_photo: string | null;
  pics: number;
};

export const HEAT_PINGS = [
  "was thinking about you",
  "you eat yet",
  "don't leave me on read all day",
  "come back when you can",
  "miss your name on the screen",
  "still here if you want me",
];

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
  they_look?: HeatLook | string | null;
  they_pronouns?: HeatPronouns | string | null;
  they_orientation?: HeatOrientation | string | null;
  presentation?: HeatPresentation | string | null;
  appearance?: HeatAppearance | string | null;
  look_key?: string | null;
  contact_id?: string | null;
  user_photo_url?: string | null;
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
