import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  type GamingItem,
} from "@/lib/gaming-data";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("gaming_config")
      .eq("id", 1)
      .maybeSingle();

    const config = { ...DEFAULT_GAMING_CONFIG, ...(settings?.gaming_config || {}) };

    if (!config.radar_enabled || !config.rawg_api_key) {
      return NextResponse.json({ items: [], reason: "radar_disabled_or_no_key" });
    }

    const pageSize = Math.min(Math.max(Number(config.radar_page_size) || 8, 1), 20);
    const platforms = encodeURIComponent(config.radar_platforms || "4");

    // Upcoming + recent PC releases
    const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(
      config.rawg_api_key
    )}&platforms=${platforms}&ordering=-released&page_size=${pageSize}&dates=2025-01-01,2027-12-31`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json(
        { items: [], error: "rawg_fetch_failed", status: res.status },
        { status: 200 }
      );
    }

    const json = await res.json();
    const results = Array.isArray(json.results) ? json.results : [];

    const items: GamingItem[] = results.map((g: any, idx: number) => ({
      id: `rawg-${g.id}`,
      kind: "radar" as const,
      title: g.name || "Untitled",
      note: g.slug
        ? `Live from RAWG · ${g.slug.replace(/-/g, " ")}`
        : "Live from RAWG release radar.",
      status: "hype" as const,
      cover: g.background_image || null,
      meta: g.released ? `Released ${g.released}` : "TBA",
      url: g.slug ? `https://rawg.io/games/${g.slug}` : null,
      sort: 200 + idx,
      published: true,
    }));

    return NextResponse.json({ items, source: "rawg" });
  } catch (err: any) {
    return NextResponse.json({
      items: [],
      error: err?.message || "radar_error",
    });
  }
}
