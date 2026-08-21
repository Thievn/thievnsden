import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_GAMING_CONFIG } from "@/lib/gaming-data";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const rawgId = req.nextUrl.searchParams.get("id")?.trim();

    if (!q && !rawgId) {
      return NextResponse.json({ error: "Need q or id" }, { status: 400 });
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
        error: "Add a RAWG API key in Gaming settings first.",
      });
    }

    let game: any = null;

    if (rawgId) {
      const res = await fetch(
        `https://api.rawg.io/api/games/${encodeURIComponent(rawgId)}?key=${encodeURIComponent(config.rawg_api_key)}`
      );
      if (res.ok) game = await res.json();
    } else if (q) {
      const search = await fetch(
        `https://api.rawg.io/api/games?key=${encodeURIComponent(config.rawg_api_key)}&search=${encodeURIComponent(q)}&page_size=1`
      );
      if (search.ok) {
        const json = await search.json();
        const first = json.results?.[0];
        if (first?.id) {
          const detail = await fetch(
            `https://api.rawg.io/api/games/${first.id}?key=${encodeURIComponent(config.rawg_api_key)}`
          );
          if (detail.ok) game = await detail.json();
          else game = first;
        }
      }
    }

    if (!game) {
      return NextResponse.json({ error: "No game found", pulse: "" });
    }

    const rating = game.rating ? Number(game.rating).toFixed(1) : null;
    const ratingsCount = game.ratings_count || game.reviews_count || null;
    const metacritic = game.metacritic ?? null;
    const tags = (game.tags || [])
      .slice(0, 8)
      .map((t: any) => t.name)
      .filter(Boolean);
    const genres = (game.genres || []).map((g: any) => g.name).filter(Boolean);
    const topRatings = (game.ratings || [])
      .slice()
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 3)
      .map((r: any) => `${r.title}: ${r.percent}%`);

    const lines = [
      `Game: ${game.name}`,
      rating ? `RAWG rating: ${rating}/5${ratingsCount ? ` (${ratingsCount} ratings)` : ""}` : null,
      metacritic != null ? `Metacritic: ${metacritic}` : null,
      topRatings.length ? `Player breakdown: ${topRatings.join(", ")}` : null,
      genres.length ? `Genres: ${genres.join(", ")}` : null,
      tags.length ? `Tags: ${tags.join(", ")}` : null,
      game.released ? `Released: ${game.released}` : null,
    ].filter(Boolean);

    const pulse = lines.join("\n");

    return NextResponse.json({
      pulse,
      game: {
        id: game.id,
        name: game.name,
        rating,
        metacritic,
        background_image: game.background_image,
        url: game.slug ? `https://rawg.io/games/${game.slug}` : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Pulse failed", pulse: "" });
  }
}
