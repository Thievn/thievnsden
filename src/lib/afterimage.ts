export type Phone = {
  id: string;
  brand: string;
  name: string;
  w: number;
  h: number;
  aspect: string;
};

export type Opt = {
  id: string;
  label: string;
  prompt: string;
  group?: string;
  emoji?: string;
  swatch?: string;
  worlds?: string[];
  wash?: string;
};

export const PHONES: Phone[] = [
  { id: "classic", brand: "Lock screen", name: "9:16", w: 1080, h: 1920, aspect: "9:16" },
  { id: "tall", brand: "Tall phone", name: "20:9", w: 1080, h: 2400, aspect: "9:16" },
  { id: "iphone-16", brand: "Modern phone", name: "19.5:9", w: 1179, h: 2556, aspect: "9:16" },
];

type Meta = Pick<Opt, "group" | "emoji" | "swatch" | "worlds" | "wash">;

const o = (id: string, label: string, prompt = label, meta: Meta = {}): Opt => ({
  id,
  label,
  prompt,
  ...meta,
});

export const LOOKS: Opt[] = [
  o("photo", "Photo", "photorealistic photograph of a real adult, DSLR, real skin pores, real hair, not illustration, not anime, not 3D", { group: "Camera", emoji: "📷", wash: "from-neutral-700/40 to-neutral-950" }),
  o("cinematic", "Film still", "cinematic film still, anamorphic bokeh, photoreal", { group: "Camera", emoji: "🎬", wash: "from-amber-800/35 to-neutral-950" }),
  o("glamour", "Glamour", "high-fashion editorial photograph", { group: "Camera", emoji: "✨", wash: "from-rose-800/40 to-neutral-950" }),
  o("fashion", "Lookbook", "lookbook photograph, fashion lighting", { group: "Camera", emoji: "🖤", wash: "from-zinc-600/30 to-neutral-950" }),
  o("noir", "Noir", "black and white noir photograph, hard shadows", { group: "Camera", emoji: "🕯️", wash: "from-zinc-500/25 to-black" }),
  o("soft", "Soft lamp", "soft practical lamp light photograph", { group: "Camera", emoji: "💡", wash: "from-orange-700/30 to-neutral-950" }),
  o("neon", "Neon night", "photoreal neon night only if the world is cyber", { group: "Camera", emoji: "🌃", wash: "from-fuchsia-700/40 to-cyan-950" }),
  o("polaroid", "Polaroid", "instant film polaroid photograph, slight fade, real paper grain", { group: "Camera", emoji: "🖼️", wash: "from-stone-500/30 to-neutral-950" }),
  o("analog", "35mm", "35mm film photograph, kodak portra, natural grain", { group: "Camera", emoji: "🎞️", wash: "from-yellow-800/25 to-neutral-950" }),
  o("street-photo", "Street", "candid street photograph, available light", { group: "Camera", emoji: "🚶", wash: "from-slate-600/30 to-neutral-950" }),
  o("anime", "Anime", "modern high-quality anime illustration, sharp linework", { group: "Drawn", emoji: "🌸", wash: "from-pink-600/35 to-violet-950" }),
  o("90s-cel", "90s cel", "1990s hand-painted anime cel, film grain, painted backgrounds", { group: "Drawn", emoji: "📼", wash: "from-sky-700/30 to-rose-950" }),
  o("manhwa", "Manhwa", "full-color manhwa illustration, glossy hair, dramatic eyes", { group: "Drawn", emoji: "📖", wash: "from-violet-700/35 to-neutral-950" }),
  o("manga", "Manga", "manga ink with selective color, screentone", { group: "Drawn", emoji: "✒️", wash: "from-neutral-400/20 to-neutral-950" }),
  o("comic", "Comic", "western comic colors, bold ink, cel shading", { group: "Drawn", emoji: "💥", wash: "from-red-700/35 to-yellow-950" }),
  o("paint", "Oil", "oil on canvas, visible brushwork", { group: "Paint", emoji: "🎨", wash: "from-amber-700/40 to-red-950" }),
  o("water", "Watercolor", "watercolor on paper, soft blooms", { group: "Paint", emoji: "💧", wash: "from-sky-600/30 to-neutral-950" }),
  o("ink", "Ink wash", "graphic novel ink, heavy blacks", { group: "Paint", emoji: "🖋️", wash: "from-neutral-600/25 to-black" }),
  o("pastel", "Pastel", "pastel dreamy light, chalk texture", { group: "Paint", emoji: "🧁", wash: "from-pink-400/25 to-sky-950" }),
  o("charcoal", "Charcoal", "charcoal drawing, smudged graphite, high contrast", { group: "Paint", emoji: "🪨", wash: "from-stone-600/30 to-black" }),
  o("3d", "3D render", "cinematic 3D render, subsurface skin, studio lighting", { group: "Digital", emoji: "💎", wash: "from-cyan-700/30 to-neutral-950" }),
  o("fantasy", "Fantasy art", "dark fantasy illustration, magic light, not a cyber city unless asked", { group: "Digital", emoji: "🗡️", wash: "from-purple-800/40 to-emerald-950" }),
  o("vapor", "Vapor", "vaporwave chrome dusk, magenta and teal", { group: "Digital", emoji: "🌴", wash: "from-fuchsia-600/40 to-cyan-900" }),
  o("pixel", "Pixel", "detailed pixel art, clean clusters, limited palette", { group: "Digital", emoji: "👾", wash: "from-lime-700/30 to-indigo-950" }),
  o("synth", "Synthwave", "synthwave illustration, grid horizon, hot pink sun", { group: "Digital", emoji: "🌅", wash: "from-pink-600/40 to-indigo-950" }),
];

