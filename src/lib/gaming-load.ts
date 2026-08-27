import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  cleanGamingItems,
  itemSlug,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { publicGamingConfig } from "@/lib/gaming-pull";

export async function loadGamingCatalog() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("gaming_config, gaming_items")
      .eq("id", 1)
      .maybeSingle();
    const config: GamingConfig = { ...DEFAULT_GAMING_CONFIG, ...(data?.gaming_config || {}) };
    const items =
      Array.isArray(data?.gaming_items) && data.gaming_items.length
        ? cleanGamingItems(data.gaming_items as GamingItem[]).filter((i) => i.published !== false)
        : SEED_GAMING_ITEMS.filter((i) => i.published !== false);
    return { items, config: publicGamingConfig(config), source: data?.gaming_items ? "db" : "seed" };
  } catch {
    return {
      items: SEED_GAMING_ITEMS.filter((i) => i.published !== false),
      config: publicGamingConfig(DEFAULT_GAMING_CONFIG),
      source: "seed",
    };
  }
}

export async function loadGamingItem(slug: string) {
  const { items } = await loadGamingCatalog();
  return items.find((i) => itemSlug(i) === slug || i.id === slug) || null;
}
