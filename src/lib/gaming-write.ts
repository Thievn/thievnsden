import { AFFILIATE_WRITE_HINT, injectShopLinks } from "@/lib/gaming-affiliates";

const TONE = `You write for Thievn's Den, a personal gaming site. Honest human voice. Match the internet consensus — do not invent a different verdict. No hashtags. No emoji. No press-kit language. No corporate games journalism. Short paragraphs. If the facts are thin, say so instead of filling space. The current year is 2026. Do not talk like it is still 2024.`;

export function stripHtml(input: string) {
  return String(input || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstParagraphs(text: string, max = 10) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, max)
    .join("\n\n");
}

export function noteFromBody(text: string) {
  const first = text.split(/\n\n+/)[0] || text;
  return first
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export async function grokWrite(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
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
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 360,
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok write failed (${response.status}): ${errText.slice(0, 180)}`);
  }
  const data = await response.json();
  return String(data.choices?.[0]?.message?.content || "").trim();
}

export async function writeGameTake(opts: {
  title: string;
  era: "coming" | "current" | "classic";
  pulse: string;
  description: string;
}) {
  const eraLine =
    opts.era === "coming"
      ? "This is not out yet. Do not review it like a finished game. Say that clearly. Cover the wait, the claims, the worries, and what to actually watch for on launch. Do not pretend you have played a finished build."
      : opts.era === "classic"
        ? "This released eight or more years ago. Talk about whether it still holds up, what people still boot it for, and what has aged."
        : "This is out now, including early access if people are already playing it. Talk about how it actually plays, who it is for, and the live consensus from the ratings. Do not write like the game is still unreleased.";

  const facts = [opts.pulse, opts.description ? `Publisher / RAWG copy:\n${opts.description.slice(0, 2400)}` : ""]
    .filter(Boolean)
    .join("\n\n");

  try {
    const text = await grokWrite({
      system: `${TONE} Write a full-page article: 6 to 8 short paragraphs, about 700 to 1000 words, blank line between paragraphs. ${eraLine} Use the facts below as the internet/player consensus. Do not contradict ratings if they exist. Do not write a wiki recap, a feature list, or bullet points. ${AFFILIATE_WRITE_HINT} Do not Amazon-link the game title itself.`,
      user: `Game: ${opts.title}\n\n${facts || "No RAWG facts. Use well-known public consensus only. If you do not know something, say so instead of inventing it."}`,
      maxTokens: 1600,
      temperature: 0.65,
    });
    const body = injectShopLinks(firstParagraphs(text, 10), "game");
    if (body.length > 200) return { body, note: noteFromBody(body), source: "grok" as const };
  } catch (err) {
    console.error("writeGameTake grok", err);
  }

  const fallback =
    opts.description.slice(0, 1800) ||
    (opts.era === "coming"
      ? `${opts.title} is not playable yet. No honest take until people have actually sat with a finished build.`
      : `${opts.title} is in the pile. The numbers are thin, so this stays honest until there is something real to say.`);
  const body = firstParagraphs(fallback, 10);
  return { body, note: noteFromBody(body), source: opts.description ? "rawg" : "fallback" };
}

export async function writeEssay(topic: string) {
  const text = await grokWrite({
    system: `${TONE} Write a full Den take: 5 to 7 short paragraphs, about 600 to 900 words, blank lines between them. This is about gaming culture, not a recap of one launch trailer. Stay specific. No TED-talk endings. ${AFFILIATE_WRITE_HINT}`,
    user: `Topic: ${topic}`,
    maxTokens: 1300,
    temperature: 0.8,
  });
  const body = injectShopLinks(firstParagraphs(text, 10), "essay");
  const title = topic.split("—")[0]?.split(" vs ")[0]?.trim().slice(0, 72) || "Den take";
  return { title, body, note: noteFromBody(body) };
}
