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
  | "library";

export type GamingItem = {
  id: string;
  kind: GamingKind;
  title: string;
  note: string;
  status: GamingStatus;
  cover?: string | null;
  meta?: string | null; // e.g. "Season 11 · ends Sep 30" or "Out Aug 28"
  url?: string | null;
  hours?: number | null;
  sort: number;
  published: boolean;
};

export type GamingConfig = {
  rawg_api_key: string;
  radar_enabled: boolean;
  radar_platforms: string; // e.g. "4" for PC on RAWG
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

/** Seed content so the page looks alive before admin fills it */
export const SEED_GAMING_ITEMS: GamingItem[] = [
  {
    id: "play-arc",
    kind: "playing",
    title: "Arc Raiders",
    note: "Extraction chaos. Good nights and bad extracts in equal measure.",
    status: "playing",
    meta: "PC · live",
    sort: 10,
    published: true,
  },
  {
    id: "play-poe2",
    kind: "playing",
    title: "Path of Exile 2",
    note: "Still arguing with the passive tree. Worth it when a build finally clicks.",
    status: "playing",
    meta: "PC · early access",
    sort: 20,
    published: true,
  },
  {
    id: "season-finals",
    kind: "season",
    title: "THE FINALS",
    note: "Season grind when the mood is pure chaos. Medium loadouts only.",
    status: "season",
    meta: "Season live · check in-game",
    sort: 30,
    published: true,
  },
  {
    id: "drama-1",
    kind: "drama",
    title: "Live-service fatigue is real",
    note: "Studios keep shipping seasons like rent is due. Some of it slaps. Most of it is homework with a battle pass.",
    status: "hype",
    meta: "Den take",
    sort: 40,
    published: true,
  },
  {
    id: "drama-2",
    kind: "drama",
    title: "Day-one patches are the new trailer",
    note: "If your launch needs a 40GB fix in week one, just say the beta never ended.",
    status: "avoid",
    meta: "Den take",
    sort: 50,
    published: true,
  },
  {
    id: "watch-1",
    kind: "watchlist",
    title: "Crimson Desert",
    note: "Watching. Not pre-ordering. Trailers lie for a living.",
    status: "watch",
    meta: "Wait for reviews",
    sort: 60,
    published: true,
  },
  {
    id: "watch-2",
    kind: "watchlist",
    title: "Whatever Open-World #47 is this quarter",
    note: "Map markers are not content. Prove it or stay on the list.",
    status: "watch",
    meta: "Maybe later",
    sort: 70,
    published: true,
  },
  {
    id: "lib-1",
    kind: "library",
    title: "Diablo 4",
    note: "Comes and goes. Paladin experiments when the season isn’t homework.",
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
    note: "Connect a RAWG API key in Admin → Gaming to pull live PC releases here. Until then this is a placeholder slot.",
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
