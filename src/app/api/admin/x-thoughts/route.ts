import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ADDRESSEES, FORMS, HEATS, OUTLOOKS, TOPICS } from "@/lib/thoughts-packs";
import { normalizePost } from "@/lib/x-posts";
import {
  describeXRecipe,
  EMOTE_PACKS,
  findXPick,
  SIGNOFFS,
  X_LENGTHS,
  X_PREMIUM_CAP,
  xThoughtHits,
  type XRecipe,
} from "@/lib/x-thoughts";

export const runtime = "nodejs";
export const maxDuration = 60;

const TWEAKS: Record<string, string> = {
  fresh: "Write a brand new X post. Different idea from anything already stored.",
  shorter: "Cut it down. Keep the best lines. Keep the idea.",
  longer: "Open it up. More scene, same idea. Still short paragraphs and blank lines.",
  meaner: "Rewrite meaner and sharper. Keep the idea.",
  softer: "Rewrite softer and more tender. Still honest. Keep the idea.",
  funnier: "Rewrite funnier. Keep the idea. Add a real laugh, not a wink.",
  filthier: "Rewrite filthier and more specific. Adult. Keep the idea.",
};

function stripJunk(text: string) {
  return text.replace(/https?:\/\/\S+/gi, "").replace(/thievnsden\.com/gi, "").trim();
}

function applySignoff(post: string, line: string) {
  const cleaned = stripJunk(post).replace(/\s+$/, "");
  if (!line) return cleaned;
  const without = cleaned.replace(/\n*(link in bio|more in the den · link in bio|written in the den)\s*$/i, "").trimEnd();
  return `${without}\n\n${line}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const recipe: XRecipe = {
      topic: String(body.topic || ""),
      outlook: String(body.outlook || "honest"),
      heat: String(body.heat || "sharp"),
      form: String(body.form || "essay"),
      length: String(body.length || "medium"),
      addressee: String(body.addressee || "nobody"),
      pack: String(body.pack || "dry"),
      signoff: String(body.signoff || "bio"),
      seed: String(body.seed || "").trim(),
    };
    const source = String(body.source || "").trim();
    const tweak = String(body.tweak || "fresh");
    const existing = String(body.existing || body.post || "").trim();
    const currentId = String(body.id || body.draft_id || "").trim();

    const topic = TOPICS.find((t) => t.id === recipe.topic);
    const outlook = findXPick(OUTLOOKS, recipe.outlook, 0);
    const heat = findXPick(HEATS, recipe.heat, 2);
    const form = findXPick(FORMS, recipe.form, 0);
    const who = findXPick(ADDRESSEES, recipe.addressee, 0);
    const pack = findXPick(EMOTE_PACKS, recipe.pack, 0);
    const sign = findXPick(SIGNOFFS, recipe.signoff, 0);
    const length = findXPick(X_LENGTHS, recipe.length, 1);

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const supabase = createServiceClient();
    const [{ data: posts }, { data: thoughts }] = await Promise.all([
      supabase.from("x_posts").select("id, body, url, posted_at").order("created_at", { ascending: false }).limit(80),
      supabase.from("den_thoughts").select("id, title, excerpt").order("updated_at", { ascending: false }).limit(40),
    ]);
    const storedPosts = posts || [];
    const storedThoughts = thoughts || [];
    const prior = [
      ...storedPosts
        .filter((row) => row.id !== currentId)
        .slice(0, 24)
        .map((row) => String(row.body || "").replace(/\s+/g, " ").trim().slice(0, 220)),
      ...storedThoughts.map((row) => `${row.title}${row.excerpt ? ` — ${row.excerpt}` : ""}`.slice(0, 220)),
    ]
      .filter(Boolean)
      .map((line, i) => `${i + 1}. ${line}`)
      .join("\n");

    const system = `You write posts for the X account @Thievn / Thievn's Den. X Premium — long posts allowed.
Voice: human, adult-ok, not a brand intern. No hashtags. No URLs. No http. No thievnsden. No @mentions unless in the seed. Never use 👇.
Aim for about ${length.target} characters before the sign-off. Hard max ${X_PREMIUM_CAP}.
Short = tight lines. Medium = a few beats. Long/Premium = real thought with short paragraphs and blank lines.
Form: ${form.label}. ${form.desc || ""}
Address: ${who.label}. ${who.desc || ""}
Emotes: at most 2 from ${pack.emotes || "(none)"}.
Outlook: ${outlook.label}. ${outlook.guide || ""}
Heat: ${heat.label}.
Funny, filthy, tender, and unhinged are all allowed when they match the outlook. Stay specific.
Do not write "link in bio" yourself. Return plain text only.
${prior ? `Already written — do not repeat these ideas, titles, or beats:\n${prior}` : ""}`;

    let user = "";
    if (tweak !== "fresh" && existing) {
      user = `${TWEAKS[tweak] || TWEAKS.fresh}\nMixer: ${describeXRecipe(recipe)}\n\n${existing}`;
    } else {
      user = [
        topic ? `Topic: ${topic.label}` : "Invent a real human topic that is not on the already-written list.",
        recipe.seed ? `Extra direction: ${recipe.seed}` : "",
        source ? `Essay to cut down into an X post:\n${source.slice(0, 2500)}` : "",
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
          max_tokens: length.tokens,
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text.slice(0, 240) || "Draft failed");
      const data = JSON.parse(text);
      return String(data.choices?.[0]?.message?.content || "").trim();
    };

    let post = applySignoff(await run(""), sign.line);
    let hits = xThoughtHits(post, storedPosts, storedThoughts, currentId);
    if (hits[0] && hits[0].score >= 0.58 && tweak === "fresh") {
      post = applySignoff(await run("Too close to something already stored. New angle, new specific scene."), sign.line);
      hits = xThoughtHits(post, storedPosts, storedThoughts, currentId);
    }
    if (post.length > X_PREMIUM_CAP) post = post.slice(0, X_PREMIUM_CAP - 1).trimEnd();

    const row = {
      body: post,
      body_norm: normalizePost(post),
      source: "draft",
      posted_at: null as string | null,
      post_id: null as string | null,
      url: null as string | null,
      recipe,
    };

    const current = currentId ? storedPosts.find((item) => item.id === currentId) : null;
    const updateExisting = Boolean(currentId && current && !current.posted_at);

    let saved: { id: string } | null = null;
    if (updateExisting) {
      const { data, error } = await supabase
        .from("x_posts")
        .update({ body: row.body, body_norm: row.body_norm, recipe })
        .eq("id", currentId)
        .select("id")
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      saved = data;
    } else {
      const { data, error } = await supabase.from("x_posts").insert(row).select("id").maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      saved = data;
    }

    return NextResponse.json({
      post,
      chars: post.length,
      draft_id: saved?.id || currentId || null,
      id: saved?.id || currentId || null,
      mix: describeXRecipe(recipe),
      recipe,
      hits,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Draft failed" }, { status: 500 });
  }
}
