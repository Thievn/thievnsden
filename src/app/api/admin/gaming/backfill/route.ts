import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  cleanGamingItems,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { backfillEmptyTakes } from "@/lib/gaming-pull";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("gaming_config, gaming_items")
      .eq("id", 1)
      .maybeSingle();
    const config: GamingConfig = { ...DEFAULT_GAMING_CONFIG, ...(data?.gaming_config || {}) };
    const existing: GamingItem[] =
      Array.isArray(data?.gaming_items) && data.gaming_items.length
        ? (data.gaming_items as GamingItem[])
        : SEED_GAMING_ITEMS;
    const result = await backfillEmptyTakes({
      key: config.rawg_api_key,
      items: cleanGamingItems(existing),
      limit: 10,
    });
    await supabase.from("site_settings").upsert({
      id: 1,
      gaming_config: config,
      gaming_items: result.items,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({
      filled: result.filled,
      items: result.items,
    });
  } catch (err: any) {
    console.error("gaming backfill", err);
    return NextResponse.json({ error: err.message || "Backfill failed" }, { status: 500 });
  }
}
