import type { WyrHeat, WyrLean, WyrPack, WyrPair } from "./wyr-data";
import { WYR_CONTRASTS, WYR_TOPICS, TOPIC_PACK, type WyrTopic } from "./wyr-topics";
import { pairToRow } from "./wyr-map";

export const POOL_TARGET = 500;
export const REFILL_BELOW = 460;
export const REFILL_BATCH = 16;
export const REFILL_COOLDOWN_MS = 12 * 60 * 1000;

const HEATS: WyrHeat[] = ["clean", "spicy", "nasty"];
const PACKS = new Set<string>([
  "bodies",
  "reputation",
  "money",
  "love",
  "celebs",
  "people",
  "internet",
  "power",
  "family",
  "work",
  "chaos",
]);

const HOOKUP_RE = /\b(sleep with|hook up|have sex|fuck|one night stand)\b/i;

function contentWords(s: string) {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(
        (w) =>
          w.length > 3 &&
          !["with", "your", "their", "that", "this", "from", "have", "them", "about"].includes(w)
      )
  );
}

export function tooSimilar(a: string, b: string) {
  const A = contentWords(a);
  const B = contentWords(b);
  if (!A.size || !B.size) return true;
  const inter = [...A].filter((x) => B.has(x));
  const union = new Set([...A, ...B]);
  return inter.length / union.size >= 0.38;
}

export function pairFingerprint(a: string, b: string) {
  const n = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return [n(a), n(b)].sort().join("|");
}

function clampLean(raw: unknown): WyrLean {
  const o = (raw || {}) as Record<string, unknown>;
  const n = (v: unknown) => Math.min(2, Math.max(0, Math.round(Number(v) || 0)));
  return { appetite: n(o.appetite), image: n(o.image), stay: n(o.stay) };
}

function asHeat(v: unknown): WyrHeat {
  return HEATS.includes(v as WyrHeat) ? (v as WyrHeat) : "spicy";
}

function asTopic(v: unknown, fallback: WyrTopic): WyrTopic {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  return (WYR_TOPICS as readonly string[]).includes(s) ? (s as WyrTopic) : fallback;
}

function asPacks(raw: unknown, topic: WyrTopic, topicB: WyrTopic): WyrPack[] {
  const fromRaw = (Array.isArray(raw) ? raw : [])
    .map((p) => String(p))
    .filter((p) => PACKS.has(p)) as WyrPack[];
  const extra = [TOPIC_PACK[topic], TOPIC_PACK[topicB]].filter((p) =>
    PACKS.has(p)
  ) as WyrPack[];
  const out = [...new Set([...fromRaw, ...extra])];
  return (out.length ? out : ["people"]) as WyrPack[];
}

