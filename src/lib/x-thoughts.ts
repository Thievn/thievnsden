import { similarity } from "@/lib/x-posts";
import {
  ADDRESSEES,
  FORMS,
  HEATS,
  OUTLOOKS,
  TOPICS,
  packOfTopic,
  type ThoughtPick,
} from "@/lib/thoughts-packs";

export const X_PREMIUM_CAP = 25000;

export const X_OUTLOOKS = OUTLOOKS;
export const X_HEATS = HEATS;
export const X_FORMS = FORMS;
export const X_ADDRESSEES = ADDRESSEES;

export type EmotePack = ThoughtPick & { emotes: string };
export type XLength = ThoughtPick & { target: number; tokens: number };
export type SignOff = ThoughtPick & { line: string };

export const EMOTE_PACKS: EmotePack[] = [
  { id: "quiet", label: "Quiet", emoji: "🖤", desc: "Soft marks", emotes: "🖤 🌹" },
  { id: "funny", label: "Funny", emoji: "😂", desc: "One laugh", emotes: "😂" },
  { id: "sharp", label: "Sharp", emoji: "😐", desc: "Ice, then a cut", emotes: "😐 🔪" },
  { id: "dry", label: "Dry", emoji: "💀", desc: "Dead inside, briefly", emotes: "💀" },
  { id: "filthy", label: "Filthy", emoji: "🔥", desc: "Goes there", emotes: "😏 🔥" },
  { id: "none", label: "No emotes", emoji: "◻", desc: "Words only", emotes: "" },
];

export const SIGNOFFS: SignOff[] = [
  { id: "bio", label: "Link in bio", emoji: "↗", desc: "The usual closer", line: "link in bio" },
  { id: "den-bio", label: "Den + bio", emoji: "🕳", desc: "Point them inside", line: "more in the den · link in bio" },
  { id: "written", label: "Written in the den", emoji: "✎", desc: "No URL energy", line: "written in the den" },
  { id: "none", label: "No sign-off", emoji: "◻", desc: "End on the thought", line: "" },
];

export const X_LENGTHS: XLength[] = [
  { id: "short", label: "Short snack", emoji: "🍪", desc: "~240 characters", target: 240, tokens: 180 },
  { id: "medium", label: "Medium", emoji: "▤", desc: "A few beats", target: 560, tokens: 320 },
  { id: "long", label: "Long read", emoji: "📜", desc: "A real thought", target: 1800, tokens: 900 },
  { id: "premium", label: "Full Premium", emoji: "💎", desc: "Let it run", target: 6000, tokens: 2200 },
];

export type XRecipe = {
  topic: string;
  outlook: string;
  heat: string;
  form: string;
  length: string;
  addressee: string;
  pack: string;
  signoff: string;
  seed: string;
};

const pick = <T,>(list: readonly T[], rng = Math.random): T =>
  list[Math.floor(rng() * list.length)]!;

export function findXPick<T extends { id: string }>(list: T[], id: string, fallback = 0) {
  return list.find((item) => item.id === id) || list[fallback]!;
}

export function emptyXRecipe(): XRecipe {
  return {
    topic: TOPICS[2]?.id || TOPICS[0].id,
    outlook: "honest",
    heat: "sharp",
    form: "essay",
    length: "medium",
    addressee: "nobody",
    pack: "dry",
    signoff: "bio",
    seed: "",
  };
}

export function surpriseXRecipe(avoid?: Partial<XRecipe>): XRecipe {
  let next = emptyXRecipe();
  for (let i = 0; i < 8; i++) {
    next = {
      topic: pick(TOPICS).id,
      outlook: pick(OUTLOOKS).id,
      heat: pick(HEATS).id,
      form: pick(FORMS).id,
      length: pick(X_LENGTHS).id,
      addressee: pick(ADDRESSEES).id,
      pack: pick(EMOTE_PACKS).id,
      signoff: pick(SIGNOFFS).id,
      seed: "",
    };
    const same =
      avoid &&
      next.topic === avoid.topic &&
      next.outlook === avoid.outlook &&
      next.heat === avoid.heat &&
      next.form === avoid.form;
    if (!same) break;
  }
  return next;
}

export function describeXRecipe(recipe: XRecipe) {
  const topic = TOPICS.find((t) => t.id === recipe.topic);
  const outlook = findXPick(OUTLOOKS, recipe.outlook);
  const heat = findXPick(HEATS, recipe.heat);
  const form = findXPick(FORMS, recipe.form);
  const length = findXPick(X_LENGTHS, recipe.length, 1);
  const who = findXPick(ADDRESSEES, recipe.addressee);
  const pack = findXPick(EMOTE_PACKS, recipe.pack);
  const sign = findXPick(SIGNOFFS, recipe.signoff);
  return `${outlook.label} · ${heat.label} · ${form.label} · ${length.label} · to ${who.label} · ${pack.label} · ${sign.label}${
    topic ? ` · ${topic.label}` : ""
  }`;
}

export function recipeTopicPack(topicId: string) {
  return packOfTopic(topicId);
}

export function xThoughtHits(
  draft: string,
  posts: Array<{ id: string; body?: string; url?: string | null; posted_at?: string | null }>,
  thoughts: Array<{ id: string; title?: string; excerpt?: string }>,
  skipId?: string
) {
  const scored = [
    ...posts
      .filter((row) => row.id !== skipId)
      .map((row) => ({
        id: row.id,
        score: similarity(draft, String(row.body || "")),
        body: String(row.body || ""),
        url: row.url || null,
        posted_at: row.posted_at || null,
        kind: "x" as const,
      })),
    ...thoughts.map((row) => ({
      id: row.id,
      score: Math.max(
        similarity(draft, `${row.title || ""} ${row.excerpt || ""}`),
        similarity(draft.slice(0, 280), String(row.title || ""))
      ),
      body: `${row.title || ""}${row.excerpt ? ` — ${row.excerpt}` : ""}`,
      url: null,
      posted_at: null,
      kind: "thought" as const,
    })),
  ]
    .filter((hit) => hit.score >= 0.42)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}