export const WHOS = [
  o("woman", "Woman", "adult woman", { emoji: "♀" }),
  o("man", "Man", "adult man", { emoji: "♂" }),
  o("androgynous", "Androgynous", "androgynous adult", { emoji: "◇" }),
  o("couple", "Couple", "two adults", { emoji: "♡" }),
];

export const AGES = [
  o("18-20", "18–20", "looks 18 to 20"),
  o("21-24", "21–24", "looks early 20s"),
  o("25-29", "25–29", "looks mid to late 20s"),
  o("30s", "30s", "looks thirties"),
  o("40s", "40s", "looks forties"),
];

export const ETHNICITIES = [
  o("white", "European", "European features"),
  o("black", "Black", "Black features"),
  o("east-asian", "East Asian", "East Asian features"),
  o("south-asian", "South Asian", "South Asian features"),
  o("latina", "Latine", "Latine features"),
  o("middle-eastern", "Middle Eastern", "Middle Eastern features"),
  o("se-asian", "Southeast Asian", "Southeast Asian features"),
  o("pacific", "Pacific", "Pacific Islander features"),
  o("mixed", "Mixed", "mixed features"),
];

export const BODIES = [
  o("slim", "Slim", "slim build", { emoji: "│" }),
  o("athletic", "Athletic", "athletic build", { emoji: "⌁" }),
  o("curvy", "Curvy", "curvy build", { emoji: "S" }),
  o("soft", "Soft", "soft build", { emoji: "○" }),
  o("tall-narrow", "Tall narrow", "tall narrow frame", { emoji: "↑" }),
  o("muscular", "Muscular", "muscular build", { emoji: "▣" }),
  o("hourglass", "Hourglass", "hourglass figure", { emoji: "⌛" }),
  o("stocky", "Stocky", "compact stocky build", { emoji: "■" }),
];

export const HEIGHTS = [
  o("short", "Petite", "short stature"),
  o("average", "Average", "average height"),
  o("tall", "Tall", "tall stature"),
];

/** Legacy combined hair options, kept so old print jobs still compile. */
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

