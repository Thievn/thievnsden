export const LOOT_SECTIONS = [
  { id: "desk", label: "Desk", blurb: "The battlestation that actually stays." },
  { id: "shelf", label: "Shelf", blurb: "Figures and objects with presence." },
  { id: "phone", label: "Phone", blurb: "Cases, grips, cables, bricks." },
  { id: "audio", label: "Audio", blurb: "Headsets, mics, the return-cycle survivors." },
  { id: "house", label: "Den tools", blurb: "House-lite. Raceways, arms, lamps. No air fryers." },
] as const;

export type LootSection = (typeof LOOT_SECTIONS)[number]["id"];

export const PHOTO_SCENES = [
  { id: "auto", label: "Auto" },
  { id: "studio", label: "Studio packshot" },
  { id: "shelf", label: "On a shelf" },
  { id: "desk", label: "On a desk" },
  { id: "hand", label: "In hand / worn" },
  { id: "wall", label: "On a wall" },
  { id: "floor", label: "On the floor / corner" },
] as const;

export type LootPick = {
  id: string;
  section: LootSection | string;
  name: string;
  snippet: string;
  body: string;
  image_url?: string | null;
  search_query?: string;
  asin?: string;
  dest_url?: string;
  tag_override?: string;
  status?: string;
  active?: boolean;
  sort_order?: number;
};

export type LootItem = {
  id: string;
  name: string;
  category: string;
  short: string;
  review: string;
  link: string;
  status: string;
};

export const LOOT_ITEMS: LootItem[] = [
  {
    id: "corsair-4000d",
    name: "Corsair 4000D Airflow",
    category: "PC Builds",
    short: "The case that stopped me from buying another one.",
    review:
      "Clean layout, actually useful cable management, and the front mesh does its job without looking like a fish tank. I’ve built in worse. If you’re putting a real system together, this is still one of the safer choices.",
    link: "https://www.amazon.com/s?k=Corsair+4000D+Airflow&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "rog-rtx",
    name: "ASUS ROG / NVIDIA RTX",
    category: "PC Builds",
    short: "The reason the rest of the build exists.",
    review:
      "Power hungry, expensive, and still the part that makes everything else worth doing. Whether it’s a Strix or a Founders card, the high-end NVIDIA cards are what actually move the needle.",
    link: "https://www.amazon.com/s?k=ASUS+ROG+Strix+RTX&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "anime-figure-sitting",
    name: "Anime Figure – Sitting Pose",
    category: "Anime / Merch",
    short: "Shelf presence without the usual plastic look.",
    review:
      "Decent sculpt, paint that doesn’t look rushed, and it doesn’t dominate the entire shelf. One of the few figures that still looks intentional after the initial hype fades.",
    link: "https://www.amazon.com/s?k=anime+figure+sitting+statue&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "wireless-headset",
    name: "Wireless Gaming Headset",
    category: "Gaming",
    short: "The one that survived the return cycle.",
    review:
      "Comfortable enough for long sessions, mic that doesn’t sound like a tin can, and battery life that outlasts my patience. Not perfect, but it’s the one that stayed.",
    link: "https://www.amazon.com/s?k=wireless+gaming+headset&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "compact-keyboard",
    name: "60% Mechanical Keyboard",
    category: "Gaming",
    short: "Smaller desk footprint, still satisfying.",
    review:
      "RGB can be turned down or off. The switches feel good and it doesn’t take over half the desk. One of the few keyboards that made it past the rotation.",
    link: "https://www.amazon.com/s?k=60+percent+mechanical+keyboard&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "anime-figure-dual",
    name: "Anime Figure – Dual Character",
    category: "Anime / Merch",
    short: "Two characters, one base, less wasted space.",
    review:
      "Better than average paint work and the poses actually work together. Still a luxury item, but at least it doesn’t feel completely hollow once it’s on the shelf.",
    link: "https://www.amazon.com/s?k=anime+figure+statue+set&tag=thievnsden-20",
    status: "In the Den",
  },
];

export const SEED_PICKS: LootPick[] = LOOT_ITEMS.map((item, i) => ({
  id: item.id,
  section: item.category.includes("Anime") ? "shelf" : "desk",
  name: item.name,
  snippet: item.short,
  body: item.review,
  search_query: searchTermFromLink(item.link),
  status: item.status,
  active: true,
  sort_order: i,
}));

export function searchTermFromLink(link: string) {
  try {
    const u = new URL(link);
    return decodeURIComponent(u.searchParams.get("k") || "").replace(/\+/g, " ");
  } catch {
    return "";
  }
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `pick-${Date.now().toString(36)}`
  );
}

