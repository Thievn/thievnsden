export type Phone = {
  id: string;
  brand: string;
  name: string;
  w: number;
  h: number;
  aspect: string;
};

export type Opt = { id: string; label: string; prompt: string };

export const PHONES: Phone[] = [
  { id: "classic", brand: "Size", name: "9:16", w: 1080, h: 1920, aspect: "9:16" },
  { id: "tall", brand: "Size", name: "20:9", w: 1080, h: 2400, aspect: "9:16" },
  { id: "iphone-16", brand: "Size", name: "19.5:9", w: 1179, h: 2556, aspect: "9:16" },
];

const o = (id: string, label: string, prompt = label): Opt => ({ id, label, prompt });

export const LOOKS: Opt[] = [
  o("photo", "Photo", "photorealistic photograph of a real adult, DSLR, real skin pores, real hair, not illustration, not anime, not 3D"),
  o("cinematic", "Film", "cinematic film still, anamorphic bokeh, photoreal"),
  o("anime", "Anime", "modern high-quality anime illustration, sharp linework"),
  o("90s-cel", "90s cel", "1990s hand-painted anime cel"),
  o("manhwa", "Manhwa", "full-color manhwa illustration"),
  o("manga", "Manga", "manga ink with selective color"),
  o("paint", "Oil", "oil on canvas"),
  o("water", "Watercolor", "watercolor on paper"),
  o("ink", "Ink", "graphic novel ink"),
  o("3d", "3D", "cinematic 3D render"),
  o("glamour", "Glamour", "high-fashion editorial photograph"),
  o("fantasy", "Fantasy art", "dark fantasy illustration, magic light, not a cyber city unless asked"),
  o("fashion", "Fashion", "lookbook photograph"),
  o("noir", "Noir", "black and white noir photograph"),
  o("pastel", "Pastel", "pastel dreamy light"),
  o("pixel", "Pixel", "detailed pixel art"),
  o("comic", "Comic", "western comic colors"),
  o("vapor", "Vapor", "vaporwave chrome dusk"),
  o("neon", "Neon photo", "photoreal neon night only if the world is cyber"),
  o("soft", "Soft glow", "soft practical lamp light photograph"),
];

export const WHOS = [
  o("woman", "Woman", "adult woman"),
  o("man", "Man", "adult man"),
  o("androgynous", "Androgynous", "androgynous adult"),
  o("couple", "Couple", "two adults"),
];

export const AGES = [
  o("18-20", "18–20", "looks 18 to 20"),
  o("21-24", "21–24", "looks early 20s"),
  o("25-29", "25–29", "looks mid to late 20s"),
  o("30s", "30s", "looks thirties"),
  o("40s", "40s", "looks forties"),
];

export const ETHNICITIES = [
  o("unspecified", "Unspecified", ""),
  o("white", "White / European", "European features"),
  o("black", "Black / African", "Black features"),
  o("east-asian", "East Asian", "East Asian features"),
  o("south-asian", "South Asian", "South Asian features"),
  o("latina", "Latina / Latino", "Latine features"),
  o("middle-eastern", "Middle Eastern", "Middle Eastern features"),
  o("se-asian", "Southeast Asian", "Southeast Asian features"),
  o("pacific", "Pacific Islander", "Pacific Islander features"),
  o("mixed", "Mixed", "mixed features"),
];

export const BODIES = [
  o("slim", "Slim", "slim build"),
  o("athletic", "Athletic", "athletic build"),
  o("curvy", "Curvy", "curvy build"),
  o("soft", "Soft", "soft build"),
  o("tall-narrow", "Tall + narrow", "tall narrow frame"),
];

export const HEIGHTS = [
  o("short", "Short", "short stature"),
  o("average", "Average", "average height"),
  o("tall", "Tall", "tall stature"),
];

export const HAIRS = [
  o("red-pigtails", "Red pigtails", "red hair in pigtails"),
  o("black-long", "Long black", "long black hair"),
  o("blonde-waves", "Blonde waves", "wavy blonde hair"),
  o("brown-bun", "Brown bun", "brown hair in a bun"),
  o("white-straight", "White / silver", "straight silver-white hair"),
  o("pink", "Pink", "pink hair"),
  o("undercut", "Undercut", "undercut"),
  o("wet", "Wet", "wet hair"),
  o("short-crop", "Short crop", "short cropped hair"),
];

export const EYES = [
  o("brown", "Brown", "brown eyes"),
  o("green", "Green", "green eyes"),
  o("blue", "Blue", "blue eyes"),
  o("hazel", "Hazel", "hazel eyes"),
  o("gold", "Gold", "gold eyes"),
];

export const WARDROBES = [
  o("street", "Street", "stylish street clothes"),
  o("rogue", "Rogue leathers", "rogue leather armor, belts, fitted, SFW"),
  o("gown", "Gown", "elegant gown"),
  o("armor", "Armor", "fantasy plate or mail"),
  o("coat", "Long coat", "long coat"),
  o("uniform", "Uniform", "sharp uniform"),
  o("lingerie-sfw", "Lingerie (SFW)", "stylish lingerie, covered, magazine-safe"),
  o("hoodie", "Hoodie", "hoodie and pants"),
  o("dress", "Short dress", "short dress, SFW"),
];

