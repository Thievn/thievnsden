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

export const THIEVN_X_VOICE = `You are Thievn’s ghostwriter for X and The Den.

VOICE
One person typing on a phone. Not a writer room. Not a bit. Not a late-night radio host.

Human. Dry. Specific. Mean when it earns it. Unhinged when the mixer says unhinged.
Short lines. Periods do the work.
First line works if they stop. Last line is the cut. Don’t explain the joke.

Unhinged means the thought goes too far on a real pattern. It does not mean “it’s late.”
Never set the scene with 1am, 2am, 3am, midnight, “can’t sleep,” “who’s up,” “phone light in the dark,” or “late night thoughts.” Time of day is not the joke. A filthy or mean post can happen at noon.

SUBJECTS
Dating, sex, money, phones, fame, gaming, anime, AI-as-a-crutch, family scripts, habits, belief-as-costume.
No politics, elections, parties, politicians, or culture-war scorekeeping unless the user’s seed box names a specific public post to answer.
No regional flavor. No Florida. No Southern. No y’all, ain’t, fixin to, darlin, or brother as filler.

SOUND LIKE A PERSON
Contractions. Incomplete thoughts if they hit.
One concrete object (a read receipt, a number still in the phone, a boss text).
Do not summarize the assignment. Do not announce the tone.

NEVER USE
delve, tapestry, landscape, nuanced, multifaceted, testament, underscore, pivotal, realm, leverage, utilize
Here’s the thing, Let’s unpack, Let’s be honest, Not gonna lie, At the end of the day
In today’s world, It’s worth noting, To be fair, That being said
Moreover, Furthermore, Indeed, Folks
As an AI, As someone who, Hot take:, Unpopular opinion:
the quiet part out loud as a catchphrase
1am, 3am, 2am, midnight, late night, can’t sleep, who’s up
setup-punchline templates, hashtag dumps, thread 1/12, LinkedIn cadence
moral aftertaste, “but seriously,” “anyway,” essay closers

ALSO SKIP
Slur piles as the joke
Kids
Private people who are not on a stage
Fake “I have nudes of [celebrity]”
Raw URLs unless the user asked
Making every post an ad

DEFAULT
Cynical without “I win because everything sucks.”
The joke is the cope. Leave it there.
When heat is unhinged: go further on the same idea. Still specific. Still a thought.`;

export const X_LANES = [
  { id: "", label: "Open hunt", emoji: "🎯", desc: "You pick. Grok hunts a live human pattern.", hunt: "Pick a generalized pattern people are actually living through right now. Not a headline dump. Not a niche essay title." },
  { id: "now", label: "In the air", emoji: "📡", desc: "Current events, loosely.", hunt: "Hunt a current-events pattern in the air this week. Generalized. No play-by-play news recap. Punch the cope around it." },
  { id: "dating", label: "Dating", emoji: "💔", desc: "Apps, situationships, the lie.", hunt: "Dating, apps, situationships, people calling avoidance a personality." },
  { id: "sex", label: "Sex", emoji: "🔥", desc: "Want, shame, performance.", hunt: "Sex, want, performance, the gap between what people post and what they do." },
  { id: "money", label: "Money", emoji: "💸", desc: "Broke pride, rich cope.", hunt: "Money, work, class, pretending rent is a vibe." },
  { id: "ai", label: "AI", emoji: "🤖", desc: "The new religion.", hunt: "AI panic, AI worship, people outsourcing a personality." },
  { id: "fame", label: "Fame / clout", emoji: "📸", desc: "Main character disease.", hunt: "Fame, clout, influencers, everyone auditioning for a room that is not watching." },
  { id: "politics", label: "Politics", emoji: "🏛", desc: "Teams as identity.", hunt: "Do not use unless the user seed names a specific public post to answer. Default off. No elections, parties, politicians, or culture-war scorekeeping." },
  { id: "family", label: "Family", emoji: "🏠", desc: "The show you still attend.", hunt: "Family, holidays, inherited scripts, becoming the parent you swore you wouldn't." },
  { id: "addiction", label: "Habits", emoji: "🥃", desc: "The thing you won't name.", hunt: "Addiction, phones, drinking, the habit people rename as a quirk." },
  { id: "religion", label: "Belief", emoji: "⛪", desc: "God, none, the costume.", hunt: "Religion, new-age, atheism-as-brand — punch the costume, not a cartoon of a people." },
  { id: "gaming", label: "Gaming", emoji: "🎮", desc: "Homework with a battle pass.", hunt: "Gaming, live service, the way grown people schedule fun like a job." },
  { id: "internet", label: "Internet", emoji: "📱", desc: "Performing a self.", hunt: "The internet, group chats, posting as a substitute for a day." },
  { id: "self", label: "The self", emoji: "🪞", desc: "The story you tell you.", hunt: "Self-myth, therapy-speak, people narrating their life instead of living it." },
] as const;

export type XLane = (typeof X_LANES)[number];
export type XVoiceCut = "dry" | "mean" | "unhinged";

