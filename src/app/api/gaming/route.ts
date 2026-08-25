import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { fillGamingCovers } from "@/lib/gaming-covers";
import { mirrorItemCovers, runDailyPull } from "@/lib/gaming-pull";

export const maxDuration = 60;

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: settings } = await supabase
      .from("site_settings")
      .select("gaming_config, gaming_items")
      .eq("id", 1)
      .maybeSingle();

    let config: GamingConfig = {
      ...DEFAULT_GAMING_CONFIG,
      ...(settings?.gaming_config || {}),
    };

    let items: GamingItem[] = SEED_GAMING_ITEMS;
    if (Array.isArray(settings?.gaming_items) && settings.gaming_items.length > 0) {
      items = settings.gaming_items as GamingItem[];
    }

    try {
      const pulled = await runDailyPull(config, items, false);
      config = pulled.config;
      items = pulled.items;
    } catch {
      /* keep existing cards */
    }

    const published = items.filter((i) => i.published !== false);
    const filled = await fillGamingCovers(published, config.rawg_api_key);
    const mirrored = await mirrorItemCovers(filled);

    if (mirrored.changed || items.length !== (settings?.gaming_items || []).length || config.auto_last_date) {
      const byId = new Map(items.map((i) => [i.id, i]));
      for (const row of mirrored.items) byId.set(row.id, { ...(byId.get(row.id) || row), cover: row.cover });
      const savedItems = Array.from(byId.values());
      await supabase.from("site_settings").upsert({
        id: 1,
        gaming_config: config,
        gaming_items: savedItems,
        updated_at: new Date().toISOString(),
      });
      items = savedItems;
    }

    const publicConfig = {
      ...config,
      rawg_api_key: config.rawg_api_key ? "configured" : "",
      auto_seen_ids: [],
    };

    return NextResponse.json({
      items: mirrored.items.filter((i) => i.published !== false),
      config: publicConfig,
      source: settings?.gaming_items ? "db" : "seed",
    });
  } catch {
    const withCovers = await fillGamingCovers(SEED_GAMING_ITEMS, "");
    return NextResponse.json({
      items: withCovers,
      config: { ...DEFAULT_GAMING_CONFIG, rawg_api_key: "" },
      source: "seed",
    });
  }
}