export const HAIR_COLORS = [
  o("black", "Black", "black hair", { group: "Natural", swatch: "#161616" }),
  o("dark-brown", "Dark brown", "dark brown hair", { group: "Natural", swatch: "#3b2416" }),
  o("brown", "Brown", "brown hair", { group: "Natural", swatch: "#6b3f24" }),
  o("auburn", "Auburn", "auburn hair", { group: "Natural", swatch: "#8a3a22" }),
  o("red", "Red", "red hair", { group: "Natural", swatch: "#c43c22" }),
  o("blonde", "Blonde", "blonde hair", { group: "Natural", swatch: "#e2c07a" }),
  o("platinum", "Platinum", "platinum blonde hair", { group: "Natural", swatch: "#f3ead2" }),
  o("white", "White", "white hair", { group: "Natural", swatch: "#f6f6f6" }),
  o("silver", "Silver", "silver hair", { group: "Natural", swatch: "#c5c9d1" }),
  o("pink", "Pink", "pink hair", { group: "Dyed", swatch: "#f472b6" }),
  o("hot-pink", "Hot pink", "hot pink hair", { group: "Dyed", swatch: "#fb2d8a" }),
  o("lavender", "Lavender", "lavender hair", { group: "Dyed", swatch: "#c4b5fd" }),
  o("purple", "Purple", "purple hair", { group: "Dyed", swatch: "#7c3aed" }),
  o("blue", "Blue", "blue hair", { group: "Dyed", swatch: "#3b82f6" }),
  o("teal", "Teal", "teal hair", { group: "Dyed", swatch: "#14b8a6" }),
  o("green", "Green", "green hair", { group: "Dyed", swatch: "#22c55e" }),
  o("two-tone", "Two-tone", "two-tone hair, dark roots with a vivid dye", { group: "Dyed", swatch: "#a855f7" }),
];

export const HAIR_STYLES = [
  o("long-straight", "Long straight", "long straight hair", { group: "Long", emoji: "〰️" }),
  o("long-waves", "Long waves", "long wavy hair", { group: "Long", emoji: "〰" }),
  o("curly", "Curly", "voluminous curly hair", { group: "Long", emoji: "༄" }),
  o("braids", "Braids", "braided hair", { group: "Long", emoji: "🪢" }),
  o("ponytail", "Ponytail", "high ponytail", { group: "Up", emoji: "↑" }),
  o("pigtails", "Pigtails", "hair in pigtails", { group: "Up", emoji: "🎀" }),
  o("twin-tails", "Twin tails", "twin tails", { group: "Up", emoji: "◆" }),
  o("space-buns", "Space buns", "space buns", { group: "Up", emoji: "◎" }),
  o("bun", "Bun", "hair in a bun", { group: "Up", emoji: "◉" }),
  o("hime", "Hime cut", "hime cut with blunt bangs", { group: "Cut", emoji: "⊓" }),
  o("bob", "Bob", "bob cut", { group: "Cut", emoji: "▭" }),
  o("wolf-cut", "Wolf cut", "wolf cut", { group: "Cut", emoji: "🐺" }),
  o("pixie", "Pixie", "pixie cut", { group: "Cut", emoji: "✦" }),
  o("short-crop", "Short crop", "short cropped hair", { group: "Cut", emoji: "▬" }),
  o("undercut", "Undercut", "undercut", { group: "Cut", emoji: "◣" }),
  o("messy", "Messy", "artfully messy hair", { group: "Texture", emoji: "∿" }),
  o("wet", "Wet", "wet hair, rain-slicked", { group: "Texture", emoji: "💧" }),
  o("wind", "Windblown", "windblown hair", { group: "Texture", emoji: "🌬️" }),
];

export const EYES = [
  o("brown", "Brown", "brown eyes", { swatch: "#6b3a1f" }),
  o("amber", "Amber", "amber eyes", { swatch: "#c47a2c" }),
  o("hazel", "Hazel", "hazel eyes", { swatch: "#8a7a3a" }),
  o("green", "Green", "green eyes", { swatch: "#3d8a4a" }),
  o("teal", "Teal", "teal eyes", { swatch: "#1f8a7a" }),
  o("blue", "Blue", "blue eyes", { swatch: "#3b82c8" }),
  o("grey", "Grey", "grey eyes", { swatch: "#8b93a0" }),
  o("gold", "Gold", "gold eyes", { swatch: "#d4af37" }),
  o("violet", "Violet", "violet eyes", { swatch: "#7c5cbf" }),
  o("red", "Crimson", "crimson eyes", { swatch: "#b91c1c" }),
  o("hetero", "Mismatched", "heterochromia, two different eye colors", { swatch: "#22d3ee" }),
];