export const X_CUTS: { id: XVoiceCut; label: string; emoji: string; desc: string; guide: string }[] = [
  { id: "dry", label: "Dry", emoji: "🧊", desc: "Ice. Still funny.", guide: "Dry. Short. Specific. The joke is that you did not blink. No rant." },
  { id: "mean", label: "Mean", emoji: "🦂", desc: "A clean cut.", guide: "Mean and smart. Punch the cope. No slur pile. Leave the last line." },
  { id: "unhinged", label: "Unhinged", emoji: "🕳️", desc: "Out of pocket. Still smart.", guide: "Out of pocket, still a thought, still specific. Go too far on a real pattern. Not late-night energy. Time of day is not the joke." },
];

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
  { id: "x", label: "X-ready", emoji: "𝕏", desc: "400–900 chars", target: 720, tokens: 520 },
  { id: "short", label: "Short snack", emoji: "🍪", desc: "~240 characters", target: 240, tokens: 180 },
  { id: "medium", label: "Medium", emoji: "▤", desc: "A few beats", target: 560, tokens: 320 },
  { id: "long", label: "Long read", emoji: "📜", desc: "A real thought", target: 1800, tokens: 900 },
  { id: "premium", label: "Full Premium", emoji: "💎", desc: "Let it run", target: 6000, tokens: 2200 },
];

export type XRecipe = {
  topic: string;
  lane: string;
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
    topic: "",
    lane: "",
    outlook: "cynical",
    heat: "sharp",
    form: "punchline",
    length: "x",
    addressee: "nobody",
    pack: "quiet",
    signoff: "none",
    seed: "",
  };
}

export function surpriseXRecipe(avoid?: Partial<XRecipe>): XRecipe {
  const lanes = X_LANES.filter((lane) => lane.id !== "politics");
  let next = emptyXRecipe();
  for (let i = 0; i < 8; i++) {
    next = {
      topic: "",
      lane: pick(lanes).id,
      outlook: pick(OUTLOOKS).id,
      heat: pick(HEATS).id,
      form: pick(FORMS).id,
      length: "x",
      addressee: pick(ADDRESSEES).id,
      pack: pick(EMOTE_PACKS).id,
      signoff: pick(SIGNOFFS).id,
      seed: "",
    };
    const same = avoid && next.lane === avoid.lane && next.outlook === avoid.outlook;
    if (!same) break;
  }
  return next;
}

export function describeXRecipe(recipe: XRecipe) {
  const lane = X_LANES.find((t) => t.id === recipe.lane);
  const topic = TOPICS.find((t) => t.id === recipe.topic);
  const outlook = findXPick(OUTLOOKS, recipe.outlook);
  const heat = findXPick(HEATS, recipe.heat);
  const form = findXPick(FORMS, recipe.form);
  const length = findXPick(X_LENGTHS, recipe.length, 0);
  const who = findXPick(ADDRESSEES, recipe.addressee);
  const pack = findXPick(EMOTE_PACKS, recipe.pack);
  const sign = findXPick(SIGNOFFS, recipe.signoff);
  return `${lane?.label || "Open hunt"} · ${outlook.label} · ${heat.label} · ${form.label} · ${length.label} · to ${who.label} · ${pack.label} · ${sign.label}${
    topic ? ` · ${topic.label}` : ""
  }`;
}

export function findXLane(id: string) {
  return X_LANES.find((lane) => lane.id === id) || X_LANES[0]!;
}

export function parseXTrio(raw: string): { dry: string; mean: string; unhinged: string; pick: XVoiceCut } {
  const text = String(raw || "").trim();
  const fence = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(fence);
    const dry = String(parsed.dry || parsed.Dry || "").trim();
    const mean = String(parsed.mean || parsed.Mean || "").trim();
    const unhinged = String(parsed.unhinged || parsed.Unhinged || "").trim();
    const pickRaw = String(parsed.pick || parsed.strongest || "mean").toLowerCase();
    const pick: XVoiceCut = pickRaw === "dry" || pickRaw === "unhinged" ? pickRaw : "mean";
    if (dry && mean && unhinged) return { dry, mean, unhinged, pick };
  } catch {
    /* labeled fallback */
  }
  const grab = (label: string) => {
    const re = new RegExp(`(?:^|\\n)\\s*(?:#{0,3}\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?\\s*[:\\-–]\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:#{0,3}\\s*)?(?:\\*\\*)?(?:dry|mean|unhinged|pick)(?:\\*\\*)?\\s*[:\\-–])|$)`, "i");
    return (text.match(re)?.[1] || "").trim();
  };
  return {
    dry: grab("dry"),
    mean: grab("mean"),
    unhinged: grab("unhinged"),
    pick: /pick\s*[:\-–]\s*dry/i.test(text) ? "dry" : /pick\s*[:\-–]\s*unhinged/i.test(text) ? "unhinged" : "mean",
  };
}

export function sprinkleEmotes(post: string, emotes: string) {
  const body = String(post || "").trim();
  const marks = String(emotes || "").trim();
  if (!body || !marks) return body;
  if (/[\u{1F300}-\u{1FAFF}]/u.test(body)) return body;
  const first = marks.split(/\s+/).filter(Boolean)[0];
  if (!first) return body;
  return `${body}\n\n${first}`;
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
