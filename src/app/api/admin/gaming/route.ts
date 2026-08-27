import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  cleanGamingItems,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";

function maskKey(key: string) {
  if (!key) return "";
  return `${key.slice(0, 4)}${"•".repeat(12)}`;
}

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("gaming_config, gaming_items")
      .eq("id", 1)
      .maybeSingle();

    const rawItems =
      Array.isArray(data?.gaming_items) && data.gaming_items.length > 0
        ? (data.gaming_items as GamingItem[])
        : SEED_GAMING_ITEMS;
    const items = cleanGamingItems(rawItems);
    const config = { ...DEFAULT_GAMING_CONFIG, ...(data?.gaming_config || {}) };
    if (items.length !== rawItems.length && data?.gaming_items) {
      await supabase.from("site_settings").upsert({
        id: 1,
        gaming_config: config,
        gaming_items: items,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      config: { ...config, rawg_api_key: maskKey(config.rawg_api_key) },
      has_rawg_key: Boolean(config.rawg_api_key),
      items,
      source: data?.gaming_items ? "db" : "seed",
    });
  } catch (err: any) {
    return NextResponse.json({
      config: DEFAULT_GAMING_CONFIG,
      has_rawg_key: false,
      items: SEED_GAMING_ITEMS,
      source: "seed",
      error: err?.message,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const nextConfig: GamingConfig = {
      ...DEFAULT_GAMING_CONFIG,
      ...(existing?.gaming_config || {}),
      ...(body.config || {}),
    };

    // Keep previous key if client sent masked value
    if (
      typeof nextConfig.rawg_api_key === "string" &&
      nextConfig.rawg_api_key.includes("•")
    ) {
      nextConfig.rawg_api_key =
        (existing?.gaming_config as GamingConfig | undefined)?.rawg_api_key || "";
    }

    const nextItems: GamingItem[] = cleanGamingItems(
      Array.isArray(body.items)
        ? body.items
        : Array.isArray(existing?.gaming_items)
          ? existing.gaming_items
          : SEED_GAMING_ITEMS
    );

    const payload: Record<string, unknown> = {
      id: 1,
      gaming_config: nextConfig,
      gaming_items: nextItems,
      updated_at: new Date().toISOString(),
    };

    // Preserve other settings columns if present
    if (existing) {
      for (const key of Object.keys(existing)) {
        if (!(key in payload) && key !== "gaming_config" && key !== "gaming_items") {
          payload[key] = existing[key];
        }
      }
    }

    const { error } = await supabase.from("site_settings").upsert(payload);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: "Add JSON columns gaming_config and gaming_items to site_settings if missing.",
        },
        { status: 500 }
      );
    }

    await writeAudit({
      action: "update_gaming",
      details: JSON.stringify({
        items: nextItems.length,
        radar_enabled: nextConfig.radar_enabled,
        has_rawg_key: !!nextConfig.rawg_api_key,
      }),
    });

    return NextResponse.json({
      success: true,
      config: {
        ...nextConfig,
        rawg_api_key: nextConfig.rawg_api_key
          ? `${nextConfig.rawg_api_key.slice(0, 4)}${"•".repeat(12)}`
          : "",
      },
      has_rawg_key: Boolean(nextConfig.rawg_api_key),
      items: nextItems,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
