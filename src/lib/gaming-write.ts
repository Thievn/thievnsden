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

export function firstParagraphs(text: string, max = 3) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, max)
    .join("\n\n");
}

export function noteFromBody(text: string) {
  const first = text.split(/\n\n+/)[0] || text;
  return first.replace(/\s+/g, " ").trim().slice(0, 180);
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
      ? "This is not out yet. Do not review it like a finished game. Talk about the wait, the hype, and what people should actually watch for."
      : opts.era === "classic"
        ? "This is older. Talk about whether it still holds up and why people still boot it."
        : "This is current or just out. Talk about how it actually plays right now.";

  const facts = [opts.pulse, opts.description ? `Publisher / RAWG copy:\n${opts.description.slice(0, 1200)}` : ""]
    .filter(Boolean)
    .join("\n\n");

  try {
    const text = await grokWrite({
      system: `${TONE} Write 2 short paragraphs max, separated by a blank line. ${eraLine} Use the facts below as the internet/player consensus. Do not contradict ratings if they exist. Do not write a recap or a wiki page.`,
      user: `Game: ${opts.title}\n\n${facts || "No RAWG facts. Use well-known public consensus only. If you do not know, keep it to one honest sentence."}`,
      maxTokens: 280,
      temperature: 0.65,
    });
    const body = firstParagraphs(text, 2);
    if (body.length > 40) return { body, note: noteFromBody(body), source: "grok" as const };
  } catch (err) {
    console.error("writeGameTake grok", err);
  }

  const fallback =
    opts.description.slice(0, 420) ||
    (opts.era === "coming"
      ? `${opts.title} is on the radar. No honest take until people have actually played it.`
      : `${opts.title} is in the pile. The numbers are thin, so this stays short until there is something real to say.`);
  const body = firstParagraphs(fallback, 2);
  return { body, note: noteFromBody(body), source: opts.description ? "rawg" : "fallback" };
}

export async function writeEssay(topic: string) {
  const text = await grokWrite({
    system: `${TONE} Write a short Den take, 2-3 short paragraphs, blank lines between them. This is about gaming culture, not a recap of one launch trailer. Stay specific. No TED-talk endings.`,
    user: `Topic: ${topic}`,
    maxTokens: 380,
    temperature: 0.8,
  });
  const body = firstParagraphs(text, 3);
  const title = topic.split("—")[0]?.split(" vs ")[0]?.trim().slice(0, 72) || "Den take";
  return { title, body, note: noteFromBody(body) };
}
