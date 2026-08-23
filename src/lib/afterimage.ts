export type Phone = {
  id: string;
  brand: string;
  name: string;
  w: number;
  h: number;
  aspect: string;
};

export const PHONES: Phone[] = [
  { id: "iphone-16-pro-max", brand: "iPhone", name: "16 Pro Max", w: 1320, h: 2868, aspect: "9:16" },
  { id: "iphone-16-pro", brand: "iPhone", name: "16 Pro", w: 1206, h: 2622, aspect: "9:16" },
  { id: "iphone-16-plus", brand: "iPhone", name: "16 Plus", w: 1290, h: 2796, aspect: "9:16" },
  { id: "iphone-16", brand: "iPhone", name: "16", w: 1179, h: 2556, aspect: "9:16" },
  { id: "iphone-15-pro-max", brand: "iPhone", name: "15 Pro Max", w: 1290, h: 2796, aspect: "9:16" },
  { id: "iphone-15", brand: "iPhone", name: "15 / 14", w: 1179, h: 2556, aspect: "9:16" },
  { id: "iphone-13", brand: "iPhone", name: "13 / 12", w: 1170, h: 2532, aspect: "9:16" },
  { id: "iphone-se", brand: "iPhone", name: "SE", w: 750, h: 1334, aspect: "9:16" },
  { id: "pixel-9-pro-xl", brand: "Pixel", name: "9 Pro XL", w: 1344, h: 2992, aspect: "9:16" },
  { id: "pixel-9-pro", brand: "Pixel", name: "9 Pro", w: 1280, h: 2856, aspect: "9:16" },
  { id: "pixel-9", brand: "Pixel", name: "9", w: 1080, h: 2424, aspect: "9:16" },
  { id: "pixel-8-pro", brand: "Pixel", name: "8 Pro", w: 1344, h: 2992, aspect: "9:16" },
  { id: "pixel-8", brand: "Pixel", name: "8 / 8a", w: 1080, h: 2400, aspect: "9:16" },
  { id: "pixel-7", brand: "Pixel", name: "7 / 7a", w: 1080, h: 2400, aspect: "9:16" },
  { id: "galaxy-s25-ultra", brand: "Galaxy", name: "S25 Ultra", w: 1440, h: 3120, aspect: "9:16" },
  { id: "galaxy-s25", brand: "Galaxy", name: "S25 / S24", w: 1440, h: 3120, aspect: "9:16" },
  { id: "galaxy-s23", brand: "Galaxy", name: "S23 / S22", w: 1080, h: 2340, aspect: "9:16" },
  { id: "galaxy-zflip", brand: "Galaxy", name: "Z Flip", w: 1080, h: 2640, aspect: "9:16" },
  { id: "galaxy-a", brand: "Galaxy", name: "A series", w: 1080, h: 2400, aspect: "9:16" },
  { id: "oneplus-13", brand: "OnePlus", name: "13 / 12", w: 1440, h: 3168, aspect: "9:16" },
  { id: "xiaomi-14", brand: "Xiaomi", name: "14 / 13", w: 1440, h: 3200, aspect: "9:16" },
  { id: "nothing-2", brand: "Nothing", name: "Phone (2)", w: 1080, h: 2412, aspect: "9:16" },
  { id: "moto-razr", brand: "Motorola", name: "Razr / Edge", w: 1080, h: 2400, aspect: "9:16" },
  { id: "tall", brand: "Other", name: "Tall 20:9", w: 1080, h: 2400, aspect: "9:16" },
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
  topless:
    "fine-art adult figure study, tasteful topless, bare chest treated like a gallery portrait or painted nude, sensual lighting, elegant pose, not a porn set",
};

export const NEGATIVE =
  "no sex act, no intercourse, no genitals in focus, no porn studio, no cam-site look, no underage, no child, no loli, no school uniform fetish, no watermark, no UI chrome";

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
    "Vertical phone wallpaper, tall lock-screen and home-screen crop,",
    `fit a ${phone.brand} ${phone.name} (${phone.w}x${phone.h}),`,
    d.safeZone ? "keep the top fifth clear for a clock," : "",
    d.styleSearch ? `in the visual language of ${d.styleSearch},` : look + ",",
    d.subject ? `subject: ${d.subject},` : "",
    d.heat === "topless" && !d.clothes ? "wardrobe: none on top, implied or painted nude torso," : d.clothes ? `wardrobe: ${d.clothes},` : "",
    d.place ? `setting: ${d.place},` : "",
    d.lighting ? `lighting: ${d.lighting},` : "",
    d.want?.trim() ? d.want.trim() + "," : "a striking single subject,",
    heat + ",",
    `avoid: ${NEGATIVE},`,
    d.overlay?.trim() ? `optional small tasteful text reading \"${d.overlay.trim()}\" integrated in the art,` : "no watermark,",
    d.extra || "",
    "adults only, wallpaper-ready, rich color, sharp",
  ];
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