export function uniqueLootId(name: string, existing: LootPick[], skipId?: string) {
  const base = slugify(name);
  const taken = new Set(existing.filter((p) => p.id !== skipId).map((p) => p.id));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function sectionLabel(id: string) {
  return LOOT_SECTIONS.find((s) => s.id === id)?.label || id;
}

export function sectionBlurb(id: string) {
  return LOOT_SECTIONS.find((s) => s.id === id)?.blurb || "";
}

export function normalizeLootSection(id?: string | null): LootSection {
  const raw = String(id || "desk");
  if (LOOT_SECTIONS.some((s) => s.id === raw)) return raw as LootSection;
  return "desk";
}

export const AMAZON_TAG = "thievnsden-20";

export function amazonSearchUrl(query: string, tag = AMAZON_TAG) {
  const q = String(query || "").trim();
  const t = (tag || AMAZON_TAG).trim();
  return `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${encodeURIComponent(t)}`;
}

export function affiliateUrl(pick: Partial<LootPick>, defaultTag = AMAZON_TAG) {
  const tag = (pick.tag_override || defaultTag || "thievnsden-20").trim();
  if (pick.asin) return `https://www.amazon.com/dp/${pick.asin.replace(/[^A-Z0-9]/gi, "")}?tag=${encodeURIComponent(tag)}`;
  if (pick.search_query) {
    return `https://www.amazon.com/s?k=${encodeURIComponent(pick.search_query)}&tag=${encodeURIComponent(tag)}`;
  }
  if (pick.dest_url) {
    try {
      const u = new URL(pick.dest_url);
      if (!u.searchParams.get("tag")) u.searchParams.set("tag", tag);
      return u.toString();
    } catch {
      return pick.dest_url;
    }
  }
  const fallback = LOOT_ITEMS.find((i) => i.id === pick.id);
  return fallback?.link || `https://www.amazon.com/s?k=${encodeURIComponent(pick.name || "")}&tag=${encodeURIComponent(tag)}`;
}

const SCENE_TEXT: Record<string, string> = {
  studio: "seamless void catalog packshot, the object floating or standing on nothing, cinematic product lighting, zero furniture",
  shelf: "one collector glass shelf, museum spotlight, the object is the only readable thing, other silhouettes are blur only",
  desk: "dark aluminum battlestation crop, the product is the hero on a nearly empty desk, RGB rim only as accent",
  hand: "worn or held in a gloved or anonymous hand, tight crop, no room visible",
  wall: "mounted on a dark textured wall, product fills the frame",
  floor: "workshop concrete or rubber mat, utility object isolated, not a staged home",
};

const LIGHTS = [
  "cool cyan rim against warm key",
  "hard side light with a thin gold edge",
  "soft overhead with a teal bounce",
  "low hero light, almost black surround",
  "split amber and steel lighting",
];
const BACKS = [
  "void black seamless",
  "brushed gunmetal plate",
  "obsidian acrylic",
  "dark carbon weave",
  "matte charcoal cyc",
];
const ANGLES = [
  "three-quarter catalog hero",
  "slightly low hero angle",
  "eye-level packshot",
  "tight 50mm product crop",
  "top-down with dramatic falloff",
];

function hashSalt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function inferPhotoScene(item: { name?: string; search_query?: string; section?: string }) {
  const t = `${item.name || ""} ${item.search_query || ""}`.toLowerCase();
  if (/(figure|statue|nendoroid|scale|funko|plush)/.test(t)) return "shelf";
  if (/(headset|headphone|earbuds|watch|ring|wear|mic)/.test(t)) return "hand";
  if (/(wall mount|monitor arm|pegboard|poster|frame|led strip)/.test(t)) return "wall";
  if (/(vac|filter|lamp|raceway|bin|stand)/.test(t) && item.section === "house") return "floor";
  if (/(case|gpu|keyboard|mouse|webcam|pc)/.test(t)) return "studio";
  if (item.section === "shelf") return "shelf";
  if (item.section === "phone") return "studio";
  if (item.section === "audio") return "hand";
  return "studio";
}

export function lootCoverPrompt(
  item: { name: string; section?: string; search_query?: string; category?: string; id?: string },
  extra = "",
  sceneId = "auto"
) {
  const term = item.search_query || item.name;
  const scene = sceneId === "auto" ? inferPhotoScene(item) : sceneId;
  const sceneLine = SCENE_TEXT[scene] || SCENE_TEXT.studio;
  const salt = hashSalt(`${item.id || ""}|${item.name}|${term}|${scene}|${extra}`);
  const light = LIGHTS[salt % LIGHTS.length];
  const back = BACKS[(salt >> 3) % BACKS.length];
  const angle = ANGLES[(salt >> 7) % ANGLES.length];
  const section = item.section || "desk";
  return [
    "Photorealistic single-product catalog photograph, Amazon listing quality, 4:3.",
    `The only subject is this exact object: ${item.name}.`,
    `Search intent / what it is: ${term}.`,
    `Loot section: ${section}.`,
    sceneLine + ".",
    `Lighting: ${light}. Background: ${back}. Camera: ${angle}.`,
    "Make this still unique. Do not reuse a living-room, bedroom, kitchen, sofa, nightstand, house interior, staged home, or furniture set.",
    "No people faces, no readable text, no watermark, no collage, no extra products competing.",
    extra,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
