import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_GAMING_CONFIG, type GamingConfig, type GamingItem } from "@/lib/gaming-data";
import { fillMissingCovers } from "@/lib/gaming-pull";

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
    const items: GamingItem[] = Array.isArray(data?.gaming_items) ? data.gaming_items : [];
    const result = await fillMissingCovers(items, config.rawg_api_key || "", 12);
    await supabase.from("site_settings").upsert({
      id: 1,
      gaming_config: config,
      gaming_items: result.items,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({
      items: result.items,
      filled: result.filled,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fill failed" }, { status: 500 });
  }
}
