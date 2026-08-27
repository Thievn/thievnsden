import { createServiceClient } from "@/lib/supabase/server";
import { SEED_PICKS, normalizeLootSection, type LootPick } from "@/lib/loot-data";

function decorate(picks: LootPick[], covers: Record<string, string>): LootPick[] {
  return picks
    .filter((p) => p?.name && p.active !== false)
    .map((p) => ({
      ...p,
      section: normalizeLootSection(p.section),
      image_url: p.image_url || covers[p.id] || null,
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export async function loadLootCatalog() {
  try {
    const supabase = createServiceClient();
    const [{ data: picks }, { data: covers }, { data: settings }] = await Promise.all([
      supabase.from("loot_picks").select("*").eq("active", true).order("sort_order").order("created_at"),
      supabase.from("loot_covers").select("id, image_url"),
      supabase.from("loot_settings").select("default_tag").eq("id", 1).maybeSingle(),
    ]);
    const coverMap: Record<string, string> = {};
    (covers || []).forEach((c) => {
      if (c.id && c.image_url) coverMap[c.id] = c.image_url;
    });
    const live = Array.isArray(picks) && picks.length ? picks : SEED_PICKS;
    return {
      picks: decorate(live as LootPick[], coverMap),
      tag: settings?.default_tag || "thievnsden-20",
    };
  } catch {
    return { picks: decorate(SEED_PICKS, {}), tag: "thievnsden-20" };
  }
}

export async function loadLootPick(slug: string) {
  const { picks, tag } = await loadLootCatalog();
  return {
    pick: picks.find((p) => p.id === slug) || null,
    tag,
  };
}
