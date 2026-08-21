import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_GAMING_CONFIG } from "@/lib/gaming-data";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], error: "Query too short" });
    }

    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("gaming_config")
      .eq("id", 1)
      .maybeSingle();

    const config = { ...DEFAULT_GAMING_CONFIG, ...(settings?.gaming_config || {}) };
    if (!config.rawg_api_key) {
      return NextResponse.json({
        results: [],
        error: "Add a RAWG API key in Gaming settings first.",
      });
    }

    const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(
      config.rawg_api_key
    )}&search=${encodeURIComponent(q)}&page_size=8`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ results: [], error: "RAWG search failed" }, { status: 200 });
    }

    const json = await res.json();
    const results = (json.results || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      released: g.released,
      background_image: g.background_image,
      slug: g.slug,
      url: g.slug ? `https://rawg.io/games/${g.slug}` : null,
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ results: [], error: err?.message || "Search failed" });
  }
}
