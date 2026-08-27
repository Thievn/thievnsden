import { LOOT_WRITE_HINT, injectLootLinks } from "@/lib/gaming-affiliates";
import { normalizeLootSection, uniqueLootId, type LootPick } from "@/lib/loot-data";

const TONE = `You write loot cards for Thievn's Den. Honest, specific, a little dry. 2026. No hashtags, no emoji, no press-kit adjectives, no "game-changer". Amazon SEARCH keywords only — never an ASIN.`;

function sectionGuide(section: string) {
  if (section === "shelf") return "figures, stands, frames, LED, shelf presence. Not random toys.";
  if (section === "phone") return "cases, grips, MagSafe, cables, bricks, stands. Afterimage-adjacent.";
  if (section === "house") return "den-adjacent house stuff only: cable raceways, monitor arms, mini vac, air filter, lamp. No air fryers.";
  if (section === "audio") return "headsets, mics, DAC/amp, earbuds that survive the return cycle.";
  return "PC case, GPU-class parts, keyboards, mice, desks, arms, cable gear.";
}

function parseJson(raw: string) {
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

export async function grokJson(opts: { system: string; user: string; maxTokens?: number; temperature?: number }) {
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
      temperature: opts.temperature ?? 0.65,
      max_tokens: opts.maxTokens ?? 1600,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 220));
  const data = JSON.parse(text);
  return parseJson(data.choices?.[0]?.message?.content || "{}");
}

export async function researchLootList(opts: {
  section: string;
  hint?: string;
  count?: number;
  avoid?: string[];
  existing?: LootPick[];
}) {
  const section = normalizeLootSection(opts.section);
  const count = Math.min(8, Math.max(3, Number(opts.count) || 5));
  const avoid = (opts.avoid || []).filter(Boolean).join(", ");
  const parsed = await grokJson({
    system: `${TONE} ${LOOT_WRITE_HINT} JSON only.`,
    user: `Section: ${section}. ${sectionGuide(section)}
Hint / vibe: ${opts.hint || "best stuff that fits this site"}
Avoid repeating: ${avoid || "none"}
Return JSON {"picks":[{"name":"short product-shaped title","snippet":"one spoken sentence under 90 chars","body":"4 short paragraphs separated by blank lines","search_query":"amazon search keywords"}]} with ${count} unique picks.
Body is a mini article: what it is, why it stayed, what sucks, who it is for. Not a wiki. Not a recap.`,
    maxTokens: 2200,
    temperature: 0.7,
  });
  const existing = opts.existing || [];
  return (parsed.picks || []).map((p: any, i: number) => {
    const name = String(p.name || "Untitled").trim();
    const search_query = String(p.search_query || name).trim();
    const body = injectLootLinks(String(p.body || "").trim(), search_query);
    const pick: LootPick = {
      id: uniqueLootId(name, existing),
      section,
      name,
      snippet: String(p.snippet || "").trim().slice(0, 140),
      body,
      search_query,
      asin: "",
      status: "In the Den",
      active: true,
      sort_order: i,
    };
    existing.push(pick);
    return pick;
  }) as LootPick[];
}

export async function rewriteLootCopy(opts: {
  field: string;
  name?: string;
  section?: string;
  hint?: string;
  search_query?: string;
}) {
  const field = String(opts.field || "all");
  const want =
    field === "title"
      ? 'JSON {"name":"..."}'
      : field === "snippet"
        ? 'JSON {"snippet":"..."}'
        : field === "body"
          ? 'JSON {"body":"para1\\n\\npara2\\n\\npara3\\n\\npara4"}'
          : 'JSON {"name":"...","snippet":"...","body":"four short paragraphs"}';
  const parsed = await grokJson({
    system: `${TONE} ${LOOT_WRITE_HINT} JSON only. Title 2-6 words, product-shaped.`,
    user: `Section: ${opts.section || "desk"}
Object / hint: ${opts.hint || opts.name || ""}
Existing title: ${opts.name || "none"}
Search keywords: ${opts.search_query || opts.hint || opts.name || ""}
Write ${field}. ${want}`,
    maxTokens: 900,
    temperature: 0.6,
  });
  if (parsed.body && opts.search_query) {
    parsed.body = injectLootLinks(String(parsed.body), opts.search_query);
  }
  return parsed;
}
