import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ADDRESSEES, FORMS, HEATS, OUTLOOKS, TOPICS } from "@/lib/thoughts-packs";
import { normalizePost } from "@/lib/x-posts";
import {
  describeXRecipe,
  EMOTE_PACKS,
  findXLane,
  findXPick,
  parseXTrio,
  SIGNOFFS,
  sprinkleEmotes,
  THIEVN_X_VOICE,
  X_CUTS,
  X_LENGTHS,
  X_PREMIUM_CAP,
  xThoughtHits,
  type XRecipe,
  type XVoiceCut,
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
  emotes: "Keep the words. Add at most two earned emotes. No circus.",
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
      lane: String(body.lane || ""),
      outlook: String(body.outlook || "cynical"),
      heat: String(body.heat || "sharp"),
      form: String(body.form || "punchline"),
      length: String(body.length || "x"),
      addressee: String(body.addressee || "nobody"),
      pack: String(body.pack || "quiet"),
      signoff: String(body.signoff || "none"),
      seed: String(body.seed || "").trim(),
    };
    const source = String(body.source || "").trim();
    const tweak = String(body.tweak || "fresh");
    const existing = String(body.existing || body.post || "").trim();
    const currentId = String(body.id || body.draft_id || "").trim();

    const topic = TOPICS.find((t) => t.id === recipe.topic);
    const lane = findXLane(recipe.lane);
    const outlook = findXPick(OUTLOOKS, recipe.outlook, 3);
    const heat = findXPick(HEATS, recipe.heat, 2);
    const form = findXPick(FORMS, recipe.form, 6);
    const who = findXPick(ADDRESSEES, recipe.addressee, 0);
    const pack = findXPick(EMOTE_PACKS, recipe.pack, 0);
    const sign = findXPick(SIGNOFFS, recipe.signoff, 3);
    const length = findXPick(X_LENGTHS, recipe.length, 0);
    const trio = body.trio !== false && tweak === "fresh";
    const forcePick = String(body.force_pick || "").trim() as XVoiceCut | "";

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

    const system = `${THIEVN_X_VOICE}

You write for the X account @Thievn / Thievn's Den.
No hashtags. No URLs. No http. No thievnsden. No @mentions unless they are in the user's box.
Aim for about ${length.target} characters per post before any sign-off. Hard max ${X_PREMIUM_CAP}.
X-ready / medium = 400–900 characters. Short = tighter. Long/Premium = still short paragraphs, blank lines, no lecture.
Form: ${form.label}. ${form.desc || ""}
Address: ${who.label}. ${who.desc || ""}
Emotes: ${pack.emotes ? `0–2 from ${pack.emotes}. Only if they earn it.` : "none unless the user asked."}
Outlook mixer: ${outlook.label}. ${outlook.guide || ""}
Heat mixer: ${heat.label}.
Do not write "link in bio" yourself.
${prior ? `Already written — do not repeat these ideas, titles, or beats:\n${prior}` : ""}`;

    let user = "";
    if (tweak === "emotes" && existing) {
      user = `Keep the post. Add at most 2 earned emotes from ${pack.emotes || "💀 🔥"}. Do not circus it. Return the post only.`;
    } else if (tweak !== "fresh" && existing) {
      user = `${TWEAKS[tweak] || TWEAKS.fresh}\nMixer: ${describeXRecipe(recipe)}\n\n${existing}`;
    } else {
      user = [
        recipe.seed ? `User box — write about this, in the voice:\n${recipe.seed}` : "",
        topic ? `Optional site-thought hook: ${topic.label}` : "",
        `Hunt: ${lane.hunt}`,
        source ? `Essay to cut down into an X post:\n${source.slice(0, 2500)}` : "",
        trio
          ? `Return ONLY JSON: {"dry":"...","mean":"...","unhinged":"...","pick":"dry|mean|unhinged"}
Three complete, paste-ready posts. Different angles. All smart. One may be filthy. pick = the strongest.`
          : TWEAKS.fresh,
      ]
        .filter(Boolean)
        .join("\n\n");
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
          max_tokens: trio ? Math.min(2200, length.tokens * 3) : length.tokens,
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text.slice(0, 240) || "Draft failed");
      const data = JSON.parse(text);
      return String(data.choices?.[0]?.message?.content || "").trim();
    };

    const finish = (text: string) => {
      let post = applySignoff(text, sign.line);
      if (tweak === "emotes" || (pack.emotes && !trio && /[\u{1F300}-\u{1FAFF}]/u.test(pack.emotes))) {
        post = sprinkleEmotes(post, pack.emotes);
      }
      if (post.length > X_PREMIUM_CAP) post = post.slice(0, X_PREMIUM_CAP - 1).trimEnd();
      return post;
    };

    let options: { dry: string; mean: string; unhinged: string; pick: XVoiceCut } | null = null;
    let post = "";
    if (trio) {
      const raw = await run("");
      options = parseXTrio(raw);
      if (!options.dry || !options.mean || !options.unhinged) {
        const retry = parseXTrio(await run("JSON only. dry, mean, unhinged, pick. Three full posts."));
        if (retry.dry && retry.mean && retry.unhinged) options = retry;
      }
      options = {
        dry: finish(options.dry),
        mean: finish(options.mean),
        unhinged: finish(options.unhinged),
        pick: forcePick && X_CUTS.some((c) => c.id === forcePick) ? forcePick : options.pick,
      };
      post = options[options.pick];
    } else {
      post = finish(await run(""));
    }
    let hits = xThoughtHits(post, storedPosts, storedThoughts, currentId);
    if (hits[0] && hits[0].score >= 0.58 && tweak === "fresh" && !trio) {
      post = finish(await run("Too close to something already stored. New angle, new specific scene."));
      hits = xThoughtHits(post, storedPosts, storedThoughts, currentId);
    }

    const row = {
      body: post,
      body_norm: normalizePost(post),
      source: "draft",
      posted_at: null as string | null,
      post_id: null as string | null,
      url: null as string | null,
      recipe,
      status: "draft",
      approved: false,
      post_type: String(body.post_type || "thought").slice(0, 16),
    };

    const current = currentId ? storedPosts.find((item) => item.id === currentId) : null;
    const updateExisting = Boolean(currentId && current && !current.posted_at);

    let saved: { id: string } | null = null;
    if (!post.trim()) {
      return NextResponse.json({ error: "Grok came back empty. Try again." }, { status: 502 });
    }
    if (updateExisting) {
      const { data, error } = await supabase
        .from("x_posts")
        .update({ body: row.body, body_norm: row.body_norm, recipe, status: "draft" })
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
      options,
      pick: options?.pick || null,
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
