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

export type GamingItem = {
  id: string;
  kind: GamingKind;
  title: string;
  note: string;
  body?: string | null;
  status: GamingStatus;
  cover?: string | null;
  meta?: string | null;
  url?: string | null;
  slug?: string | null;
  hours?: number | null;
  featured?: boolean;
  sort: number;
  published: boolean;
};

export type GamingConfig = {
  rawg_api_key: string;
  radar_enabled: boolean;
  radar_platforms: string;
  radar_page_size: number;
  hero_line: string;
  currently_line: string;
};

export const DEFAULT_GAMING_CONFIG: GamingConfig = {
  rawg_api_key: "",
  radar_enabled: true,
  radar_platforms: "4",
  radar_page_size: 8,
  hero_line: "Builds, takes, seasons, and whatever is eating the hours.",
  currently_line: "Currently in: rotation loading…",
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

export const SEED_GAMING_ITEMS: GamingItem[] = [
  {
    id: "drama-1",
    kind: "article",
    title: "Live-service fatigue is real",
    slug: "live-service-fatigue",
    note: "Studios keep shipping seasons like rent is due. Some of it slaps. Most of it is homework with a battle pass.",
    body: "Studios keep shipping seasons like rent is due.\n\nSome of it slaps. Most of it is homework with a battle pass and a calendar invite you never asked for.\n\nThe games that survive are the ones that still feel like play when the trackers go quiet. Everything else is a second job with worse benefits.\n\nIf a season needs a spreadsheet to enjoy, it already lost.",
    status: "hype",
    meta: "Den take",
    featured: true,
    sort: 5,
    published: true,
  },
  {
    id: "play-arc",
    kind: "playing",
    title: "Arc Raiders",
    slug: "arc-raiders",
    note: "Extraction chaos. Good nights and bad extracts in equal measure.",
    body: "Extraction chaos.\n\nGood nights and bad extracts in equal measure. When it clicks, nothing else on the PC matters for a few hours.\n\nStill early enough that every wipe teaches something. Not early enough that the excuses hold.",
    status: "playing",
    meta: "PC · live",
    sort: 10,
    published: true,
  },
  {
    id: "play-poe2",
    kind: "playing",
    title: "Path of Exile 2",
    slug: "path-of-exile-2",
    note: "Still arguing with the passive tree. Worth it when a build finally clicks.",
    body: "Still arguing with the passive tree.\n\nWorth it when a build finally clicks and the screen turns into a light show you actually earned.\n\nPoE2 is the rare game that punishes impatience and rewards obsession in the same breath.",
    status: "playing",
    meta: "PC · early access",
    sort: 20,
    published: true,
  },
  {
    id: "season-finals",
    kind: "season",
    title: "THE FINALS",
    slug: "the-finals",
    note: "Season grind when the mood is pure chaos. Medium loadouts only.",
    body: "Season grind when the mood is pure chaos.\n\nMedium loadouts only. Destruction still feels better than half the tactical shooters shipping this year.",
    status: "season",
    meta: "Season live",
    sort: 30,
    published: true,
  },
  {
    id: "drama-2",
    kind: "drama",
    title: "Day-one patches are the new trailer",
    slug: "day-one-patches",
    note: "If your launch needs a 40GB fix in week one, just say the beta never ended.",
    body: "If your launch needs a 40GB fix in week one, just say the beta never ended.\n\nTrailers sell the fantasy. Patches admit the truth. Plan your library around the second one.",
    status: "avoid",
    meta: "Den take",
    sort: 50,
    published: true,
  },
  {
    id: "watch-1",
    kind: "watchlist",
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
    id: "watch-2",
    kind: "watchlist",
    title: "Whatever Open-World #47 is this quarter",
    slug: "open-world-47",
    note: "Map markers are not content. Prove it or stay on the list.",
    body: "Map markers are not content.\n\nProve it or stay on the list.",
    status: "watch",
    meta: "Maybe later",
    sort: 70,
    published: true,
  },
  {
    id: "lib-1",
    kind: "library",
    title: "Diablo 4",
    slug: "diablo-4",
    note: "Comes and goes. Paladin experiments when the season isn’t homework.",
    body: "Comes and goes.\n\nPaladin experiments when the season isn’t homework. Installed, not worshipped.",
    status: "library",
    hours: 120,
    meta: "Installed",
    sort: 80,
    published: true,
  },
  {
    id: "lib-2",
    kind: "library",
    title: "THE FINALS",
    slug: "the-finals-library",
    note: "Destruction sandbox that still feels better than half the tactical shooters.",
    status: "library",
    hours: 80,
    meta: "Installed",
    sort: 90,
    published: true,
  },
  {
    id: "radar-placeholder",
    kind: "radar",
    title: "Release radar",
    slug: "release-radar",
    note: "Connect a RAWG API key in Admin → Gaming to pull live PC releases here.",
    status: "hype",
    meta: "Auto · needs API key",
    sort: 100,
    published: true,
  },
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

export const FILTERS = [
  { id: "all", label: "All" },
  { id: "playing", label: "Playing" },
  { id: "radar", label: "Radar" },
  { id: "drama", label: "Drama" },
  { id: "season", label: "Seasons" },
  { id: "watchlist", label: "Watchlist" },
  { id: "library", label: "Library" },
] as const;

export type FilterId = (typeof FILTERS)[number]["id"];
