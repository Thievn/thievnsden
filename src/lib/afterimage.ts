export type Phone = {
  id: string;
  brand: string;
  name: string;
  w: number;
  h: number;
  aspect: string;
};

export const PHONES: Phone[] = [
  { id: "iphone-16-pro-max", brand: "iPhone", name: "16 Pro Max", w: 1320, h: 2868, aspect: "9:19.5" },
  { id: "iphone-16-pro", brand: "iPhone", name: "16 Pro", w: 1206, h: 2622, aspect: "9:19.5" },
  { id: "iphone-16", brand: "iPhone", name: "16", w: 1179, h: 2556, aspect: "9:19.5" },
  { id: "iphone-15", brand: "iPhone", name: "15 / 14", w: 1179, h: 2556, aspect: "9:19.5" },
  { id: "pixel-9-pro", brand: "Pixel", name: "9 Pro / XL", w: 1280, h: 2856, aspect: "9:20" },
  { id: "pixel-8", brand: "Pixel", name: "8 / 8a", w: 1080, h: 2400, aspect: "9:20" },
  { id: "galaxy-s25", brand: "Galaxy", name: "S25 / S24", w: 1440, h: 3120, aspect: "9:19.5" },
  { id: "galaxy-a", brand: "Galaxy", name: "A series", w: 1080, h: 2400, aspect: "9:20" },
  { id: "tall", brand: "Other", name: "Tall phone", w: 1080, h: 2400, aspect: "9:20" },
  { id: "classic", brand: "Other", name: "Classic 9:16", w: 1080, h: 1920, aspect: "9:16" },
];

export const LOOKS = [
  { id: "photo", label: "Photo", hint: "Looks like a real camera" },
  { id: "anime", label: "Anime", hint: "Clean modern animation" },
  { id: "90s-cel", label: "90s cel", hint: "Old-school TV paint" },
  { id: "manhwa", label: "Manhwa", hint: "Webtoon gloss" },
  { id: "paint", label: "Paint", hint: "Oil / ink on canvas" },
  { id: "3d", label: "3D", hint: "Game-render sheen" },
  { id: "neon", label: "Neon night", hint: "Wet streets, signs" },
  { id: "soft", label: "Soft glow", hint: "Bedroom lamp warmth" },
  { id: "ink", label: "Ink", hint: "Graphic novel black" },
  { id: "glamour", label: "Glamour", hint: "Magazine heat" },
];

export const HEATS = [
  { id: "clean", label: "Clean" },
  { id: "flirty", label: "Flirty" },
  { id: "topless", label: "Topless" },
];

export const LIGHTS = [
  "golden hour",
  "neon night",
  "soft bedroom lamp",
  "overcast window",
  "harsh flash",
  "moonlight",
  "club strobe",
  "rain reflections",
];

export const PLACES = [
  "city rooftop",
  "rainy street",
  "bedroom",
  "bathroom mirror",
  "hotel hallway",
  "forest at dusk",
  "train window",
  "empty diner",
  "pool at night",
  "apartment balcony",
];

export const LOOK_PROMPT: Record<string, string> = {
  photo: "photorealistic photograph, real skin texture, shot on a phone, natural imperfections",
  anime: "modern high-quality anime illustration, sharp linework, cinematic lighting, detailed eyes",
  "90s-cel": "1990s hand-painted anime cel look, visible paint edges, warm analog grain",
  manhwa: "full-color manhwa / webtoon illustration, glossy lighting, fashionable",
  paint: "painterly oil and ink, visible brush, rich color",
  "3d": "cinematic 3D render, subsurface skin, film lighting, not plastic",
  neon: "neon-soaked night photography, wet asphalt, magenta and teal lights",
  soft: "soft glow portrait, warm practical lights, gentle bloom",
  ink: "high-contrast graphic novel ink, limited palette, dramatic blacks",
  glamour: "high-fashion glamour still, skin sheen, editorial crop",
};

export const HEAT_PROMPT: Record<string, string> = {
  clean: "tasteful, fully clothed, no nudity",
  flirty: "suggestive and sexy, lingerie or wet clothes ok, adult, not explicit sex",
  topless: "adult topless allowed, bare chest or implied nude, sensual, not pornographic sex act, not a studio porn set",
};

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
};

export function phoneById(id: string) {
  return PHONES.find((p) => p.id === id) || PHONES[0];
}

export function compilePrompt(d: PrintDraft) {
  if (d.rawPrompt?.trim()) return d.rawPrompt.trim();
  const look = LOOK_PROMPT[d.styleId] || LOOK_PROMPT.photo;
  const heat = HEAT_PROMPT[d.heat] || HEAT_PROMPT.flirty;
  const phone = phoneById(d.phoneId);
  const bits = [
    "Vertical phone wallpaper composition,",
    `aspect roughly ${phone.aspect}, subject fits a tall lock screen,`,
    d.safeZone ? "keep the top fifth and center-top clear of faces for a clock overlay," : "",
    d.styleSearch ? `in the visual language of ${d.styleSearch},` : look + ",",
    d.subject ? `subject: ${d.subject},` : "",
    d.clothes ? `wardrobe: ${d.clothes},` : "",
    d.place ? `setting: ${d.place},` : "",
    d.lighting ? `lighting: ${d.lighting},` : "",
    d.want?.trim() ? d.want.trim() + "," : "a striking single subject,",
    heat + ",",
    d.overlay?.trim() ? `optional small tasteful text reading \"${d.overlay.trim()}\" integrated in the art,` : "no watermark,",
    d.extra || "",
    "adults only, no minors, wallpaper-ready, rich color, sharp, no UI chrome, no extra captions",
  ];
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
