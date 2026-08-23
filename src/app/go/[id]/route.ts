import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { affiliateUrl, LOOT_ITEMS, SEED_PICKS } from "@/lib/loot-data";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let tag = "thievnsden-20";
  try {
    const supabase = createServiceClient();
    const { data: settings } = await supabase.from("loot_settings").select("default_tag").eq("id", 1).maybeSingle();
    if (settings?.default_tag) tag = settings.default_tag;
    const { data: pick } = await supabase.from("loot_picks").select("*").eq("id", id).maybeSingle();
    if (pick) {
      return NextResponse.redirect(affiliateUrl(pick, tag), 302);
    }
  } catch {
    // fall through
  }
  const seed = SEED_PICKS.find((p) => p.id === id);
  if (seed) return NextResponse.redirect(affiliateUrl(seed, tag), 302);
  const old = LOOT_ITEMS.find((p) => p.id === id);
  if (old?.link) return NextResponse.redirect(old.link, 302);
  return NextResponse.redirect(new URL("/loot", _req.url), 302);
}
