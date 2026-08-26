import { createServiceClient } from "@/lib/supabase/server";
import {
  slugify,
  type GamingConfig,
  type GamingItem,
  type GamingKind,
  type GamingStatus,
} from "@/lib/gaming-data";

export type PullEra = "coming" | "current" | "classic";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function dateShift(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function eraQuery(era: PullEra) {
  if (era === "coming") {
    return `dates=${dateShift(0)},${dateShift(240)}&ordering=-added`;
  }
  if (era === "classic") {
    return `dates=1995-01-01,2018-12-31&ordering=-rating`;
  }
  return `dates=${dateShift(-45)},${dateShift(14)}&ordering=-added`;
}

function eraMeta(era: PullEra, released?: string) {
  if (era === "coming") return released ? `Drops ${released}` : "Coming soon";
  if (era === "classic") return released ? `Classic · ${released.slice(0, 4)}` : "Classic";
  return released ? `Out ${released}` : "Current";
}

function eraKind(era: PullEra): { kind: GamingKind; status: GamingStatus } {
  if (era === "coming") return { kind: "watchlist", status: "watch" };
  if (era === "classic") return { kind: "library", status: "library" };
  return { kind: "radar", status: "hype" };
}

async function fetchImage(url: string) {
  const headersList = [
    {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: url.includes("rawg") ? "https://rawg.io/" : "https://store.steampowered.com/",
    },
    {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/*",
    },
  ];
  for (const headers of headersList) {
    try {
      const res = await fetch(url, { redirect: "follow", headers: headers as HeadersInit });
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength < 80) continue;
      return bytes;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function mirrorCover(url?: string | null) {
  if (!url) return url || "";
  if (url.includes("supabase.co") && url.includes("/storage/v1/object/public/")) return url;
  if (url.startsWith("/")) return url;
  try {
    const bytes = await fetchImage(url);
    if (!bytes) return url;
    const supabase = createServiceClient();
    const path = `gaming/mirrors/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from("afterimage").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) return url;
    const { data } = supabase.storage.from("afterimage").getPublicUrl(path);
    return data.publicUrl || url;
  } catch {
    return url;
  }
}

export async function mirrorItemCovers(items: GamingItem[]) {
  const out: GamingItem[] = [];
  let changed = false;
  for (const item of items) {
    if (!item.cover || item.cover.includes("supabase.co")) {
      out.push(item);
      continue;
    }
    const cover = await mirrorCover(item.cover);
    if (cover !== item.cover) changed = true;
    out.push({ ...item, cover });
  }
  return { items: out, changed };
}

export async function pullRawgBatch(opts: {
  key: string;
  era: PullEra;
  count: number;
  existing: GamingItem[];
  seen: string[];
  platforms?: string;
}) {
  const have = new Set(
    opts.existing.map((i) => i.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
  );
  const seen = new Set(opts.seen);
  const platforms = encodeURIComponent(opts.platforms || "4");
  const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(opts.key)}&platforms=${platforms}&page_size=40&${eraQuery(
    opts.era
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`RAWG ${res.status}`);
  const json = await res.json();
  const results = Array.isArray(json.results) ? json.results : [];
  const added: GamingItem[] = [];
  const newSeen = [...opts.seen];
  const { kind, status } = eraKind(opts.era);

  for (const g of results) {
    if (added.length >= opts.count) break;
    const id = `rawg-${g.id}`;
    const title = String(g.name || "").trim();
    if (!title || !g.background_image) continue;
    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (have.has(key) || seen.has(id)) continue;
    const cover = await mirrorCover(g.background_image);
    added.push({
      id,
      kind,
      title,
      slug: slugify(title),
      note:
        opts.era === "coming"
          ? "On the radar. Not pre-ordering."
          : opts.era === "classic"
            ? "From the pile. Still worth a night."
            : "In rotation or making noise right now.",
      body: "",
      status,
      cover,
      meta: eraMeta(opts.era, g.released),
      url: g.slug ? `https://rawg.io/games/${g.slug}` : "",
      featured: false,
      sort: opts.era === "coming" ? 35 : opts.era === "classic" ? 85 : 25,
      published: true,
    });
    have.add(key);
    newSeen.push(id);
  }

  return { added, seen: newSeen.slice(-400) };
}

export async function runDailyPull(
  config: GamingConfig,
  items: GamingItem[],
  force = false
) {
  if (!config.rawg_api_key) {
    return { config, items, added: [] as GamingItem[], skipped: "no_key" };
  }
  if (!config.auto_pull_enabled && !force) {
    return { config, items, added: [] as GamingItem[], skipped: "disabled" };
  }
  const today = todayStamp();
  if (!force && config.auto_last_date === today) {
    return { config, items, added: [] as GamingItem[], skipped: "already_today" };
  }
  const count = Math.min(Math.max(Number(config.auto_pull_per_day) || 3, 1), 8);
  const era = (config.auto_pull_era || "current") as PullEra;
  const { added, seen } = await pullRawgBatch({
    key: config.rawg_api_key,
    era,
    count,
    existing: items,
    seen: Array.isArray(config.auto_seen_ids) ? config.auto_seen_ids : [],
    platforms: config.radar_platforms,
  });
  const nextItems = added.length
    ? [...items.filter((i) => i.id !== "radar-placeholder"), ...added]
    : items;
  const nextConfig: GamingConfig = {
    ...config,
    auto_last_date: today,
    auto_seen_ids: seen,
  };
  return { config: nextConfig, items: nextItems, added, skipped: added.length ? "" : "none_new" };
}