export const MAKEUPS = [
  o("natural", "Natural", "natural makeup", { emoji: "🌿" }),
  o("glam", "Glam", "glam makeup, highlighted skin", { emoji: "✨" }),
  o("smoky", "Smoky", "smoky eye makeup", { emoji: "🌙" }),
  o("gothic", "Gothic", "gothic makeup, dark liner", { emoji: "🖤" }),
  o("colorful", "Color pop", "colorful editorial makeup", { emoji: "🌈" }),
  o("freckles", "Freckles", "visible freckles, light makeup", { emoji: "✦" }),
  o("none", "Bare", "bare face, no obvious makeup", { emoji: "○" }),
];

export const WARDROBES = [
  o("street", "Street", "stylish street clothes", { group: "Everyday", emoji: "🧢" }),
  o("hoodie", "Hoodie", "hoodie and pants", { group: "Everyday", emoji: "🧥" }),
  o("tee-jacket", "Tee + jacket", "fitted tee under an open jacket", { group: "Everyday", emoji: "👕" }),
  o("denim", "Denim", "denim jacket and jeans", { group: "Everyday", emoji: "👖" }),
  o("coat", "Long coat", "long coat", { group: "Everyday", emoji: "🧥" }),
  o("dress", "Short dress", "short dress, SFW", { group: "Dressed up", emoji: "👗" }),
  o("gown", "Gown", "elegant gown", { group: "Dressed up", emoji: "👑" }),
  o("suit", "Suit", "sharp tailored suit", { group: "Dressed up", emoji: "🕴️" }),
  o("uniform", "Uniform", "sharp uniform", { group: "Dressed up", emoji: "⭐" }),
  o("lookbook", "Runway", "high-fashion runway outfit", { group: "Dressed up", emoji: "📸" }),
  o("rogue", "Rogue leather", "rogue leather armor, belts, fitted, SFW", { group: "Story", emoji: "🗡️" }),
  o("armor", "Armor", "fantasy plate or mail", { group: "Story", emoji: "🛡️" }),
  o("mage", "Mage robes", "flowing mage robes with subtle embroidery", { group: "Story", emoji: "🔮" }),
  o("cloak", "Cloak", "travel cloak over practical clothes", { group: "Story", emoji: "🌫️" }),
  o("cyber-fit", "Cyber fit", "techwear, straps, dark nylon", { group: "Story", emoji: "⚙️" }),
  o("western-wear", "Western", "western wear, boots, dust", { group: "Story", emoji: "🤠" }),
  o("lingerie-sfw", "Lingerie", "stylish lingerie, covered, magazine-safe", { group: "Night", emoji: "💋" }),
  o("silk", "Silk set", "silk lounge set, SFW", { group: "Night", emoji: "🌙" }),
  o("raincoat", "Raincoat", "clear or dark raincoat over street clothes", { group: "Weather", emoji: "🌧️" }),
  o("knit", "Knit", "oversized knit sweater", { group: "Weather", emoji: "🧶" }),
];

export const ACCESSORIES = [
  o("glasses", "Glasses", "stylish glasses", { emoji: "👓" }),
  o("sunnies", "Sunglasses", "sunglasses perched or worn", { emoji: "🕶️" }),
  o("earrings", "Earrings", "statement earrings", { emoji: "💎" }),
  o("choker", "Choker", "thin choker", { emoji: "●" }),
  o("necklace", "Necklace", "necklace", { emoji: "📿" }),
  o("hat", "Hat", "hat that fits the scene", { emoji: "🎩" }),
  o("headphones", "Headphones", "over-ear headphones", { emoji: "🎧" }),
  o("sword", "Sword", "holding a sword", { emoji: "⚔️" }),
  o("daggers", "Daggers", "holding two daggers", { emoji: "🗡️" }),
  o("phone-prop", "Phone", "holding a phone, not covering the face", { emoji: "📱" }),
  o("umbrella", "Umbrella", "holding an umbrella", { emoji: "☂️" }),
];

