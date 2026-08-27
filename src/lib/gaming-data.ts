export type GamingStatus =
  | "playing"
  | "hype"
  | "dropped"
  | "avoid"
  | "season"
  | "watch"
  | "library";

export type GamingKind =
  | "playing"
  | "radar"
  | "drama"
  | "season"
  | "watchlist"
  | "library"
  | "article";

/** Public shelves people actually browse. */
export type GamingShelf = "current" | "coming" | "classic" | "essay";

export type PullEra = "coming" | "current" | "classic";

export type GamingItem = {
  id: string;
  kind: GamingKind;
  shelf?: GamingShelf;
  title: string;
  note: string;
  body?: string | null;
  status: GamingStatus;
  cover?: string | null;
  meta?: string | null;
  url?: string | null;
  slug?: string | null;
  released?: string | null;
  hours?: number | null;
  featured?: boolean;
  sort: number;
  published: boolean;
};

/** Games this old (or older) sit on Classics. Younger titles stay on Out now. */
export const CLASSIC_AGE_YEARS = 8;

/** Rewrite a game take if the stored body is shorter than this. */
export const SHORT_GAME_BODY_CHARS = 900;

export type GamingConfig = {
  rawg_api_key: string;
  radar_enabled: boolean;
  radar_platforms: string;
  radar_page_size: number;
  hero_line: string;
  currently_line: string;
  auto_pull_enabled: boolean;
  auto_pull_era: PullEra;
  auto_pull_per_day: number;
  auto_last_date: string;
  auto_seen_ids: string[];
  auto_essay_enabled: boolean;
  auto_essay_last_date: string;
  auto_essay_seen: string[];
};

export const DEFAULT_GAMING_CONFIG: GamingConfig = {
  rawg_api_key: "",
  radar_enabled: false,
  radar_platforms: "4",
  radar_page_size: 8,
  hero_line: "Full-page takes. Real covers. No press kits.",
  currently_line: "",
  auto_pull_enabled: true,
  auto_pull_era: "current",
  auto_pull_per_day: 5,
  auto_last_date: "",
  auto_seen_ids: [],
  auto_essay_enabled: true,
  auto_essay_last_date: "",
  auto_essay_seen: [],
};

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || `item-${Date.now()}`
  );
}

export function itemSlug(item: GamingItem): string {
  return item.slug || slugify(item.title) || item.id;
}

