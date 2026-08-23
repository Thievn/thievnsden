import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { lootCoverPrompt, SEED_PICKS, slugify, type LootPick } from "@/lib/loot-data";

export const runtime = "nodejs";
export const maxDuration = 120;

async function generateProduct(prompt: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");
  const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
  const errors: string[] = [];
  for (const model of models) {
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        resolution: "1k",
        aspect_ratio: "4:3",
        response_format: "b64_json",
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      errors.push(`${model}: ${res.status} ${text.slice(0, 180)}`);
      continue;
    }
    const data = JSON.parse(text);
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      errors.push(`${model}: empty`);
      continue;
    }
    return b64 as string;
  }
  throw new Error(errors.join(" | ") || "gen failed");
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Bad JSON from model");
  }
}

export async function GET() {
  const supabase = createServiceClient();
  const { data: picks } = await supabase.from("loot_picks").select("*").order("sort_order").order("created_at");
  const { data: settings } = await supabase.from("loot_settings").select("*").eq("id", 1).maybeSingle();
  const { data: covers } = await supabase.from("loot_covers").select("*");
  const coverMap: Record<string, any> = {};
  (covers || []).forEach((c) => {
    coverMap[c.id] = c;
  });
  return NextResponse.json({
    picks: picks || [],
    covers: coverMap,
    settings: settings || { default_tag: "thievnsden-20" },
    seeded: SEED_PICKS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "photo");
    const supabase = createServiceClient();

    if (action === "settings") {
      const tag = String(body.default_tag || "thievnsden-20").trim();
      await supabase.from("loot_settings").upsert({ id: 1, default_tag: tag, updated_at: new Date().toISOString() });
      return NextResponse.json({ success: true, default_tag: tag });
    }

    if (action === "seed") {
      for (const pick of SEED_PICKS) {
        const { data: cover } = await supabase.from("loot_covers").select("image_url").eq("id", pick.id).maybeSingle();
        await supabase.from("loot_picks").upsert({
          ...pick,
          image_url: cover?.image_url || null,
        });
      }
      await writeAudit({ action: "loot_seed", details: String(SEED_PICKS.length) });
      return NextResponse.json({ success: true, seeded: SEED_PICKS.length });
    }

    if (action === "save") {
      const pick = body.pick as LootPick;
      if (!pick?.name) return NextResponse.json({ error: "Need a title" }, { status: 400 });
      const id = slugify(pick.id || pick.name);
      const row = {
        id,
        section: pick.section || "desk",
        name: pick.name.trim(),
        snippet: pick.snippet || "",
        body: pick.body || "",
        image_url: pick.image_url || null,
        search_query: pick.search_query || "",
        asin: pick.asin || "",
        dest_url: pick.dest_url || "",
        tag_override: pick.tag_override || "",
        status: pick.status || "In the Den",
        active: pick.active !== false,
        sort_order: Number(pick.sort_order) || 0,
      };
      const { error } = await supabase.from("loot_picks").upsert(row);
      if (error) throw new Error(error.message);
      await writeAudit({ action: "loot_save", details: id });
      return NextResponse.json({ success: true, pick: row });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      await supabase.from("loot_picks").delete().eq("id", id);
      return NextResponse.json({ success: true });
    }

    if (action === "research" || action === "fill") {
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) throw new Error("XAI_API_KEY missing");
      const section = String(body.section || "desk");
      const hint = String(body.hint || "");
      const count = Math.min(8, Math.max(3, Number(body.count) || 5));
      const avoid = Array.isArray(body.avoid) ? body.avoid.join(", ") : String(body.avoid || "");
      const guide =
        section === "shelf"
          ? "figures, stands, frames, LED, shelf presence. Not random toys."
          : section === "phone"
            ? "cases, grips, cables, bricks, stands. Afterimage-adjacent."
            : section === "house"
              ? "den-adjacent house stuff only: cable raceways, monitor arms, mini vac, air filter, lamp. No air fryers."
              : "PC case, GPU-class parts, keyboards, headsets, desks, arms, cable gear.";
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.3",
          messages: [
            {
              role: "system",
              content:
                "You pick Amazon SEARCH pages for Thievn's Den loot. Not one SKU. search_query must return a results list of comparable products. No ASINs. Dry honest copy. JSON only.",
            },
            {
              role: "user",
              content: `Section: ${section}. ${guide}\nHint: ${hint || "best stuff that fits this site"}\nAvoid repeating: ${avoid || "none"}\nReturn JSON {\"picks\":[{\"name\":\"\",\"snippet\":\"one line\",\"body\":\"two short paragraphs\",\"search_query\":\"amazon keywords\"}]} with ${count} picks.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1400,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text.slice(0, 200));
      const data = JSON.parse(text);
      const parsed = parseJson(data.choices?.[0]?.message?.content || "{}");
      const ideas = (parsed.picks || []).map((p: any, i: number) => ({
        id: slugify(p.name || `pick-${i}`),
        section,
        name: String(p.name || "Untitled"),
        snippet: String(p.snippet || ""),
        body: String(p.body || ""),
        search_query: String(p.search_query || p.name || ""),
        asin: "",
        status: "In the Den",
        active: true,
        sort_order: i,
      }));
      if (action === "fill") {
        for (const pick of ideas) {
          await supabase.from("loot_picks").upsert(pick);
        }
        await writeAudit({ action: "loot_fill", details: `${section}:${ideas.length}` });
      }
      return NextResponse.json({ success: true, picks: ideas });
    }

    if (action === "copy") {
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) throw new Error("XAI_API_KEY missing");
      const field = String(body.field || "all");
      const hint = String(body.hint || body.name || "").trim();
      const currentName = String(body.name || "");
      const section = String(body.section || "desk");
      const tone = String(body.tone || "dry");
      const toneLine =
        tone === "petty"
          ? "A little petty. Still specific about the object."
          : tone === "useful"
            ? "Useful and plain. No attitude."
            : "Dry and specific. Sounds like a person who used the thing.";
      const rules = [
        "Write about THIS object only. Use the hint as the product, not a generic category speech.",
        "No marketing adjectives pile (premium, ultimate, game-changer).",
        "No hashtags, no emoji, no quotes around the whole line.",
        "Title: 2-6 words, product-shaped. Example: 60% board, sitting figure, wall monitor arm.",
        "Snippet: one sentence, under 90 characters, sounds spoken.",
        "Body: exactly two short paragraphs, 2-3 sentences each, why it stayed / what sucks.",
      ].join(" ");
      const want =
        field === "title"
          ? 'JSON {"name":"..."}'
          : field === "snippet"
            ? 'JSON {"snippet":"..."}'
            : field === "body"
              ? 'JSON {"body":"para1\\n\\npara2"}'
              : 'JSON {"name":"...","snippet":"...","body":"para1\\n\\npara2"}';
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.3",
          messages: [
            {
              role: "system",
              content: `Loot cards for Thievn's Den. ${toneLine} ${rules} JSON only.`,
            },
            {
              role: "user",
              content: `Section: ${section}\nObject / hint: ${hint || currentName}\nExisting title: ${currentName || "none"}\nWrite ${field}. ${want}`,
            },
          ],
          temperature: 0.55,
          max_tokens: 420,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text.slice(0, 180));
      const data = JSON.parse(text);
      let parsed: any = {};
      try {
        parsed = parseJson(data.choices?.[0]?.message?.content || "{}");
      } catch {
        parsed = { snippet: data.choices?.[0]?.message?.content || "" };
      }
      return NextResponse.json({ success: true, ...parsed });
    }

    if (action === "photo" || !action) {
      const id = String(body.id || slugify(body.name || "loot"));
      const name = String(body.name || id);
      const section = String(body.section || "desk");
      const search_query = String(body.search_query || "");
      const extra = String(body.extra || "");
      const scene = String(body.scene || "auto");
      const prompt = lootCoverPrompt({ name, section, search_query }, extra, scene);
      const b64 = await generateProduct(prompt);
      const bytes = Buffer.from(b64, "base64");
      const path = `${id}.jpg`;
      const { error: upErr } = await supabase.storage.from("loot").upload(path, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (upErr) throw new Error(`STORAGE: ${upErr.message}. Create public bucket loot.`);
      const { data: pub } = supabase.storage.from("loot").getPublicUrl(path);
      const image_url = `${pub.publicUrl}?v=${Date.now()}`;
      await supabase.from("loot_covers").upsert({ id, image_url, prompt, updated_at: new Date().toISOString() });
      const { data: existing } = await supabase.from("loot_picks").select("id").eq("id", id).maybeSingle();
      if (existing) {
        await supabase.from("loot_picks").update({ image_url }).eq("id", id);
      } else {
        await supabase.from("loot_picks").insert({
          id,
          section,
          name,
          snippet: body.snippet || "",
          body: body.body || "",
          search_query,
          image_url,
        });
      }
      await writeAudit({ action: "loot_cover", details: id });
      return NextResponse.json({ success: true, image_url, id, prompt });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