export const POSES = [
  o("walk-in", "Walk in", "walking toward camera", { group: "Move", emoji: "🚶" }),
  o("mid-stride", "Mid stride", "mid stride, wind in hair", { group: "Move", emoji: "💨" }),
  o("look-back", "Look back", "looking back over the shoulder", { group: "Move", emoji: "↩" }),
  o("stand", "Stand tall", "standing confident", { group: "Stand", emoji: "🧍" }),
  o("lean", "Lean", "leaning on something in the scene", { group: "Stand", emoji: "╱" }),
  o("hands-pockets", "Pockets", "hands in pockets, relaxed stance", { group: "Stand", emoji: "🤚" }),
  o("arms-cross", "Arms crossed", "arms crossed, cool stare", { group: "Stand", emoji: "╳" }),
  o("sit", "Sit", "sitting in the scene", { group: "Rest", emoji: "🪑" }),
  o("crouch", "Crouch", "crouched, ready", { group: "Rest", emoji: "﹀" }),
  o("portrait", "Close-up", "tight portrait, face and shoulders", { group: "Frame", emoji: "🔲" }),
  o("hero", "Hero low", "from below, hero crop", { group: "Frame", emoji: "⌃" }),
  o("over-shoulder", "Over shoulder", "over-the-shoulder glance at camera", { group: "Frame", emoji: "↷" }),
];

export const EXPRESSIONS = [
  o("smirk", "Smirk", "subtle smirk", { emoji: "😏" }),
  o("smile", "Smile", "warm smile", { emoji: "😊" }),
  o("serious", "Serious", "serious, unreadable face", { emoji: "—" }),
  o("fierce", "Fierce", "fierce eyes, slight scowl", { emoji: "🔥" }),
  o("soft", "Soft", "soft, gentle expression", { emoji: "♡" }),
  o("bored", "Bored", "bored, unimpressed", { emoji: "…" }),
  o("playful", "Playful", "playful, about to laugh", { emoji: "✦" }),
  o("distant", "Distant", "looking slightly past the camera", { emoji: "☾" }),
];

export const WORLDS = [
  o("modern", "Now", "present-day real world, no cyber neon unless asked", { emoji: "🏙️", wash: "from-slate-700/40 to-neutral-950" }),
  o("fantasy", "Fantasy", "high fantasy world, stone, trees, magic, no cyber city", { emoji: "🏰", wash: "from-emerald-800/35 to-purple-950" }),
  o("gothic", "Gothic", "gothic stone and candle smoke", { emoji: "🦇", wash: "from-violet-950 to-neutral-950" }),
  o("cyber", "Cyber", "cyber city neon only because this world was chosen", { emoji: "💠", wash: "from-fuchsia-700/40 to-cyan-950" }),
  o("western", "Western", "dust, wood, desert town", { emoji: "🌵", wash: "from-amber-800/40 to-neutral-950" }),
  o("sea", "Sea", "coast, ship, salt air", { emoji: "🌊", wash: "from-sky-800/40 to-cyan-950" }),
  o("desert", "Desert", "dunes and heat haze", { emoji: "🏜️", wash: "from-orange-800/35 to-yellow-950" }),
  o("forest-world", "Wildwood", "deep old-growth wilderness, moss and mist", { emoji: "🌲", wash: "from-green-900/50 to-neutral-950" }),
  o("space", "Orbit", "spacecraft or orbital station interior, not a neon city", { emoji: "🛰️", wash: "from-indigo-800/40 to-black" }),
];

