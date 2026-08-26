import { similarity, normalizePost } from "@/lib/x-posts";
import {
  ADDRESSEES,
  FORMS,
  HEATS,
  LENGTHS,
  OUTLOOKS,
  TOPICS,
  packOfTopic,
  type ThoughtPick,
} from "@/lib/thoughts-packs";

export type ThoughtRecipe = {
  topic: string;
  outlook: string;
  heat: string;
  form: string;
  length: string;
  addressee: string;
  seed: string;
};

export type ThoughtHit = {
  id: string;
  score: number;
  title: string;
  excerpt: string;
  published: boolean;
};

const pick = <T,>(list: readonly T[], rng = Math.random): T =>
  list[Math.floor(rng() * list.length)]!;

export function findPick(list: ThoughtPick[], id: string, fallback = 0) {
  return list.find((item) => item.id === id) || list[fallback]!;
}

export function emptyRecipe(): ThoughtRecipe {
  return {
    topic: "",
    outlook: "honest",
    heat: "sharp",
    form: "essay",
    length: "medium",
    addressee: "nobody",
    seed: "",
  };
}

export function surpriseRecipe(avoid?: Partial<ThoughtRecipe>): ThoughtRecipe {
  let next = emptyRecipe();
  for (let i = 0; i < 8; i++) {
    next = {
      topic: "",
      outlook: pick(OUTLOOKS).id,
      heat: pick(HEATS).id,
      form: pick(FORMS).id,
      length: pick(LENGTHS).id,
      addressee: pick(ADDRESSEES).id,
      seed: "",
    };
    const same = avoid && next.outlook === avoid.outlook && next.heat === avoid.heat && next.form === avoid.form;
    if (!same) break;
  }
  return next;
}

export function describeRecipe(recipe: ThoughtRecipe) {
  const topic = TOPICS.find((t) => t.id === recipe.topic);
  const outlook = findPick(OUTLOOKS, recipe.outlook);
  const heat = findPick(HEATS, recipe.heat);
  const form = findPick(FORMS, recipe.form);
  const length = findPick(LENGTHS, recipe.length);
  const who = findPick(ADDRESSEES, recipe.addressee);
  return `${outlook.label} · ${heat.label} · ${form.label} · ${length.label} · to ${who.label}${
    topic ? ` · ${topic.label}` : ""
  }`;
}

export function thoughtFingerprint(title: string, excerpt: string, body: string) {
  return normalizePost(`${title} ${excerpt} ${body}`).slice(0, 700);
}

export function findThoughtDupes(
  title: string,
  excerpt: string,
  body: string,
  rows: Array<{ id: string; title?: string; excerpt?: string; body?: string; published?: boolean }>,
  skipId?: string
): ThoughtHit[] {
  const draft = `${title} ${excerpt} ${body}`;
  return rows
    .filter((row) => row.id !== skipId)
    .map((row) => ({
      id: row.id,
      score: Math.max(
        similarity(draft, `${row.title || ""} ${row.excerpt || ""}`),
        similarity(title, row.title || ""),
        similarity(body.slice(0, 800), String(row.body || "").slice(0, 800))
      ),
      title: row.title || "",
      excerpt: row.excerpt || "",
      published: Boolean(row.published),
    }))
    .filter((hit) => hit.score >= 0.42)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function lengthTokens(id: string) {
  if (id === "snack") return 420;
  if (id === "long") return 1600;
  return 900;
}

export function lengthGuide(id: string) {
  return findPick(LENGTHS, id, 1).guide || findPick(LENGTHS, "medium", 1).guide || "";
}

export function uniqueSlug(base: string, taken: Set<string>) {
  const clean = (base || "thought")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "thought";
  if (!taken.has(clean)) return clean;
  for (let i = 2; i < 40; i++) {
    const next = `${clean}`.slice(0, 68) + `-${i}`;
    if (!taken.has(next)) return next;
  }
  return `${clean}-${Date.now().toString(36)}`;
}

export function recipePack(topicId: string) {
  return packOfTopic(topicId);
}
