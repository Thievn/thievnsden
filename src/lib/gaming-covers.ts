import type { GamingItem } from "@/lib/gaming-data";

function steamHeader(id: string) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
}

const KNOWN: Record<string, string> = {
  "arc raiders": steamHeader("1808500"),
  "path of exile 2": steamHeader("2694490"),
  "the finals": steamHeader("2073850"),
  "diablo 4": steamHeader("2344520"),
  "diablo iv": steamHeader("2344520"),
};

function keyOf(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function wantsCover(item: GamingItem) {
  return Boolean(item.title) && item.kind !== "article" && item.kind !== "drama" && item.shelf !== "essay";
}

function hasCover(item: GamingItem) {
  return Boolean(item.cover && String(item.cover).trim());
}

async function steamSearch(title: string): Promise<string | null> {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      title
    )}&l=english&cc=US`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const hit = Array.isArray(data.items) ? data.items[0] : null;
    if (!hit?.id) return null;
    return steamHeader(String(hit.id));
  } catch {
    return null;
  }
}

async function rawgSearch(title: string, key: string): Promise<string | null> {
  try {
    const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&search=${encodeURIComponent(
      title
    )}&page_size=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.background_image || null;
  } catch {
    return null;
  }
}

export async function lookupGameCover(title: string, rawgKey = "") {
  const known = KNOWN[keyOf(title)];
  return known || (await steamSearch(title)) || (rawgKey ? await rawgSearch(title, rawgKey) : null);
}

export async function fillGamingCovers(items: GamingItem[], rawgKey = "") {
  const out: GamingItem[] = [];
  for (const item of items) {
    if (hasCover(item) || !wantsCover(item)) {
      out.push(item);
      continue;
    }
    const cover = await lookupGameCover(item.title, rawgKey);
    out.push(cover ? { ...item, cover } : item);
  }
  return out;
}