export const PLACES = [
  o("forest", "Forest", "deep forest", { group: "Wild", emoji: "🌲", worlds: ["fantasy", "forest-world", "gothic"] }),
  o("cliff", "Cliff", "cliff at dusk", { group: "Wild", emoji: "⛰️", worlds: ["fantasy", "sea", "forest-world", "modern"] }),
  o("ruins", "Ruins", "ancient ruins", { group: "Wild", emoji: "🏛️", worlds: ["fantasy", "desert", "gothic"] }),
  o("dunes", "Dunes", "sand dunes stretching away", { group: "Wild", emoji: "🏜️", worlds: ["desert", "western"] }),
  o("beach", "Beach", "shoreline, wet sand", { group: "Wild", emoji: "🏖️", worlds: ["sea", "modern"] }),
  o("castle", "Castle hall", "castle hall", { group: "Story", emoji: "🏰", worlds: ["fantasy", "gothic"] }),
  o("throne", "Throne", "throne room", { group: "Story", emoji: "👑", worlds: ["fantasy", "gothic"] }),
  o("tavern", "Tavern", "tavern interior", { group: "Story", emoji: "🍺", worlds: ["fantasy", "western", "gothic"] }),
  o("cathedral", "Cathedral", "gothic cathedral interior", { group: "Story", emoji: "⛪", worlds: ["gothic", "fantasy"] }),
  o("saloon", "Saloon", "western saloon", { group: "Story", emoji: "🥃", worlds: ["western"] }),
  o("ship", "Ship deck", "wooden ship deck at sea", { group: "Story", emoji: "⛵", worlds: ["sea"] }),
  o("bedroom", "Bedroom", "bedroom interior", { group: "Inside", emoji: "🛏️", worlds: ["modern", "gothic"] }),
  o("cafe", "Cafe", "moody cafe interior", { group: "Inside", emoji: "☕", worlds: ["modern"] }),
  o("penthouse", "Penthouse", "glass penthouse at night", { group: "Inside", emoji: "🪟", worlds: ["modern", "cyber"] }),
  o("train", "Night train", "night train window, city lights passing", { group: "Inside", emoji: "🚆", worlds: ["modern", "cyber"] }),
  o("street", "City street", "ordinary city street", { group: "City", emoji: "🛣️", worlds: ["modern"] }),
  o("alley", "Alley", "narrow alley", { group: "City", emoji: "🚪", worlds: ["modern", "cyber", "gothic"] }),
  o("rooftop", "Rooftop", "city rooftop", { group: "City", emoji: "🏙️", worlds: ["modern", "cyber"] }),
  o("arcade", "Arcade", "neon arcade interior", { group: "City", emoji: "🕹️", worlds: ["cyber", "modern"] }),
  o("dock", "Dock", "harbor dock at night", { group: "City", emoji: "⚓", worlds: ["sea", "modern", "cyber"] }),
];

export const LIGHTS = [
  o("golden", "Golden hour", "golden hour sun", { emoji: "🌅" }),
  o("noon", "Hard noon", "hard noon sunlight", { emoji: "☀️" }),
  o("overcast", "Overcast", "soft overcast light", { emoji: "☁️" }),
  o("moon", "Moonlight", "moonlight", { emoji: "🌙" }),
  o("candle", "Candle", "candle and firelight", { emoji: "🕯️" }),
  o("lamp", "Lamp", "warm indoor lamp", { emoji: "💡" }),
  o("neon", "Neon", "neon signs, only if the world is cyber", { emoji: "💜" }),
  o("storm", "Storm", "storm light and rain", { emoji: "⚡" }),
  o("rim", "Rim light", "strong rim light, dark background", { emoji: "◐" }),
  o("club", "Club", "colored club lighting, not a cyber city unless chosen", { emoji: "🪩" }),
];

export const WEATHERS = [
  o("clear", "Clear", "clear air", { emoji: "✨" }),
  o("rain", "Rain", "falling rain, wet surfaces", { emoji: "🌧️" }),
  o("storm", "Storm", "storm, wind, dramatic sky", { emoji: "⛈️" }),
  o("fog", "Fog", "fog and soft distance", { emoji: "🌫️" }),
  o("snow", "Snow", "falling snow", { emoji: "❄️" }),
  o("heat", "Heat haze", "heat haze, dry air", { emoji: "🌡️" }),
  o("petals", "Petals", "petals or leaves in the air", { emoji: "🌸" }),
];

export const CAMERAS = [
  o("portrait", "Portrait", "portrait framing, face and torso", { emoji: "👤" }),
  o("full", "Full body", "full body in frame, wallpaper crop", { emoji: "🧍" }),
  o("low", "Low angle", "low camera angle, imposing", { emoji: "⬆️" }),
  o("high", "High angle", "slight high angle", { emoji: "⬇️" }),
  o("side", "Profile", "three-quarter profile", { emoji: "◔" }),
  o("dutch", "Dutch tilt", "subtle dutch tilt", { emoji: "⋰" }),
];

export const VIBES = [
  o("romantic", "Romantic", "romantic atmosphere", { emoji: "💗" }),
  o("dangerous", "Dangerous", "dangerous calm in the air", { emoji: "☠️" }),
  o("lonely", "Lonely", "quiet lonely mood", { emoji: "🌒" }),
  o("luxe", "Luxe", "expensive, composed, luxurious", { emoji: "🥂" }),
  o("gritty", "Gritty", "gritty, lived-in, a little dirty", { emoji: "🧱" }),
  o("dreamy", "Dreamy", "dreamy, slightly unreal", { emoji: "🌀" }),
  o("cool", "Cool", "effortlessly cool, unbothered", { emoji: "🧊" }),
  o("mythic", "Mythic", "mythic, larger than life", { emoji: "⚡" }),
];

