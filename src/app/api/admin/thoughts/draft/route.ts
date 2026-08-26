import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ADDRESSEES, FORMS, HEATS, OUTLOOKS, TOPICS } from "@/lib/thoughts-packs";
import {
  describeRecipe,
  findPick,
  findThoughtDupes,
  lengthGuide,
  lengthTokens,
  recipePack,
  thoughtFingerprint,
  uniqueSlug,
  type ThoughtRecipe,
} from "@/lib/thought-studio";

export const runtime = "nodejs";
export const maxDuration = 60;

const TWEAKS: Record<string, string> = {
  fresh: "Write a brand new piece. Different idea from anything already stored.",
  funnier: "Rewrite funnier. Keep the idea. Add a real laugh, not a wink.",
  filthier: "Rewrite filthier and more specific. Adult. Keep the idea.",
  softer: "Rewrite softer and more tender. Still honest. Keep the idea.",
  meaner: "Rewrite meaner and sharper. Keep the idea.",
  shorter: "Cut it down. Keep the best lines. Keep the idea.",
  longer: "Open it up. More scene, same idea. Still short paragraphs.",
};

function parseJson(raw: string) {
  const jsonText = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(jsonText);
  } catch {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(jsonText.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const recipe: ThoughtRecipe = {
      topic: String(body.topic || ""),
      outlook: String(body.outlook || "honest"),
      heat: String(body.heat || "sharp"),
      form: String(body.form || "essay"),
      length: String(body.length || "medium"),
      addressee: String(body.addressee || "nobody"),
      seed: String(body.seed || "").trim(),
    };
    const tweak = String(body.tweak || "fresh");
    const existingTitle = String(body.title || "").trim();
    const existingExcerpt = String(body.excerpt || "").trim();
    const existingBody = String(body.body || "").trim();
    const currentId = String(body.id || "").trim();

    const topic = TOPICS.find((t) => t.id === recipe.topic);
    const outlook = findPick(OUTLOOKS, recipe.outlook, 0);
    const heat = findPick(HEATS, recipe.heat, 2);
    const form = findPick(FORMS, recipe.form, 0);
    const who = findPick(ADDRESSEES, recipe.addressee, 0);

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const supabase = createServiceClient();
    const { data: stored } = await supabase
      .from("den_thoughts")
      .select("id, slug, title, excerpt, body, published")
      .order("updated_at", { ascending: false })
      .limit(80);
    const rows = stored || [];
    const taken = new Set(rows.map((row) => String(row.slug || "")));
    const prior = rows
      .filter((row) => row.id !== currentId)
      .slice(0, 24)
      .map((row, i) => `${i + 1}. ${row.title}${row.excerpt ? ` — ${row.excerpt}` : ""}`)
      .join("\n");

    const system = `You write original pieces for Thievn's Den. Adult site. Human. Specific.
Voice: first person or close. Short paragraphs. No motivational coach. No "in today's world". No listicle numbered headers unless form is truths.
Outlook: ${outlook.label}. ${outlook.guide || ""}
Heat: ${heat.label}.
Form: ${form.label}. ${form.desc || ""}
Address: ${who.label}. ${who.desc || ""}
${lengthGuide(recipe.length)}
Crude, sexual, unhinged, funny, and tender are all allowed when they fit the outlook and heat. Stay in real life. No fantasy magic. No 3am-kitchen cliche. No identical thesis to stored work.
Return ONLY valid JSON with keys: title, excerpt, body, slug.
slug is lowercase kebab-case, short.
excerpt is 1-2 sentences.
body uses \\n\\n between paragraphs.
${prior ? `Already written — do not repeat these ideas, titles, or beats:\n${prior}` : ""}`;

    let user = "";
    if (tweak !== "fresh" && existingBody) {
      user = `${TWEAKS[tweak] || TWEAKS.fresh}\nMixer: ${describeRecipe(recipe)}\n\nTitle: ${existingTitle}\nExcerpt: ${existingExcerpt}\n\n${existingBody}`;
    } else {
      user = [
        topic ? `Topic: ${topic.label}` : "Invent a real human topic that is not on the already-written list.",
        recipe.seed ? `Extra direction: ${recipe.seed}` : "",
        TWEAKS.fresh,
      ]
        .filter(Boolean)
        .join("\n");
    }

    const run = async (extra: string) => {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.3",
          messages: [
            { role: "system", content: system },
            { role: "user", content: extra ? `${user}\n\n${extra}` : user },
          ],
          temperature: tweak === "fresh" ? 1.05 : 0.85,
          max_tokens: lengthTokens(recipe.length),
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text.slice(0, 240) || "Draft failed");
      const data = JSON.parse(text);
      const raw = String(data.choices?.[0]?.message?.content || "").trim();
      return parseJson(raw) || {
        title: existingTitle || "Draft",
        excerpt: raw.slice(0, 180),
        body: raw,
        slug: "draft-" + Date.now().toString(36),
      };
    };

    let parsed = await run("");
    let title = String(parsed.title || "Untitled").slice(0, 140);
    let excerpt = String(parsed.excerpt || "").slice(0, 280);
    let thoughtBody = String(parsed.body || "");
    let hits = findThoughtDupes(title, excerpt, thoughtBody, rows, currentId);
    if (hits[0] && hits[0].score >= 0.58 && tweak === "fresh") {
      parsed = await run("Too close to something already stored. New angle, new title, new specific scene.");
      title = String(parsed.title || title).slice(0, 140);
      excerpt = String(parsed.excerpt || excerpt).slice(0, 280);
      thoughtBody = String(parsed.body || thoughtBody);
      hits = findThoughtDupes(title, excerpt, thoughtBody, rows, currentId);
    }

    const slug = currentId
      ? String(rows.find((row) => row.id === currentId)?.slug || parsed.slug || "thought")
      : uniqueSlug(String(parsed.slug || title), taken);
    const fingerprint = thoughtFingerprint(title, excerpt, thoughtBody);
    const row = {
      slug,
      title,
      excerpt,
      body: thoughtBody,
      outlook: outlook.id,
      heat: heat.id,
      topic: recipePack(recipe.topic),
      form: form.id,
      fingerprint,
      recipe,
      published: false,
      updated_at: new Date().toISOString(),
    };

    let saved: any = null;
    if (currentId) {
      const { data, error } = await supabase.from("den_thoughts").update(row).eq("id", currentId).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      saved = data;
    } else {
      const { data, error } = await supabase.from("den_thoughts").insert(row).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      saved = data;
    }

    return NextResponse.json({
      id: saved.id,
      title,
      excerpt,
      body: thoughtBody,
      slug: saved.slug,
      outlook: outlook.id,
      heat: heat.id,
      form: form.id,
      recipe,
      mix: describeRecipe(recipe),
      hits,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Draft failed" }, { status: 500 });
  }
}
