import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  cleanGamingItems,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { fillGamingCovers } from "@/lib/gaming-covers";
import { mirrorItemCovers, publicGamingConfig } from "@/lib/gaming-pull";

export const maxDuration = 60;

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: settings } = await supabase
      .from("site_settings")
      .select("gaming_config, gaming_items")
      .eq("id", 1)
      .maybeSingle();

    const config: GamingConfig = {
      ...DEFAULT_GAMING_CONFIG,
      ...(settings?.gaming_config || {}),
    };

    let items: GamingItem[] = SEED_GAMING_ITEMS;
    if (Array.isArray(settings?.gaming_items) && settings.gaming_items.length > 0) {
      items = cleanGamingItems(settings.gaming_items as GamingItem[]);
    }

    const published = items.filter((i) => i.published !== false);
    const filled = await fillGamingCovers(published, config.rawg_api_key);
    const mirrored = await mirrorItemCovers(filled);

    if (mirrored.changed || items.length !== (settings?.gaming_items || []).length) {
      const byId = new Map(items.map((i) => [i.id, i]));
      for (const row of mirrored.items) byId.set(row.id, { ...(byId.get(row.id) || row), cover: row.cover });
      const savedItems = cleanGamingItems(Array.from(byId.values()));
      await supabase.from("site_settings").upsert({
        id: 1,
        gaming_config: config,
        gaming_items: savedItems,
        updated_at: new Date().toISOString(),
      });
      items = savedItems;
    }

    return NextResponse.json({
      items: (mirrored.changed ? mirrored.items : published).filter((i) => i.published !== false),
      config: publicGamingConfig(config),
      source: settings?.gaming_items ? "db" : "seed",
    });
  } catch {
    const withCovers = await fillGamingCovers(SEED_GAMING_ITEMS, "");
    return NextResponse.json({
      items: withCovers,
      config: publicGamingConfig(DEFAULT_GAMING_CONFIG),
      source: "seed",
    });
  }
}
