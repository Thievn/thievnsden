export type Phone = {
  id: string;
  brand: string;
  name: string;
  w: number;
  h: number;
  aspect: string;
};

export const PHONES: Phone[] = [
  { id: "classic", brand: "Size", name: "9:16", w: 1080, h: 1920, aspect: "9:16" },
  { id: "tall", brand: "Size", name: "20:9", w: 1080, h: 2400, aspect: "9:16" },
  { id: "iphone-16", brand: "Size", name: "19.5:9", w: 1179, h: 2556, aspect: "9:16" },
];

export const LOOKS = [
  { id: "photo", label: "Photo", hint: "Real camera" },
  { id: "cinematic", label: "Film", hint: "Movie still" },
  { id: "anime", label: "Anime", hint: "Modern TV" },
  { id: "90s-cel", label: "90s cel", hint: "Old paint" },
  { id: "manhwa", label: "Manhwa", hint: "Webtoon gloss" },
  { id: "manga", label: "Manga", hint: "Ink + screen" },
  { id: "paint", label: "Oil", hint: "Canvas" },
  { id: "water", label: "Watercolor", hint: "Wet paper" },
  { id: "ink", label: "Ink", hint: "Graphic novel" },
  { id: "3d", label: "3D", hint: "Game render" },
  { id: "neon", label: "Neon", hint: "Night signs" },
  { id: "soft", label: "Soft glow", hint: "Lamp light" },
  { id: "glamour", label: "Glamour", hint: "Editorial" },
  { id: "vapor", label: "Vapor", hint: "Retro grid" },
  { id: "fantasy", label: "Fantasy", hint: "Dark magic" },
  { id: "pixel", label: "Pixel", hint: "16-bit" },
  { id: "comic", label: "Comic", hint: "Bold ink" },
  { id: "fashion", label: "Fashion", hint: "Lookbook" },
  { id: "noir", label: "Noir", hint: "Hard shadow" },
  { id: "pastel", label: "Pastel", hint: "Soft candy" },
];

export const POSES = [
  "standing confident",
  "looking back over the shoulder",
  "leaning on a railing",
  "sitting on a rooftop edge",
  "walking toward camera",
  "wind in hair, mid stride",
  "close portrait",
  "from below, hero crop",
];

export const HEATS = [
  { id: "clean", label: "Clean" },
  { id: "flirty", label: "Flirty" },
];

export const LIGHTS = [
  "golden hour",
  "neon night",
  "soft bedroom lamp",
  "overcast window",
  "moonlight",
  "rain reflections",
];

export const PLACES = [
  "city rooftop",
  "rainy street",
  "bedroom",
  "bathroom mirror",
  "forest at dusk",
  "train window",
  "pool at night",
  "apartment balcony",
];

export const LOOK_PROMPT: Record<string, string> = {
  photo: "photorealistic photograph of a real person, DSLR or phone camera, real skin pores, real hair, not illustration, not anime, not 3D render, not digital painting",
  cinematic: "cinematic film still, anamorphic bokeh, movie lighting, photoreal",
  anime: "modern high-quality anime illustration, sharp linework, detailed eyes",
  "90s-cel": "1990s hand-painted anime cel, visible paint, analog grain",
  manhwa: "full-color manhwa illustration, glossy fashion lighting",
  manga: "black and white manga panel energy with selective color",
  paint: "oil on canvas, visible brush",
  water: "watercolor on paper, soft blooms",
  ink: "graphic novel ink, dramatic blacks",
  "3d": "cinematic 3D render, film lighting",
  neon: "neon night, wet asphalt, magenta and teal, photoreal if photo look",
  soft: "soft glow portrait, warm practical lights",
  glamour: "high-fashion editorial photograph, skin sheen",
  vapor: "vaporwave, chrome and grid, dusk pink",
  fantasy: "dark fantasy illustration, rich cloak and light",
  pixel: "detailed pixel art, clean clusters",
  comic: "western comic colors, bold ink",
  fashion: "lookbook photograph, designer clothes",
  noir: "black and white noir photograph, hard shadows",
  pastel: "pastel palette, dreamy soft light",
};

export const HEAT_PROMPT: Record<string, string> = {
  clean: "tasteful, fully clothed, no nudity",
  flirty:
    "sexy but SFW, fitted clothes or stylish crop, confidence, no nudity, no bare breasts, no genitals, magazine-safe",
};

export const NEGATIVE =
  "no white bars, no black bars, no letterbox, no border, no empty banner, no frame, no polaroid, no UI, no watermark, no illustration if photoreal was requested, no anime if photoreal was requested, no sex act, no nudity, no underage";

export type PrintDraft = {
  want: string;
  styleId: string;
  styleSearch?: string;
  heat: string;
  phoneId: string;
  subject?: string;
  clothes?: string;
  lighting?: string;
  place?: string;
  overlay?: string;
  safeZone?: boolean;
  extra?: string;
  rawPrompt?: string;
  series?: string;
  pose?: string;
};

export function phoneById(id: string) {
  return PHONES.find((p) => p.id === id) || PHONES[0];
}

export function compilePrompt(d: PrintDraft) {
  if (d.rawPrompt?.trim()) return d.rawPrompt.trim();
  const look = LOOK_PROMPT[d.styleId] || LOOK_PROMPT.photo;
  const heat = HEAT_PROMPT[d.heat] || HEAT_PROMPT.clean;
  const bits = [
    "Full-bleed vertical 9:16 phone wallpaper, edge to edge, no bars.",
    "Subject fills the frame from mid-thigh to head.",
    look + ".",
    d.styleSearch?.trim() ? `Extra art direction: ${d.styleSearch.trim()}.` : "",
    d.series && d.series !== "Original" ? `Series vibe: ${d.series}.` : "",
    d.subject ? `Subject: ${d.subject}.` : "",
    d.pose ? `Pose: ${d.pose}.` : "",
    d.clothes ? `Wardrobe: ${d.clothes}.` : "",
    d.place ? `Setting: ${d.place}.` : "",
    d.lighting ? `Lighting: ${d.lighting}.` : "",
    d.want?.trim() ? `Scene: ${d.want.trim()}.` : "",
    heat + ".",
    `Avoid: ${NEGATIVE}.`,
    "Wallpaper-ready. Sharp. No padding. Adults only.",
  ];
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