export const POSES = [
  o("walk-in", "Walk toward camera", "walking toward camera"),
  o("look-back", "Look back", "looking back over the shoulder"),
  o("stand", "Stand confident", "standing confident"),
  o("lean", "Lean", "leaning on something in the scene"),
  o("sit", "Sit", "sitting in the scene"),
  o("portrait", "Close portrait", "tight portrait, face and shoulders"),
  o("hero", "Hero low", "from below, hero crop"),
  o("mid-stride", "Mid stride", "mid stride, wind in hair"),
];

export const WORLDS = [
  o("modern", "Modern", "present-day real world, no cyber neon unless asked"),
  o("fantasy", "High fantasy", "high fantasy world, stone, trees, magic, no cyber city"),
  o("gothic", "Gothic", "gothic stone and candle smoke"),
  o("cyber", "Cyber", "cyber city neon only because this world was chosen"),
  o("western", "Western", "dust, wood, desert town"),
  o("sea", "Sea", "coast, ship, salt air"),
  o("desert", "Desert", "dunes and heat haze"),
];

export const PLACES = [
  o("forest", "Forest", "deep forest"),
  o("castle", "Castle hall", "castle hall"),
  o("tavern", "Tavern", "tavern interior"),
  o("cliff", "Cliff", "cliff at dusk"),
  o("bedroom", "Bedroom", "bedroom interior"),
  o("alley", "Alley", "narrow alley"),
  o("street", "City street", "ordinary city street"),
  o("rooftop", "Rooftop", "city rooftop"),
  o("throne", "Throne room", "throne room"),
  o("ruins", "Ruins", "ancient ruins"),
];

export const LIGHTS = [
  o("golden", "Golden hour", "golden hour sun"),
  o("moon", "Moonlight", "moonlight"),
  o("overcast", "Overcast", "soft overcast light"),
  o("candle", "Candle", "candle and firelight"),
  o("lamp", "Lamp", "warm indoor lamp"),
  o("neon", "Neon", "neon signs, only if the world is cyber"),
  o("storm", "Storm", "storm light and rain"),
];

export const HEATS: Opt[] = [
  o("clean", "Clean", "tasteful, fully clothed, no nudity"),
  o("flirty", "Flirty", "sexy but SFW, fitted clothes, confidence, no nudity"),
  o("funny", "Funny", "playful, slightly ridiculous energy, still pretty, no meme text"),
  o("fierce", "Fierce", "dangerous calm, sharp eyes"),
  o("soft", "Soft", "gentle, warm, intimate but SFW"),
];

export const LOOK_PROMPT = Object.fromEntries(LOOKS.map((x) => [x.id, x.prompt]));
export const HEAT_PROMPT = Object.fromEntries(HEATS.map((x) => [x.id, x.prompt]));

export const NEGATIVE =
  "no white bars, no black bars, no letterbox, no border, no frame, no UI, no watermark, no underage, no nudity, no sex act, do not add a cyber rooftop unless the world or place is cyber or rooftop";

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
  extra?: string;
  rawPrompt?: string;
  series?: string;
  pose?: string;
  who?: string;
  age?: string;
  ethnicity?: string;
  body?: string;
  height?: string;
  hair?: string;
  eyes?: string;
  world?: string;
};

function frag(list: Opt[], id?: string) {
  if (!id) return "";
  return list.find((x) => x.id === id)?.prompt || "";
}

export function phoneById(id: string) {
  return PHONES.find((p) => p.id === id) || PHONES[0];
}

export function compilePrompt(d: PrintDraft) {
  if (d.rawPrompt?.trim()) return d.rawPrompt.trim();
  const look = LOOK_PROMPT[d.styleId] || LOOK_PROMPT.photo;
  const heat = HEAT_PROMPT[d.heat] || "";
  const person = [
    frag(WHOS, d.who),
    frag(AGES, d.age),
    frag(ETHNICITIES, d.ethnicity),
    frag(BODIES, d.body),
    frag(HEIGHTS, d.height),
    frag(HAIRS, d.hair),
    frag(EYES, d.eyes),
    d.subject?.trim() || "",
  ].filter(Boolean).join(", ");
  const bits = [
    "Full-bleed vertical 9:16 phone wallpaper, edge to edge, no bars, subject fills most of the frame.",
    look + ".",
    person ? `Subject: ${person}.` : "",
    frag(WARDROBES, d.clothes),
    frag(POSES, d.pose),
    frag(WORLDS, d.world),
    frag(PLACES, d.place),
    frag(LIGHTS, d.lighting),
    d.series ? `Series vibe: ${d.series}.` : "",
    d.want?.trim() ? `Action / extras: ${d.want.trim()}.` : "",
    d.styleSearch?.trim() ? `Art note only: ${d.styleSearch.trim()}.` : "",
    heat,
    d.world !== "cyber" && d.place !== "rooftop"
      ? "Do not default to a neon rooftop or cyber city."
      : "",
    `Avoid: ${NEGATIVE}.`,
    "Adults only. Wallpaper-ready.",
  ];
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
