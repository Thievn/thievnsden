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

export const SERIES = [
  "One Piece",
  "Naruto",
  "Bleach",
  "Demon Slayer",
  "Jujutsu Kaisen",
  "Chainsaw Man",
  "Spy x Family",
  "Frieren",
  "Solo Leveling",
  "Original",
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
  photo: "photorealistic photograph, real skin, phone camera",
  cinematic: "cinematic film still, anamorphic bokeh, movie lighting",
  anime: "modern high-quality anime illustration, sharp linework, detailed eyes",
  "90s-cel": "1990s hand-painted anime cel, visible paint, analog grain",
  manhwa: "full-color manhwa illustration, glossy fashion lighting",
  manga: "black and white manga panel energy with selective color",
  paint: "oil on canvas, visible brush",
  water: "watercolor on paper, soft blooms",
  ink: "graphic novel ink, dramatic blacks",
  "3d": "cinematic 3D render, film lighting",
  neon: "neon night, wet asphalt, magenta and teal",
  soft: "soft glow portrait, warm practical lights",
  glamour: "high-fashion editorial, skin sheen",
  vapor: "vaporwave, chrome and grid, dusk pink",
  fantasy: "dark fantasy illustration, rich cloak and light",
  pixel: "detailed pixel art, clean clusters",
  comic: "western comic colors, bold ink",
  fashion: "lookbook crop, designer clothes",
  noir: "black and white noir, hard shadows",
  pastel: "pastel palette, dreamy soft light",
};

export const HEAT_PROMPT: Record<string, string> = {
  clean: "tasteful, fully clothed, no nudity",
  flirty:
    "sexy but SFW, fitted clothes or stylish crop, confidence, no nudity, no bare breasts, no genitals, magazine-safe",
};

export const NEGATIVE =
  "no empty banner at the top, no letterbox, no black bar, no huge empty sky taking the frame, no sex act, no nudity, no topless, no genitals, no porn, no underage, no watermark, no UI chrome";

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
    "Full-bleed vertical 9:16 phone wallpaper.",
    "The subject fills most of the frame from mid-thigh or waist to head.",
    "No empty header, no blank bar, no huge unused sky.",
    d.styleSearch ? `Visual language of ${d.styleSearch}.` : look + ".",
    d.series && d.series !== "Original" ? `Inspired by ${d.series} character design, original enough to stand alone.` : "",
    d.subject ? `Subject: ${d.subject}.` : "",
    d.pose ? `Pose: ${d.pose}.` : "",
    d.clothes ? `Wardrobe: ${d.clothes}.` : "",
    d.place ? `Setting: ${d.place}.` : "",
    d.lighting ? `Lighting: ${d.lighting}.` : "",
    d.want?.trim() ? d.want.trim() + "." : "A striking single subject.",
    heat + ".",
    `Avoid: ${NEGATIVE}.`,
    d.overlay?.trim() ? `Tiny integrated text: ${d.overlay.trim()}.` : "No watermark.",
    d.extra || "",
    "Adults only as subjects. Wallpaper-ready. Sharp. Rich color.",
  ];
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
