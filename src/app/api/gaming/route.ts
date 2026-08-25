import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { fillGamingCovers } from "@/lib/gaming-covers";

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

    const publicConfig = {
      ...config,
      rawg_api_key: config.rawg_api_key ? "configured" : "",
    };

    let items: GamingItem[] = SEED_GAMING_ITEMS;
    if (Array.isArray(settings?.gaming_items) && settings.gaming_items.length > 0) {
      items = settings.gaming_items as GamingItem[];
    }

    const published = items.filter((i) => i.published !== false);
    const withCovers = await fillGamingCovers(published, config.rawg_api_key);

    return NextResponse.json({
      items: withCovers,
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
