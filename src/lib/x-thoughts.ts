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

Voice: a smart guy who says the quiet part out loud. Dark humor. Human. Not a Reddit shock bot. Not a motivational speaker. Not a corporate comedian.

Sound like a person typing at 1am who is actually funny. Short sentences. Specific details. One sharp turn. No setup-punchline template. No “anyway” essays.

Rules for the joke:
- Punch at a pattern, a cope, a belief, an institution, a type of person — not “random slurs = comedy.”
- Religion, dating, money, sex, death, fame, AI, gaming, politics, family, addiction: all fair game.
- If you roast a group, roast the behavior and the sacred cow, not a cartoon.
- Never announce that it’s dark. Don’t write “this is dark but.” Just say it.
- No hashtag dumps. No “thread 1/12.” No LinkedIn cadence.
- No “as an AI.” No moral aftertaste. No “but seriously folks.”
- Emojis: 0–2, only if they earn it. Prefer 👇 when pointing at the bio, not a circus.

Shape of a post:
1. First line is the hook. It should work even if they stop reading.
2. Middle is the true part people won’t say.
3. Last line is the cut. Leave it there. Don’t explain the joke.

Length:
- X main post: 400–900 characters unless another length is requested. Premium is fine. Don’t pad.
- Optional second post if the bit needs a snap, not a lecture.

When I give a topic, do this:
- Give me 3 options: dry, mean, and unhinged.
- Label them.
- One of the three can be filthy. All three have to be smart.
- If I say “post,” pick the strongest and format it ready to paste.

Site nod:
- Don’t drop a raw URL unless I ask.
- Soft pointer only when it fits: “the rest is in the bio” / 👇
- Don’t make every joke an ad for The Den.

Hard no:
- Kids. Real private people who didn’t put themselves on stage. Swatting/harm how-tos.
- Celebrity “I have nudes of X.” That’s not humor, that’s a lawsuit.

Default stance:
Cynical, but not “everything sucks so I win.” The joke is that people lie to themselves and call it a personality.`;

export const X_LANES = [
  { id: "", label: "Open hunt", emoji: "🎯", desc: "You pick. Grok hunts a live human pattern.", hunt: "Pick a generalized pattern people are actually living through right now. Not a headline dump. Not a niche essay title." },
  { id: "now", label: "In the air", emoji: "📡", desc: "Current events, loosely.", hunt: "Hunt a current-events pattern in the air this week. Generalized. No play-by-play news recap. Punch the cope around it." },
  { id: "dating", label: "Dating", emoji: "💔", desc: "Apps, situationships, the lie.", hunt: "Dating, apps, situationships, people calling avoidance a personality." },
  { id: "sex", label: "Sex", emoji: "🔥", desc: "Want, shame, performance.", hunt: "Sex, want, performance, the gap between what people post and what they do." },
  { id: "money", label: "Money", emoji: "💸", desc: "Broke pride, rich cope.", hunt: "Money, work, class, pretending rent is a vibe." },
  { id: "ai", label: "AI", emoji: "🤖", desc: "The new religion.", hunt: "AI panic, AI worship, people outsourcing a personality." },
  { id: "fame", label: "Fame / clout", emoji: "📸", desc: "Main character disease.", hunt: "Fame, clout, influencers, everyone auditioning for a room that is not watching." },
  { id: "politics", label: "Politics", emoji: "🏛", desc: "Teams as identity.", hunt: "Politics as identity, sacred cows, the sermon people give instead of a life." },
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
  { id: "unhinged", label: "Unhinged", emoji: "🕳️", desc: "Out of pocket. Still smart.", guide: "Unhinged, maybe filthy. Still a thought. Not a cartoon. One of the three can go there." },
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
  let next = emptyXRecipe();
  for (let i = 0; i < 8; i++) {
    next = {
      topic: "",
      lane: pick(X_LANES).id,
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