export const HEATS: Opt[] = [
  o("clean", "Clean", "tasteful, fully clothed, no nudity", { emoji: "🤍" }),
  o("flirty", "Flirty", "sexy but SFW, fitted clothes, confidence, no nudity", { emoji: "💋" }),
  o("funny", "Funny", "playful, slightly ridiculous energy, still pretty, no meme text", { emoji: "😏" }),
  o("fierce", "Fierce", "dangerous calm, sharp eyes", { emoji: "🔥" }),
  o("soft", "Soft", "gentle, warm, intimate but SFW", { emoji: "🌙" }),
];

export const LOOK_GROUPS = ["Camera", "Drawn", "Paint", "Digital"] as const;

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
  hairColor?: string;
  hairStyle?: string;
  eyes?: string;
  world?: string;
  expression?: string;
  accessory?: string;
  weather?: string;
  makeup?: string;
  camera?: string;
  vibe?: string;
};

export function pickOpt(list: Opt[], id?: string) {
  if (!id) return undefined;
  return list.find((x) => x.id === id);
}

export function frag(list: Opt[], id?: string) {
  if (!id) return "";
  return list.find((x) => x.id === id)?.prompt || "";
}

export function randomId(list: Opt[], allowEmpty = false) {
  if (!list.length) return "";
  if (allowEmpty && Math.random() < 0.18) return "";
  return list[Math.floor(Math.random() * list.length)].id;
}

export function placesForWorld(world?: string) {
  if (!world) return PLACES;
  const matched = PLACES.filter((p) => !p.worlds || p.worlds.includes(world));
  return matched.length ? matched : PLACES;
}

export function placeFitsWorld(placeId?: string, world?: string) {
  if (!placeId || !world) return true;
  const place = pickOpt(PLACES, placeId);
  if (!place?.worlds?.length) return true;
  return place.worlds.includes(world);
}

export function phoneById(id: string) {
  return PHONES.find((p) => p.id === id) || PHONES[0];
}

export function looksByGroup() {
  return LOOK_GROUPS.map((group) => ({
    group,
    items: LOOKS.filter((x) => x.group === group),
  })).filter((g) => g.items.length);
}

export function groupOpts(list: Opt[]) {
  const order: string[] = [];
  const map = new Map<string, Opt[]>();
  for (const item of list) {
    const key = item.group || "";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(item);
  }
  return order.map((group) => ({ group, items: map.get(group)! }));
}

function hairPrompt(d: PrintDraft) {
  const color = frag(HAIR_COLORS, d.hairColor);
  const style = frag(HAIR_STYLES, d.hairStyle);
  const joined = [color, style].filter(Boolean).join(", ");
  return joined || frag(HAIRS, d.hair);
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
    hairPrompt(d),
    frag(EYES, d.eyes),
    frag(MAKEUPS, d.makeup),
    d.subject?.trim() || "",
  ].filter(Boolean).join(", ");
  const bits = [
    "Full-bleed vertical 9:16 phone wallpaper, edge to edge, no bars, subject fills most of the frame.",
    look + ".",
    person ? `Subject: ${person}.` : "",
    frag(WARDROBES, d.clothes),
    frag(ACCESSORIES, d.accessory),
    frag(POSES, d.pose),
    frag(EXPRESSIONS, d.expression),
    frag(CAMERAS, d.camera),
    frag(WORLDS, d.world),
    frag(PLACES, d.place),
    frag(LIGHTS, d.lighting),
    frag(WEATHERS, d.weather),
    frag(VIBES, d.vibe),
    d.series ? `Series vibe: ${d.series}.` : "",
    d.want?.trim() ? `Action / extras: ${d.want.trim()}.` : "",
    d.extra?.trim() ? `Extra: ${d.extra.trim()}.` : "",
    d.overlay?.trim() ? `Tiny in-world text only if it fits: ${d.overlay.trim()}.` : "",
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

export const ANIME_LOOKS = new Set(["anime", "90s-cel", "manhwa", "manga"]);
