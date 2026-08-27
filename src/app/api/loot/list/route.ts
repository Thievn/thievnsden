import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { SEED_PICKS } from "@/lib/loot-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("loot_picks")
      .select("id, section, name, snippet, body, image_url, status, sort_order, search_query, created_at")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data?.length) {
      const covers: Record<string, string> = {};
      const { data: cov } = await supabase.from("loot_covers").select("id, image_url");
      (cov || []).forEach((c) => {
        covers[c.id] = c.image_url;
      });
      const picks = (data?.length ? data : SEED_PICKS).map((p) => ({
        ...p,
        image_url: (p as any).image_url || covers[p.id] || null,
      }));
      return NextResponse.json({ picks });
    }
    return NextResponse.json({ picks: data });
  } catch {
    return NextResponse.json({
      picks: SEED_PICKS.map((p) => ({ ...p, image_url: null })),
    });
  }
}
