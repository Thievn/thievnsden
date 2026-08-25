import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  itemSlug,
  type GamingItem,
} from "@/lib/gaming-data";
import { fillGamingCovers } from "@/lib/gaming-covers";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  try {
    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("gaming_items, gaming_config")
      .eq("id", 1)
      .maybeSingle();

    let items: GamingItem[] = SEED_GAMING_ITEMS;
    if (Array.isArray(settings?.gaming_items) && settings.gaming_items.length > 0) {
      items = settings.gaming_items as GamingItem[];
    }

    const raw = items.find((i) => itemSlug(i) === slug || i.id === slug);
    if (!raw || raw.published === false) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [item] = await fillGamingCovers(
      [raw],
      settings?.gaming_config?.rawg_api_key || DEFAULT_GAMING_CONFIG.rawg_api_key
    );
    return NextResponse.json({ item });
  } catch {
    const raw = SEED_GAMING_ITEMS.find((i) => itemSlug(i) === slug || i.id === slug);
    if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [item] = await fillGamingCovers([raw], "");
    return NextResponse.json({ item });
  }
}