function newId() {
  return `floor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseGeneratedPairs(
  raw: unknown,
  contrast: [WyrTopic, WyrTopic],
  seen: Set<string>
): WyrPair[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).pairs)
      ? (raw as any).pairs
      : [];
  const out: WyrPair[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const a = String(item.a || "").trim();
    const b = String(item.b || "").trim();
    if (a.length < 22 || b.length < 22) continue;
    if (a.length > 200 || b.length > 200) continue;
    if (a.toLowerCase() === b.toLowerCase()) continue;
    const bothHookups = HOOKUP_RE.test(a) && HOOKUP_RE.test(b);
    if (bothHookups) continue;
    if (tooSimilar(a, b)) continue;
    const fp = pairFingerprint(a, b);
    if (seen.has(fp)) continue;
    const topic = asTopic(item.topic, contrast[0]);
    const topicB = asTopic(item.topic_b || item.topicB, contrast[1]);
    if (topic === topicB) continue;
    seen.add(fp);
    out.push({
      id: String(item.id || "").startsWith("floor-") ? String(item.id) : newId(),
      a,
      b,
      heat: asHeat(item.heat),
      packs: asPacks(item.packs, topic, topicB),
      aLean: clampLean(item.a_lean || item.aLean),
      bLean: clampLean(item.b_lean || item.bLean),
      topic,
      topicB,
      aSting:
        String(item.a_sting || item.aSting || "").trim().slice(0, 140) ||
        `You picked ${topic}. The Floor heard that.`,
      bSting:
        String(item.b_sting || item.bSting || "").trim().slice(0, 140) ||
        `You picked ${topicB}. Lights stay on.`,
    });
  }
  return out;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {}
  }
  const a0 = trimmed.indexOf("[");
  const a1 = trimmed.lastIndexOf("]");
  if (a0 >= 0 && a1 > a0) {
    try {
      return JSON.parse(trimmed.slice(a0, a1 + 1));
    } catch {}
  }
  throw new Error("GENERATE_FAILED: model did not return JSON");
}

export function wyrSystemPrompt() {
  return `You write Would You Rather questions for The Floor, a late-night 18+ gameshow in Thievn's Den.

VOICE
Specific. Visual. Adult. Unhinged but still human. Like a host who has seen too much and still wants a good show.
Not Twitter bait. Not cosmic superpowers. Not "infinite money vs true love". Not two flavors of the same hookup.

THE RULE THAT MATTERS
Side A and side B must cost DIFFERENT things. If A costs the body, B costs the name, the family, the money, the job, the internet, the friendship, or the time. Contrast domains. Never two sex options. Never two fame options. Never two money options. Never two "be with this person vs that person" dating clones.

Each side needs a concrete hook: a place, a duration, an object, a dollar amount, a person-type, a public consequence, or a clock time. The player should be able to see it.

Heat mix in every batch:
- clean: petty, social, career, family, dignity. No sex.
- spicy: desire, reputation, messy loyalty, implied sex, public shame.
- nasty: explicit adult, filthy, humiliating, still a real human choice. 18+ only.

HARD BANS
Minors. Anyone who could be under 21. Suicide. Self-harm. Real private civilians (celebrities are fine, sparingly). Gore as the joke. Magic powers. Identical sentence structure across the batch.

STINGS
You are the host. After they pick a side, clock them in 16 words or fewer. Second person. No hashtags. No emoji. Dry, funny, a little mean.

OUTPUT
JSON only. No markdown.
{"pairs":[{
  "a":"...",
  "b":"...",
  "heat":"clean"|"spicy"|"nasty",
  "topic":"...",
  "topic_b":"...",
  "packs":["bodies"|"reputation"|"money"|"love"|"celebs"|"people"|"internet"|"power"|"family"|"work"|"chaos"],
  "a_lean":{"appetite":0-2,"image":0-2,"stay":0-2},
  "b_lean":{"appetite":0-2,"image":0-2,"stay":0-2},
  "a_sting":"...",
  "b_sting":"..."
}]}

leans: appetite = how hard/horny/hungry the pick is. image = how much they protect looking intact. stay = how much they pick the livable/attached option.`;
}

export function wyrUserPrompt(opts: {
  count: number;
  contrast: [WyrTopic, WyrTopic];
  avoid: string[];
  wave: number;
}) {
  const avoidBlock =
    opts.avoid.length > 0
      ? `\nDo not repeat or lightly remix these existing sides:\n- ${opts.avoid.slice(0, 24).join("\n- ")}`
      : "";
  const heatHint =
    opts.wave % 3 === 0
      ? "Lean nastier this batch, but still include at least 3 clean."
      : opts.wave % 3 === 1
        ? "Lean spicier this batch, with 4 clean petty ones."
        : "More clean/petty and career/family this batch, with 4 nasty for contrast.";
  return `Write ${opts.count} original Would You Rather pairs for The Floor.

TONIGHT'S CONTRAST (must drive every pair): ${opts.contrast[0]} vs ${opts.contrast[1]}
Side A should mostly cost ${opts.contrast[0]}. Side B should mostly cost ${opts.contrast[1]}. They can swap, but both topics must be present and opposed.

${heatHint}
Vary settings: work, family dinner, group chat, hotel, internet, money, a party, a job, a long car ride, a holiday, a tiny fame moment. Do not make the whole batch about sex.
Each pair must feel like a different show. ${avoidBlock}

Return JSON now.`;
}

export async function generateWyrBatch(opts: {
  count?: number;
  contrast?: [WyrTopic, WyrTopic];
  seen: Set<string>;
  avoid?: string[];
  wave?: number;
}): Promise<WyrPair[]> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const count = Math.min(20, Math.max(8, opts.count || 16));
  const contrast =
    opts.contrast || WYR_CONTRASTS[Math.floor(Math.random() * WYR_CONTRASTS.length)];
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.3",
      messages: [
        { role: "system", content: wyrSystemPrompt() },
        {
          role: "user",
          content: wyrUserPrompt({
            count,
            contrast,
            avoid: opts.avoid || [],
            wave: opts.wave || 0,
          }),
        },
      ],
      temperature: 1.08,
      max_tokens: 7000,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GENERATE_FAILED: ${res.status} ${t.slice(0, 240)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("GENERATE_FAILED: empty model response");
  const parsed = extractJson(text);
  return parseGeneratedPairs(parsed, contrast, opts.seen);
}

type ServiceClient = {
  from: (table: string) => any;
};

export async function loadFingerprints(supabase: ServiceClient) {
  const seen = new Set<string>();
  const avoid: string[] = [];
  const { data, error } = await supabase.from("wyr_pairs").select("a, b");
  if (error) throw new Error(error.message);
  for (const row of data || []) {
    if (!row?.a || !row?.b) continue;
    seen.add(pairFingerprint(row.a, row.b));
    if (avoid.length < 40) avoid.push(String(row.a).slice(0, 120));
  }
  return { seen, avoid };
}

export async function insertPairs(supabase: ServiceClient, pairs: WyrPair[], source = "grok") {
  if (!pairs.length) return 0;
  const rows = pairs.map((p) => pairToRow(p, source));
  const { error } = await supabase.from("wyr_pairs").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function generateAndInsert(
  supabase: ServiceClient,
  opts: { count: number; replace?: boolean }
) {
  const target = Math.min(520, Math.max(8, opts.count));
  const { seen, avoid } = opts.replace
    ? { seen: new Set<string>(), avoid: [] as string[] }
    : await loadFingerprints(supabase);
  const collected: WyrPair[] = [];
  let wave = 0;
  let failures = 0;
  const parallel = target > 32 ? 4 : 1;
  while (collected.length < target && wave < 48 && failures < 10) {
    const remaining = target - collected.length;
    const jobs = Array.from({ length: parallel }, (_, i) => {
      const contrast = WYR_CONTRASTS[(wave + i) % WYR_CONTRASTS.length];
      const batchSize = Math.min(16, Math.max(8, remaining - i * 12 + 4));
      return generateWyrBatch({
        count: batchSize,
        contrast,
        seen,
        avoid: avoid.slice(-28),
        wave: wave + i,
      });
    });
    const results = await Promise.allSettled(jobs);
    let got = 0;
    for (const result of results) {
      if (result.status === "rejected") {
        failures += 1;
        console.warn("batch failed:", result.reason?.message || result.reason);
        continue;
      }
      for (const p of result.value) {
        if (collected.length >= target) break;
        collected.push(p);
        avoid.push(p.a.slice(0, 120));
        got += 1;
      }
    }
    if (got === 0) failures += 1;
    else failures = Math.max(0, failures - 1);
    wave += parallel;
    console.log(`pool ${collected.length}/${target} after wave ${wave}`);
  }
  const unique: WyrPair[] = [];
  const fps = new Set<string>();
  for (const p of collected) {
    const fp = pairFingerprint(p.a, p.b);
    if (fps.has(fp)) continue;
    fps.add(fp);
    unique.push(p);
  }
  if (unique.length < Math.min(8, target)) {
    throw new Error(`GENERATE_FAILED: only ${unique.length} unique pairs`);
  }
  if (opts.replace) {
    await supabase.from("wyr_votes").delete().neq("pair_id", "");
    await supabase.from("wyr_pairs").delete().neq("id", "");
  }
  for (let i = 0; i < unique.length; i += 80) {
    await insertPairs(supabase, unique.slice(i, i + 80), "grok");
  }
  return { inserted: unique.length, waves: wave };
}

function metaValue(raw: any) {
  return raw && typeof raw === "object" ? raw : {};
}

export async function maybeRefillPool(supabase: ServiceClient) {
  const { count } = await supabase
    .from("wyr_pairs")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  if ((count || 0) >= REFILL_BELOW) return { skipped: true, reason: "full", count };
  const { data: metaRow } = await supabase
    .from("wyr_meta")
    .select("value, updated_at")
    .eq("key", "pool")
    .maybeSingle();
  const value = metaValue(metaRow?.value);
  if (value.refilling) return { skipped: true, reason: "busy", count };
  const last = value.last_refill_at ? Date.parse(value.last_refill_at) : 0;
  if (last && Date.now() - last < REFILL_COOLDOWN_MS) {
    return { skipped: true, reason: "cooldown", count };
  }
  await supabase.from("wyr_meta").upsert({
    key: "pool",
    value: { ...value, refilling: true },
    updated_at: new Date().toISOString(),
  });
  try {
    const result = await generateAndInsert(supabase, { count: REFILL_BATCH });
    await supabase.from("wyr_meta").upsert({
      key: "pool",
      value: {
        refilling: false,
        last_refill_at: new Date().toISOString(),
        last_inserted: result.inserted,
      },
      updated_at: new Date().toISOString(),
    });
    return { skipped: false, ...result, count };
  } catch (err: any) {
    await supabase.from("wyr_meta").upsert({
      key: "pool",
      value: { ...value, refilling: false, last_error: String(err?.message || err).slice(0, 180) },
      updated_at: new Date().toISOString(),
    });
    return { skipped: true, reason: "error", error: err?.message, count };
  }
}