export function uniqueSlug(title: string, existing: GamingItem[], skipId?: string): string {
  const base = slugify(title);
  const taken = new Set(
    existing.filter((i) => i.id !== skipId).map((i) => itemSlug(i))
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function shelfOf(item: GamingItem): GamingShelf {
  if (item.shelf) return item.shelf;
  if (item.kind === "watchlist") return "coming";
  if (item.kind === "library") return "classic";
  if (item.kind === "drama" || item.kind === "article") return "essay";
  return "current";
}

export function shelfFromKind(kind: GamingKind): GamingShelf {
  if (kind === "watchlist") return "coming";
  if (kind === "library") return "classic";
  if (kind === "drama" || kind === "article") return "essay";
  return "current";
}

export function eraToKind(era: PullEra): { kind: GamingKind; status: GamingStatus; shelf: GamingShelf } {
  if (era === "coming") return { kind: "watchlist", status: "watch", shelf: "coming" };
  if (era === "classic") return { kind: "library", status: "library", shelf: "classic" };
  return { kind: "radar", status: "hype", shelf: "current" };
}

export function parseReleasedUtc(released?: string | null): number | null {
  const iso = String(released || "").trim().slice(0, 10);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00.000Z`);
  return Number.isNaN(t) ? null : t;
}

export function utcDay(now = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function classicCutoffUtc(now = new Date()) {
  return Date.UTC(
    now.getUTCFullYear() - CLASSIC_AGE_YEARS,
    now.getUTCMonth(),
    now.getUTCDate()
  );
}

/** coming = future or no date. classic = released 8+ years ago. else current. */
export function shelfFromReleased(released?: string | null, now = new Date()): PullEra {
  const t = parseReleasedUtc(released);
  if (t == null) return "coming";
  const today = utcDay(now);
  if (t > today) return "coming";
  if (t <= classicCutoffUtc(now)) return "classic";
  return "current";
}

/** Early access / live titles often keep a future 1.0 date on RAWG. */
export function shelfFromRawgSignals(opts: {
  released?: string | null;
  ratingsCount?: number;
  playtime?: number;
  inRotation?: boolean;
  now?: Date;
}): PullEra {
  let era = shelfFromReleased(opts.released, opts.now);
  if (era !== "coming") return era;
  if (opts.inRotation) return "current";
  if ((opts.ratingsCount || 0) >= 40) return "current";
  if ((opts.playtime || 0) > 0) return "current";
  return "coming";
}

export function formatReleasedLabel(released?: string | null) {
  const iso = String(released || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function eraMeta(era: PullEra, released?: string | null, earlyAccess = false) {
  const label = formatReleasedLabel(released);
  const year = String(released || "").slice(0, 4);
  if (earlyAccess) return label ? `Playable now · 1.0 ${label}` : "Playable now";
  if (era === "coming") return label ? `Drops ${label}` : "Coming soon";
  if (era === "classic") return year ? `Classic · ${year}` : "Classic";
  return label ? `Out ${label}` : "Out now";
}

export function sortForShelf(shelf: GamingShelf, fallback = 40) {
  if (shelf === "coming") return 35;
  if (shelf === "classic") return 85;
  if (shelf === "essay") return 8;
  return fallback < 40 ? fallback : 25;
}

export function applyReleaseShelf(
  item: GamingItem,
  released?: string | null,
  signals?: { ratingsCount?: number; playtime?: number }
): GamingItem {
  if (item.kind === "article" || item.kind === "drama" || item.shelf === "essay") return item;
  const date = released || item.released || "";
  const keepKind = item.kind === "playing" || item.kind === "season";
  const keepStatus = item.status === "playing" || item.status === "season";
  const era = shelfFromRawgSignals({
    released: date,
    ratingsCount: signals?.ratingsCount,
    playtime: signals?.playtime,
    inRotation: keepKind || keepStatus,
  });
  const mapped = eraToKind(era);
  return {
    ...item,
    released: date || item.released || "",
    shelf: mapped.shelf,
    kind: keepKind ? item.kind : mapped.kind,
    status: keepStatus ? item.status : mapped.status,
    meta: eraMeta(era, date, shelfFromReleased(date) === "coming" && era === "current"),
    sort: sortForShelf(mapped.shelf, item.sort),
  };
}

export function isGameCard(item: GamingItem) {
  return shelfOf(item) !== "essay";
}

export const SHELF_COPY: Record<GamingShelf, { title: string; tile: string; blurb: string }> = {
  current: {
    title: "Out now",
    tile: "Out now",
    blurb: "Released, and younger than eight years.",
  },
  coming: {
    title: "Coming soon",
    tile: "Soon",
    blurb: "A future date, or no date yet. Not playable.",
  },
  classic: {
    title: "Classics",
    tile: "Classic",
    blurb: "Eight years or older. Still worth booting.",
  },
  essay: {
    title: "Den takes",
    tile: "Take",
    blurb: "Culture notes, not recaps.",
  },
};

export const SHELVES: { id: GamingShelf | "all"; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Everything on the plate" },
  { id: "current", label: SHELF_COPY.current.title, hint: SHELF_COPY.current.blurb },
  { id: "coming", label: SHELF_COPY.coming.title, hint: SHELF_COPY.coming.blurb },
  { id: "classic", label: SHELF_COPY.classic.title, hint: SHELF_COPY.classic.blurb },
  { id: "essay", label: SHELF_COPY.essay.title, hint: SHELF_COPY.essay.blurb },
];

export const STATUS_STYLES: Record<
  GamingStatus,
  { label: string; className: string }
> = {
  playing: {
    label: "playing",
    className: "bg-red-950/50 text-red-300 border-red-900/50",
  },
  hype: {
    label: "hype",
    className: "bg-purple-950/50 text-purple-300 border-purple-900/50",
  },
  dropped: {
    label: "dropped",
    className: "bg-neutral-900 text-neutral-400 border-neutral-700",
  },
  avoid: {
    label: "avoid",
    className: "bg-amber-950/40 text-amber-300/90 border-amber-900/40",
  },
  season: {
    label: "season",
    className: "bg-rose-950/40 text-rose-300 border-rose-900/40",
  },
  watch: {
    label: "watch",
    className: "bg-neutral-900 text-neutral-300 border-neutral-700",
  },
  library: {
    label: "library",
    className: "bg-neutral-900 text-neutral-400 border-neutral-800",
  },
};

export const ESSAY_TOPICS = [
  "The good old days of gaming — CRT glow, manuals, and actually finishing a game",
  "LAN nights vs always-online seasons",
  "When cheat codes felt like magic and battle passes feel like chores",
  "Why older games still feel better on a Tuesday night",
  "Save files you kept for years and the cloud that ate them",
  "The era when a sequel meant more game, not more shop",
  "Midnight releases, pizza boxes, and no algorithmic feed",
  "Difficulty that taught you versus difficulty that sells a guide",
];

const JUNK_TITLES = new Set([
  "whatever open-world #47 is this quarter",
  "release radar",
]);

export function normalizeItem(item: GamingItem, existing: GamingItem[] = []): GamingItem {
  const dated =
    item.kind === "article" || item.kind === "drama" || item.shelf === "essay"
      ? item
      : item.released
        ? applyReleaseShelf(item, item.released)
        : item;
  const shelf = shelfOf(dated);
  const slug = dated.slug || uniqueSlug(dated.title, existing, dated.id);
  return {
    ...dated,
    shelf,
    slug,
    note: dated.note || "",
    body: dated.body || "",
    published: dated.published !== false,
    cover: dated.cover || "",
  };
}

export function cleanGamingItems(items: GamingItem[]): GamingItem[] {
  const seenTitle = new Set<string>();
  const seenId = new Set<string>();
  const out: GamingItem[] = [];
  const sorted = [...items].sort((a, b) => {
    const ab = (a.body || "").trim().length;
    const bb = (b.body || "").trim().length;
    return bb - ab;
  });
  for (const raw of sorted) {
    if (!raw?.title) continue;
    if (raw.id === "radar-placeholder") continue;
    const titleKey = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (JUNK_TITLES.has(titleKey)) continue;
    if (seenId.has(raw.id)) continue;
    if (seenTitle.has(titleKey) && isGameCard(raw)) continue;
    seenId.add(raw.id);
    seenTitle.add(titleKey);
    out.push(normalizeItem(raw, out));
  }
  return out.sort((a, b) => a.sort - b.sort);
}

export const SEED_GAMING_ITEMS: GamingItem[] = cleanGamingItems([
  {
    id: "play-arc",
    kind: "playing",
    shelf: "current",
    title: "Arc Raiders",
    slug: "arc-raiders",
    note: "Extraction chaos. Good nights and bad extracts in equal measure.",
    body: "Extraction chaos.\n\nGood nights and bad extracts in equal measure. When it clicks, nothing else on the PC matters for a few hours.\n\nStill early enough that every wipe teaches something. Not early enough that the excuses hold.",
    status: "playing",
    meta: "PC · live",
    sort: 10,
    published: true,
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1808500/header.jpg",
  },
  {
    id: "play-poe2",
    kind: "playing",
    shelf: "current",
    title: "Path of Exile 2",
    slug: "path-of-exile-2",
    note: "Still arguing with the passive tree. Worth it when a build finally clicks.",
    body: "Still arguing with the passive tree.\n\nWorth it when a build finally clicks and the screen turns into a light show you actually earned.",
    status: "playing",
    meta: "PC · early access",
    sort: 20,
    published: true,
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/2694490/header.jpg",
  },
  {
    id: "season-finals",
    kind: "season",
    shelf: "current",
    title: "THE FINALS",
    slug: "the-finals",
    note: "Season grind when the mood is pure chaos. Medium loadouts only.",
    body: "Season grind when the mood is pure chaos.\n\nMedium loadouts only. Destruction still feels better than half the tactical shooters shipping this year.",
    status: "season",
    meta: "Season live",
    sort: 30,
    published: true,
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/2073850/header.jpg",
  },
  {
    id: "watch-1",
    kind: "watchlist",
    shelf: "coming",
    title: "Crimson Desert",
    slug: "crimson-desert",
    note: "Watching. Not pre-ordering. Trailers lie for a living.",
    body: "Watching. Not pre-ordering.\n\nTrailers lie for a living. Reviews and the first patch notes decide if it leaves the list.",
    status: "watch",
    meta: "Wait for reviews",
    sort: 60,
    published: true,
  },
  {
    id: "lib-1",
    kind: "library",
    shelf: "classic",
    title: "Diablo 4",
    slug: "diablo-4",
    note: "Comes and goes. Paladin experiments when the season isn’t homework.",
    body: "Comes and goes.\n\nPaladin experiments when the season isn’t homework. Installed, not worshipped.",
    status: "library",
    hours: 120,
    meta: "Installed",
    sort: 80,
    published: true,
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/2344520/header.jpg",
  },
  {
    id: "drama-1",
    kind: "article",
    shelf: "essay",
    title: "Live-service fatigue is real",
    slug: "live-service-fatigue",
    note: "Studios keep shipping seasons like rent is due. Some of it slaps. Most of it is homework with a battle pass.",
    body: "Studios keep shipping seasons like rent is due.\n\nSome of it slaps. Most of it is homework with a battle pass and a calendar invite you never asked for.\n\nIf a season needs a spreadsheet to enjoy, it already lost.",
    status: "hype",
    meta: "Den take",
    featured: true,
    sort: 5,
    published: true,
  },
]);
