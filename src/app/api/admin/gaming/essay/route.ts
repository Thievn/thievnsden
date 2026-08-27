import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { addEssay } from "@/lib/gaming-pull";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic || "").trim();
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

    const essay = await addEssay(existing, config.auto_essay_seen || [], topic || undefined);
    const items = [essay.item, ...existing];
    await supabase.from("site_settings").upsert({
      id: 1,
      gaming_config: {
        ...config,
        auto_essay_last_date: new Date().toISOString().slice(0, 10),
        auto_essay_seen: [...(config.auto_essay_seen || []), essay.topic].slice(-40),
      },
      gaming_items: items,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ item: essay.item, items, topic: essay.topic });
  } catch (err: any) {
    console.error("gaming essay", err);
    return NextResponse.json({ error: err.message || "Essay failed" }, { status: 500 });
  }
}
