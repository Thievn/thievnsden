import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { SEED_PICKS, slugify, uniqueLootId, type LootPick } from "@/lib/loot-data";
import { generateLootStill } from "@/lib/loot-art";
import { researchLootList, rewriteLootCopy } from "@/lib/loot-write";

export const runtime = "nodejs";
export const maxDuration = 300;

function pickRow(pick: LootPick, id: string) {
  return {
    id,
    section: pick.section || "desk",
    name: String(pick.name || "").trim(),
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
      const { data: existing } = await supabase.from("loot_picks").select("id");
      const id = pick.id || uniqueLootId(pick.name, (existing || []) as LootPick[]);
      const row = pickRow(pick, slugify(id));
      const { error } = await supabase.from("loot_picks").upsert(row);
      if (error) throw new Error(error.message);
      await writeAudit({ action: "loot_save", details: row.id });
      return NextResponse.json({ success: true, pick: row });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      await supabase.from("loot_picks").delete().eq("id", id);
      return NextResponse.json({ success: true });
    }

    if (action === "research" || action === "fill" || action === "fill_full") {
      const { data: existingRows } = await supabase.from("loot_picks").select("id,name");
      const ideas = await researchLootList({
        section: body.section,
        hint: body.hint,
        count: body.count,
        avoid: Array.isArray(body.avoid) ? body.avoid : (existingRows || []).map((r) => r.name),
        existing: (existingRows || []).map((r) => ({ id: r.id, name: r.name, section: "desk", snippet: "", body: "", status: "In the Den" })),
      });
      if (action === "research") {
        return NextResponse.json({ success: true, picks: ideas });
      }
      const saved: LootPick[] = [];
      for (const pick of ideas) {
        let next = { ...pick };
        if (action === "fill_full") {
          try {
            const still = await generateLootStill({
              id: pick.id,
              name: pick.name,
              section: pick.section,
              search_query: pick.search_query,
              extra: String(body.extra || ""),
              scene: String(body.scene || "auto"),
            });
            next = { ...next, image_url: still.image_url };
          } catch (err) {
            console.error("loot fill still", pick.name, err);
          }
        }
        await supabase.from("loot_picks").upsert(pickRow(next, next.id));
        saved.push(next);
      }
      await writeAudit({ action: `loot_${action}`, details: `${body.section}:${saved.length}` });
      return NextResponse.json({ success: true, picks: saved });
    }

    if (action === "copy") {
      const parsed = await rewriteLootCopy({
        field: body.field,
        name: body.name,
        section: body.section,
        hint: body.hint || body.name,
        search_query: body.search_query,
      });
      return NextResponse.json({ success: true, ...parsed });
    }

    if (action === "photos_missing") {
      const section = String(body.section || "");
      let q = supabase.from("loot_picks").select("*").eq("active", true);
      if (section && section !== "all") q = q.eq("section", section);
      const { data: rows } = await q.order("sort_order");
      const missing = (rows || []).filter((p) => !p.image_url).slice(0, 6);
      let shot = 0;
      const updated: LootPick[] = [];
      for (const pick of missing) {
        try {
          const still = await generateLootStill({
            id: pick.id,
            name: pick.name,
            section: pick.section,
            search_query: pick.search_query,
          });
          await supabase.from("loot_picks").update({ image_url: still.image_url }).eq("id", pick.id);
          updated.push({ ...pick, image_url: still.image_url });
          shot += 1;
        } catch (err) {
          console.error("photos_missing", pick.name, err);
        }
      }
      return NextResponse.json({ success: true, shot, picks: updated });
    }

    if (action === "photos_refresh") {
      const section = String(body.section || "");
      let q = supabase.from("loot_picks").select("*").eq("active", true);
      if (section && section !== "all") q = q.eq("section", section);
      const { data: rows } = await q.order("sort_order");
      const batch = (rows || []).slice(0, 8);
      let shot = 0;
      for (const pick of batch) {
        try {
          const still = await generateLootStill({
            id: pick.id,
            name: pick.name,
            section: pick.section,
            search_query: pick.search_query,
            extra: String(body.extra || ""),
            scene: String(body.scene || "auto"),
          });
          await supabase.from("loot_picks").update({ image_url: still.image_url }).eq("id", pick.id);
          shot += 1;
        } catch (err) {
          console.error("photos_refresh", pick.name, err);
        }
      }
      return NextResponse.json({ success: true, shot });
    }

    if (action === "photo" || !action) {
      const id = String(body.id || slugify(body.name || "loot"));
      const name = String(body.name || id);
      const still = await generateLootStill({
        id,
        name,
        section: body.section,
        search_query: body.search_query,
        extra: body.extra,
        scene: body.scene,
      });
      const { data: existing } = await supabase.from("loot_picks").select("id").eq("id", id).maybeSingle();
      if (existing) {
        await supabase.from("loot_picks").update({ image_url: still.image_url }).eq("id", id);
      } else {
        await supabase.from("loot_picks").insert({
          id,
          section: body.section || "desk",
          name,
          snippet: body.snippet || "",
          body: body.body || "",
          search_query: body.search_query || "",
          image_url: still.image_url,
        });
      }
      await writeAudit({ action: "loot_cover", details: id });
      return NextResponse.json({ success: true, image_url: still.image_url, id, prompt: still.prompt });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
