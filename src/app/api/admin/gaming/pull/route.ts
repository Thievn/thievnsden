import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { runDailyPull } from "@/lib/gaming-pull";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("gaming_config, gaming_items")
      .eq("id", 1)
      .maybeSingle();

    let config: GamingConfig = { ...DEFAULT_GAMING_CONFIG, ...(data?.gaming_config || {}) };
    if (body.era) config.auto_pull_era = body.era;
    if (body.count) config.auto_pull_per_day = Number(body.count);
    let items: GamingItem[] =
      Array.isArray(data?.gaming_items) && data.gaming_items.length
        ? (data.gaming_items as GamingItem[])
        : SEED_GAMING_ITEMS;

    const result = await runDailyPull(config, items, true);
    await supabase.from("site_settings").upsert({
      id: 1,
      gaming_config: result.config,
      gaming_items: result.items,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      added: result.added.map((i) => i.title),
      count: result.added.length,
      skipped: result.skipped,
      items: result.items,
      config: result.config,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Pull failed" }, { status: 500 });
  }
}
