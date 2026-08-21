import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  SEED_GAMING_ITEMS,
  itemSlug,
  type GamingItem,
} from "@/lib/gaming-data";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  try {
    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("gaming_items")
      .eq("id", 1)
      .maybeSingle();

    let items: GamingItem[] = SEED_GAMING_ITEMS;
    if (Array.isArray(settings?.gaming_items) && settings.gaming_items.length > 0) {
      items = settings.gaming_items as GamingItem[];
    }

    const item = items.find(
      (i) => itemSlug(i) === slug || i.id === slug
    );

    if (!item || item.published === false) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch {
    const item = SEED_GAMING_ITEMS.find(
      (i) => itemSlug(i) === slug || i.id === slug
    );
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  }
}
