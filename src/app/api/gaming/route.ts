import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";

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

    // Never expose full API key to the public client — only whether it exists
    const publicConfig = {
      ...config,
      rawg_api_key: config.rawg_api_key ? "••••configured" : "",
    };

    let items: GamingItem[] = SEED_GAMING_ITEMS;
    if (Array.isArray(settings?.gaming_items) && settings.gaming_items.length > 0) {
      items = settings.gaming_items as GamingItem[];
    }

    return NextResponse.json({
      items: items.filter((i) => i.published !== false),
      config: publicConfig,
      source: settings?.gaming_items ? "db" : "seed",
    });
  } catch {
    return NextResponse.json({
      items: SEED_GAMING_ITEMS,
      config: { ...DEFAULT_GAMING_CONFIG, rawg_api_key: "" },
      source: "seed",
    });
  }
}
