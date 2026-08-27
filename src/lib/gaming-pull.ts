import { createServiceClient } from "@/lib/supabase/server";
import {
  ESSAY_TOPICS,
  SHORT_GAME_BODY_CHARS,
  applyReleaseShelf,
  classicCutoffUtc,
  cleanGamingItems,
  eraMeta,
  eraToKind,
  shelfFromRawgSignals,
  shelfFromReleased,
  shelfOf,
  sortForShelf,
  uniqueSlug,
  type GamingConfig,
  type GamingItem,
  type PullEra,
} from "@/lib/gaming-data";
import { stripHtml, writeEssay, writeGameTake } from "@/lib/gaming-write";
import { generateGrokCover } from "@/lib/gaming-art";
import { lookupGameCover } from "@/lib/gaming-covers";

export type { PullEra };

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function dateShift(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function eightYearsAgoStamp(now = new Date()) {
  return new Date(classicCutoffUtc(now)).toISOString().slice(0, 10);
}

function eraQuery(era: PullEra, page: number) {
  const p = Math.max(1, page);
  if (era === "coming") {
    return `dates=${dateShift(1)},${dateShift(400)}&ordering=-added&page=${p}`;
  }
  if (era === "classic") {
    return `dates=1996-01-01,${eightYearsAgoStamp()}&ordering=-rating&page=${p}`;
  }
  return `dates=${eightYearsAgoStamp()},${dateShift(0)}&ordering=-added&page=${p}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function titleKey(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function mixEras(count: number): PullEra[] {
  const n = Math.min(Math.max(count, 1), 8);
  const base: PullEra[] = ["current", "coming", "classic"];
  const out: PullEra[] = [];
  if (n >= 3) out.push(...base);
  while (out.length < n) out.push(base[Math.floor(Math.random() * base.length)]);
  return shuffle(out).slice(0, n);
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

export function rawgPulse(game: any) {
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
  return [
    `Game: ${game.name}`,
    rating ? `RAWG rating: ${rating}/5${ratingsCount ? ` (${ratingsCount} ratings)` : ""}` : null,
    metacritic != null ? `Metacritic: ${metacritic}` : null,
    topRatings.length ? `Player breakdown: ${topRatings.join(", ")}` : null,
    genres.length ? `Genres: ${genres.join(", ")}` : null,
    tags.length ? `Tags: ${tags.join(", ")}` : null,
    game.released ? `Released: ${game.released}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function rawgGame(key: string, id: string | number) {
  const res = await fetch(
    `https://api.rawg.io/api/games/${encodeURIComponent(String(id))}?key=${encodeURIComponent(key)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function rawgSearchList(key: string, q: string, pageSize = 8) {
  const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&search=${encodeURIComponent(
    q
  )}&page_size=${pageSize}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`RAWG ${res.status}`);
  const json = await res.json();
  return Array.isArray(json.results) ? json.results : [];
}

function looksLikeAGame(g: any) {
  const name = String(g.name || "");
  if (!name) return false;
  if (/soundtrack|ost\b|pack$|dlc\b|theme$/i.test(name)) return false;
  const genres = g.genres || [];
  if (Array.isArray(genres) && genres.some((x: any) => /software|utility/i.test(x.name || ""))) {
    return false;
  }
  return Boolean(g.background_image || g.short_screenshots?.length);
}

export async function composeGameItem(opts: {
  key: string;
  game: any;
  era?: PullEra;
  existing: GamingItem[];
}) {
  const detail = (await rawgGame(opts.key, opts.game.id)) || opts.game;
  if (!looksLikeAGame(detail)) return null;
  const title = String(detail.name || "").trim();
  if (!title) return null;
  const description = stripHtml(detail.description_raw || detail.description || "");
  const coverSrc =
    detail.background_image ||
    detail.background_image_additional ||
    detail.short_screenshots?.[0]?.image ||
    "";
  let cover = coverSrc ? await mirrorCover(coverSrc) : "";
  if (!cover) {
    try {
      cover = await generateGrokCover({ title, note: description.slice(0, 220), body: description });
    } catch (err) {
      console.error("composeGameItem grok cover", title, err);
    }
  }
  if (!cover) return null;
  const released = String(detail.released || "").slice(0, 10);
  const era = shelfFromRawgSignals({
    released,
    ratingsCount: Number(detail.ratings_count || detail.reviews_count || 0),
    playtime: Number(detail.playtime || 0),
  });
  const pulse = rawgPulse(detail);
  const take = await writeGameTake({
    title,
    era,
    pulse,
    description,
  });
  const { kind, status, shelf } = eraToKind(era);
  const item: GamingItem = {
    id: `rawg-${detail.id}`,
    kind,
    shelf,
    title,
    slug: uniqueSlug(title, opts.existing),
    note: take.note,
    body: take.body,
    status,
    cover,
    released,
    meta: eraMeta(era, released, shelfFromReleased(released) === "coming" && era === "current"),
    url: detail.slug ? `https://rawg.io/games/${detail.slug}` : "",
    featured: false,
    sort: sortForShelf(shelf),
    published: true,
  };
  return item;
}

export async function pullRawgBatch(opts: {
  key: string;
  era: PullEra;
  count: number;
  existing: GamingItem[];
  seen: string[];
  platforms?: string;
}) {
  const have = new Set(opts.existing.map((i) => titleKey(i.title)));
  const seen = new Set(opts.seen);
  const platforms = encodeURIComponent(opts.platforms || "4");
  const page = 1 + Math.floor(Math.random() * 3);
  const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(opts.key)}&platforms=${platforms}&page_size=40&${eraQuery(
    opts.era,
    page
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`RAWG ${res.status}`);
  const json = await res.json();
  const results: any[] = shuffle(Array.isArray(json.results) ? json.results : []);
  const added: GamingItem[] = [];
  const newSeen = [...opts.seen];
  const working = [...opts.existing];

  for (const g of results) {
    if (added.length >= opts.count) break;
    const id = `rawg-${g.id}`;
    const title = String(g.name || "").trim();
    if (!title || !looksLikeAGame(g)) continue;
    if (have.has(titleKey(title)) || seen.has(id)) continue;
    try {
      const item = await composeGameItem({
        key: opts.key,
        game: g,
        era: opts.era,
        existing: working,
      });
      if (!item) continue;
      added.push(item);
      working.push(item);
      have.add(titleKey(item.title));
      newSeen.push(id);
    } catch (err) {
      console.error("composeGameItem", title, err);
    }
  }

  return { added, seen: newSeen.slice(-500) };
}

export async function backfillEmptyTakes(opts: {
  key: string;
  items: GamingItem[];
  limit?: number;
}) {
  const limit = opts.limit ?? 8;
  const out = [...opts.items];
  let filled = 0;
  for (let i = 0; i < out.length && filled < limit; i++) {
    const item = out[i];
    if ((item.body || "").trim().length > 40) continue;
    if (!item.id.startsWith("rawg-") && !item.title) continue;
    const rawgId = item.id.startsWith("rawg-") ? item.id.slice(5) : "";
    let detail: any = null;
    if (rawgId && opts.key) {
      detail = await rawgGame(opts.key, rawgId);
    }
    const era = shelfFromRawgSignals({
      released: detail?.released || item.released,
      ratingsCount: Number(detail?.ratings_count || detail?.reviews_count || 0),
      playtime: Number(detail?.playtime || 0),
      inRotation: item.kind === "playing" || item.kind === "season" || item.status === "playing",
    });
    const take = await writeGameTake({
      title: item.title,
      era,
      pulse: detail ? rawgPulse(detail) : "",
      description: detail ? stripHtml(detail.description_raw || "") : "",
    });
    let cover = item.cover || "";
    if (!cover && detail?.background_image) cover = await mirrorCover(detail.background_image);
    if (!cover) {
      try {
        cover = await generateGrokCover({
          title: item.title,
          note: take.note,
          body: take.body,
        });
      } catch (err) {
        console.error("backfill cover", item.title, err);
      }
    }
    out[i] = applyReleaseShelf(
      {
        ...item,
        note: take.note || item.note,
        body: take.body,
        cover,
        released: String(detail?.released || item.released || "").slice(0, 10),
      },
      detail?.released || item.released,
      {
        ratingsCount: Number(detail?.ratings_count || detail?.reviews_count || 0),
        playtime: Number(detail?.playtime || 0),
      }
    );
    filled += 1;
  }
  return { items: out, filled };
}

async function rawgDetailForItem(key: string, item: GamingItem) {
  const rawgId = item.id.startsWith("rawg-") ? item.id.slice(5) : "";
  if (rawgId && key) {
    const byId = await rawgGame(key, rawgId);
    if (byId) return byId;
  }
  if (!key || !item.title) return null;
  const hits = await rawgSearchList(key, item.title, 8);
  const match =
    hits.find((h: any) => titleKey(h.name) === titleKey(item.title)) || hits[0] || null;
  if (!match?.id) return match;
  return (await rawgGame(key, match.id)) || match;
}

export async function recategorizeAndExpand(opts: {
  key: string;
  items: GamingItem[];
  rewriteLimit?: number;
}) {
  const rewriteLimit = opts.rewriteLimit ?? 12;
  const out = [...opts.items];
  let recategorized = 0;
  let rewritten = 0;
  let covers = 0;

  for (let i = 0; i < out.length; i++) {
    const item = out[i];
    if (shelfOf(item) === "essay" || item.kind === "article" || item.kind === "drama") continue;

    let detail: any = null;
    try {
      detail = await rawgDetailForItem(opts.key, item);
    } catch (err) {
      console.error("recategorize lookup", item.title, err);
    }

    const released = String(detail?.released || item.released || "").slice(0, 10);
    const signals = {
      ratingsCount: Number(detail?.ratings_count || detail?.reviews_count || 0),
      playtime: Number(detail?.playtime || 0),
    };
    const next = applyReleaseShelf({ ...item, released }, released, signals);
    if (next.shelf !== item.shelf) recategorized += 1;

    let cover = next.cover || "";
    if (!cover && detail?.background_image) {
      cover = await mirrorCover(detail.background_image);
      if (cover) covers += 1;
    }
    if (!cover) {
      try {
        cover = await generateGrokCover({
          title: next.title,
          note: next.note,
          body: next.body || "",
        });
        if (cover) covers += 1;
      } catch (err) {
        console.error("recategorize cover", next.title, err);
      }
    }

    let body = next.body || "";
    let note = next.note;
    const era = (next.shelf === "coming" ? "coming" : next.shelf === "classic" ? "classic" : "current") as PullEra;
    const soundsUnreleased = /not (out|playable) yet|is not playable|wait for (launch|reviews)|on the radar/i.test(body);
    const needsRewrite =
      body.trim().length < SHORT_GAME_BODY_CHARS ||
      (era === "current" && soundsUnreleased) ||
      (era === "coming" && /how it actually plays|boot it tonight/i.test(body));
    if (needsRewrite && rewritten < rewriteLimit) {
      try {
        const take = await writeGameTake({
          title: next.title,
          era,
          pulse: detail ? rawgPulse(detail) : "",
          description: detail ? stripHtml(detail.description_raw || detail.description || "") : "",
        });
        if (take.body.trim().length >= SHORT_GAME_BODY_CHARS || take.body.trim().length > body.trim().length) {
          body = take.body;
          note = take.note;
          rewritten += 1;
        }
      } catch (err) {
        console.error("recategorize write", next.title, err);
      }
    }

    out[i] = {
      ...next,
      cover,
      body,
      note,
      released,
    };
  }

  return {
    items: cleanGamingItems(out),
    recategorized,
    rewritten,
    covers,
  };
}

export async function fillMissingCovers(items: GamingItem[], rawgKey = "", limit = 8) {
  const out = [...items];
  let filled = 0;
  for (let i = 0; i < out.length && filled < limit; i++) {
    const item = out[i];
    if (item.cover && String(item.cover).trim()) continue;
    let cover = "";
    if (shelfOf(item) !== "essay" && rawgKey) {
      const found = await lookupGameCover(item.title, rawgKey);
      if (found) cover = await mirrorCover(found);
    }
    if (!cover) {
      try {
        cover = await generateGrokCover({
          title: item.title,
          note: item.note,
          body: item.body || "",
        });
      } catch (err) {
        console.error("fillMissingCovers", item.title, err);
      }
    }
    if (!cover) continue;
    out[i] = { ...item, cover };
    filled += 1;
  }
  return { items: out, filled };
}

export async function addEssay(items: GamingItem[], seen: string[], topic?: string) {
  const unused = ESSAY_TOPICS.filter((t) => !seen.includes(t));
  const pick = topic || unused[Math.floor(Math.random() * (unused.length || 1))] || ESSAY_TOPICS[0];
  const written = await writeEssay(pick);
  let cover = "";
  try {
    cover = await generateGrokCover({
      title: written.title,
      note: written.note,
      body: written.body,
    });
  } catch (err) {
    console.error("essay cover", written.title, err);
  }
  const item: GamingItem = {
    id: `essay-${Date.now().toString(36)}`,
    kind: "article",
    shelf: "essay",
    title: written.title,
    slug: uniqueSlug(written.title, items),
    note: written.note,
    body: written.body,
    status: "hype",
    meta: "Den take",
    featured: false,
    sort: 8,
    published: true,
    cover,
  };
  return { item, topic: pick };
}

export async function runDailyPull(
  config: GamingConfig,
  items: GamingItem[],
  force = false
) {
  const cleaned = cleanGamingItems(items);
  if (!config.rawg_api_key) {
    return { config, items: cleaned, added: [] as GamingItem[], skipped: "no_key" };
  }
  if (!config.auto_pull_enabled && !force) {
    return { config, items: cleaned, added: [] as GamingItem[], skipped: "disabled" };
  }
  const today = todayStamp();
  if (!force && config.auto_last_date === today) {
    return { config, items: cleaned, added: [] as GamingItem[], skipped: "already_today" };
  }

  const count = Math.min(Math.max(Number(config.auto_pull_per_day) || 5, 1), 8);
  const eras = mixEras(count);
  let working = [...cleaned];
  let seen = Array.isArray(config.auto_seen_ids) ? [...config.auto_seen_ids] : [];
  const added: GamingItem[] = [];

  const grouped = new Map<PullEra, number>();
  for (const era of eras) grouped.set(era, (grouped.get(era) || 0) + 1);

  for (const [era, n] of grouped) {
    const batch = await pullRawgBatch({
      key: config.rawg_api_key,
      era,
      count: n,
      existing: working,
      seen,
      platforms: config.radar_platforms,
    });
    working = [...working, ...batch.added];
    added.push(...batch.added);
    seen = batch.seen;
  }

  const nextConfig: GamingConfig = {
    ...config,
    auto_last_date: today,
    auto_seen_ids: seen,
    auto_pull_per_day: count,
  };

  if (config.auto_essay_enabled) {
    const last = config.auto_essay_last_date || "";
    const gap =
      !last ||
      Math.abs(new Date(today).getTime() - new Date(last).getTime()) >= 36 * 60 * 60 * 1000;
    if (force || gap) {
      try {
        const essaySeen = Array.isArray(config.auto_essay_seen) ? config.auto_essay_seen : [];
        const essay = await addEssay(working, essaySeen);
        working.push(essay.item);
        added.push(essay.item);
        nextConfig.auto_essay_last_date = today;
        nextConfig.auto_essay_seen = [...essaySeen, essay.topic].slice(-40);
      } catch (err) {
        console.error("daily essay", err);
      }
    }
  }

  return {
    config: nextConfig,
    items: cleanGamingItems(working),
    added,
    skipped: added.length ? "" : "none_new",
  };
}

export function publicGamingConfig(config: GamingConfig) {
  return {
    ...config,
    rawg_api_key: config.rawg_api_key ? "configured" : "",
    auto_seen_ids: [],
    auto_essay_seen: [],
  };
}
