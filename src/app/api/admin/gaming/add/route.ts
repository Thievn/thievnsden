import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
  type PullEra,
} from "@/lib/gaming-data";
import { composeGameItem, rawgGame } from "@/lib/gaming-pull";

export const runtime = "nodejs";
export const maxDuration = 120;

function eraFromRelease(released?: string | null): PullEra {
  if (!released) return "coming";
  const t = new Date(released).getTime();
  if (Number.isNaN(t)) return "current";
  const now = Date.now();
  if (t > now + 24 * 60 * 60 * 1000) return "coming";
  if (t < now - 4 * 365 * 24 * 60 * 60 * 1000) return "classic";
  return "current";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawgId = String(body.rawgId || body.id || "").trim();
    const title = String(body.title || "").trim();
    if (!rawgId && !title) {
      return NextResponse.json({ error: "Pick a game first" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("gaming_config, gaming_items")
      .eq("id", 1)
      .maybeSingle();
    const config: GamingConfig = { ...DEFAULT_GAMING_CONFIG, ...(data?.gaming_config || {}) };
    if (!config.rawg_api_key) {
      return NextResponse.json({ error: "Add the RAWG key first" }, { status: 400 });
    }

    const existing: GamingItem[] =
      Array.isArray(data?.gaming_items) && data.gaming_items.length
        ? (data.gaming_items as GamingItem[])
        : SEED_GAMING_ITEMS;

    const game = rawgId
      ? await rawgGame(config.rawg_api_key, rawgId)
      : null;
    if (!game) {
      return NextResponse.json({ error: "RAWG didn’t return that game" }, { status: 404 });
    }

    const era = (body.era as PullEra) || eraFromRelease(game.released);
    const item = await composeGameItem({
      key: config.rawg_api_key,
      game,
      era,
      existing,
    });
    if (!item) {
      return NextResponse.json({ error: "That doesn’t look like a game with a cover" }, { status: 422 });
    }

    const items = [item, ...existing.filter((i) => i.id !== item.id && i.title.toLowerCase() !== item.title.toLowerCase())];
    await supabase.from("site_settings").upsert({
      id: 1,
      gaming_config: {
        ...config,
        auto_seen_ids: [...new Set([...(config.auto_seen_ids || []), item.id])].slice(-500),
      },
      gaming_items: items,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ item, items, count: 1 });
  } catch (err: any) {
    console.error("gaming add", err);
    return NextResponse.json({ error: err.message || "Add failed" }, { status: 500 });
  }
}
