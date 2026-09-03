export type XThoughtArtPick = {
  id: string;
  label: string;
  line: string;
};

export type XThoughtArt = {
  style: XThoughtArtPick;
  composition: XThoughtArtPick;
  light: XThoughtArtPick;
  palette: XThoughtArtPick;
  twist: XThoughtArtPick;
};

const pick = <T,>(list: readonly T[], rng: () => number): T =>
  list[Math.floor(rng() * list.length)]!;

export const X_ART_STYLES: XThoughtArtPick[] = [
  { id: "oil", label: "Oil painting", line: "oil on canvas, thick impasto brushwork, gallery painting, not a photograph" },
  { id: "ukiyo", label: "Ukiyo-e", line: "ukiyo-e woodblock print, flat color fields, bold outlines, washi grain" },
  { id: "anime", label: "Anime key visual", line: "modern anime key visual, painterly background, sharp linework, not live-action" },
  { id: "cel", label: "90s cel", line: "1990s hand-painted anime cel, film grain, painted background, not 3D" },
  { id: "riso", label: "Risograph", line: "risograph print, two or three ink layers, misregistered, paper tooth" },
  { id: "charcoal", label: "Charcoal", line: "charcoal and chalk on toned paper, smudged graphite, high contrast drawing" },
  { id: "watercolor", label: "Watercolor", line: "watercolor on cold-press paper, pigment blooms, visible paper" },
  { id: "gouache", label: "Gouache", line: "opaque gouache illustration, matte poster color, clean shapes" },
  { id: "pulp", label: "Pulp cover", line: "1950s pulp magazine illustration, dramatic lighting, painted, no cover text" },
  { id: "comic", label: "Comic", line: "western comic panel, bold ink, flat color, halftone dots" },
  { id: "linocut", label: "Linocut", line: "linocut print, carved negative space, limited ink, paper impression" },
  { id: "inkwash", label: "Ink wash", line: "East Asian ink wash painting, wet black ink, spare composition" },
  { id: "stained", label: "Stained glass", line: "stained glass panel, lead cames, jewel color, backlight glow" },
  { id: "collage", label: "Collage", line: "torn-magazine collage, analog cut paper, overlapping fragments, no readable words" },
  { id: "pixel", label: "Pixel art", line: "detailed pixel art, limited palette, clean clusters, not a screenshot of a game UI" },
  { id: "synth", label: "Airbrush 80s", line: "1980s airbrush illustration, chrome, sunset gradient, synth poster, no type" },
  { id: "surreal", label: "Surreal painting", line: "surreal oil painting, Magritte-quiet, impossible scale, dream-literal" },
  { id: "clay", label: "Stop-motion", line: "stop-motion still, clay and fabric textures, tactile miniature set that is not a house" },
  { id: "portra", label: "35mm film", line: "35mm Kodak Portra photograph, natural grain, available light, documentary, not studio den lighting" },
  { id: "infrared", label: "Infrared photo", line: "infrared photograph, false-color foliage, alien daylight, real camera" },
  { id: "wetplate", label: "Wet plate", line: "wet-plate collodion photograph, silvered black, antique chemistry, long exposure" },
  { id: "flash", label: "Harsh flash", line: "harsh on-camera flash photojournalism, night, grain, candid, outdoors or in public" },
  { id: "fashion", label: "Editorial", line: "high-fashion editorial photograph, odd location, stylized, not a living-room lookbook" },
  { id: "tilt", label: "Miniature", line: "tilt-shift miniature look, toy-scale world, shallow focus, outdoor diorama" },
];

export const X_ART_COMPOSITIONS: XThoughtArtPick[] = [
  { id: "object", label: "One object", line: "extreme close-up of one symbolic object that stands for the thought, filling the frame" },
  { id: "tiny", label: "Tiny figure", line: "one small adult figure dwarfed by a huge outdoor place, back turned or cropped" },
  { id: "crowd", label: "Crowd", line: "crowded public street, transit, concert, or market, faces turned away" },
  { id: "weather", label: "Weather", line: "weather is the subject: rain on glass, heat haze, snow, storm, fog" },
  { id: "flatlay", label: "Flat-lay", line: "overhead objects on a textured surface that is not a coffee table in a home" },
  { id: "motion", label: "In motion", line: "motion: highway, train, night driving, blur, a vehicle as the world" },
  { id: "water", label: "Water / sky", line: "water, reflection, horizon, or sky as most of the frame" },
  { id: "hands", label: "Hands only", line: "hands and one prop only, no face, no room, dark void or outdoor ground" },
  { id: "animal", label: "Animal", line: "an animal as metaphor for the thought, real or painted, no pet-portrait studio" },
  { id: "empty", label: "Empty public", line: "empty public place: parking structure, hotel corridor, stadium, pier, underpass" },
  { id: "collide", label: "Two images", line: "two colliding images in one frame, surreal but readable" },
  { id: "aerial", label: "Aerial", line: "aerial or high angle over a real outdoor location" },
  { id: "glass", label: "Through glass", line: "seen through glass, vending machine, aquarium, bus window, or phone screen reflection" },
  { id: "stage", label: "Venue", line: "stage, club, locker room, office floor, or shop after hours — not a home" },
];

export const X_ART_LIGHTS: XThoughtArtPick[] = [
  { id: "noon", label: "Noon", line: "harsh noon sun, hard short shadows" },
  { id: "gold", label: "Golden hour", line: "golden hour backlight, long warm shadows" },
  { id: "overcast", label: "Overcast", line: "overcast daylight, flat and honest" },
  { id: "sodium", label: "Street sodium", line: "sodium street lamps, orange night, wet asphalt" },
  { id: "neon", label: "Neon rain", line: "neon on wet pavement, magenta and cyan spill" },
  { id: "fluoro", label: "Fluorescent", line: "cold fluorescent supermarket or office light" },
  { id: "storm", label: "Storm", line: "lightning or storm-green sky" },
  { id: "fog", label: "Fog", line: "thick fog, muffled distance, pale glow" },
  { id: "flash", label: "Paparazzi", line: "single harsh flash, black around the subject" },
  { id: "moon", label: "Moon", line: "moonlit snow or concrete, blue-silver" },
  { id: "projector", label: "Projector", line: "projector beam in a dark venue, dust in the light" },
  { id: "underwater", label: "Underwater", line: "underwater caustics, green-blue, rising bubbles" },
];

export const X_ART_PALETTES: XThoughtArtPick[] = [
  { id: "acid", label: "Acid", line: "acid green against black" },
  { id: "postcard", label: "Postcard", line: "faded postcard pastels" },
  { id: "blood-teal", label: "Blood / teal", line: "blood orange and teal" },
  { id: "bone-rust", label: "Bone / rust", line: "bone white and rust" },
  { id: "ice-gold", label: "Ice / gold", line: "ice blue and cigarette gold" },
  { id: "magenta", label: "Magenta ash", line: "magenta and charcoal" },
  { id: "saffron", label: "Saffron ink", line: "saffron and black ink" },
  { id: "wine", label: "Silver / wine", line: "cold silver and wine red" },
  { id: "chlorine", label: "Chlorine", line: "pool chlorine and night" },
  { id: "bruise", label: "Bruise", line: "bruise purple and hospital green" },
];

export const X_ART_TWISTS: XThoughtArtPick[] = [
  { id: "wrong-decade", label: "Wrong decade", line: "one object is from the wrong decade" },
  { id: "wrong-color", label: "Wrong color", line: "one object is a color that does not belong" },
  { id: "too-big", label: "Too big", line: "one ordinary thing is impossibly large" },
  { id: "missing", label: "Something missing", line: "a person-shaped absence where someone should be" },
  { id: "double", label: "Double", line: "the subject appears twice, slightly out of sync" },
  { id: "textless-sign", label: "Blank sign", line: "a blank sign, screen, or billboard with no readable letters" },
  { id: "birds", label: "Birds", line: "birds or insects interrupting the frame" },
  { id: "flood", label: "Flooded", line: "an inch of water where it should be dry" },
];

export const HOUSE_BAN =
  "Do not draw a living room, lounge, apartment interior, house interior, bedroom furniture, kitchen, sofa, couch, coffee table, dining set, nightstand, houseplant against a beige wall, matching furniture catalog, or a generic dark den. Prefer outdoors, public spaces, weather, objects, vehicles, crowds, or metaphor.";

const HOUSE_RE =
  /\b(living room|lounge|apartment interior|house interior|bedroom set|kitchen island|sofa|couch|coffee table|nightstand|throw pillow|sectional|open concept)\b/i;

export function isHouseDefault(text: string) {
  return text.split(/[.!?]/).some((sentence) => {
    if (/\b(do not|don't|never|no|not a|not the)\b/i.test(sentence) && HOUSE_RE.test(sentence)) return false;
    return HOUSE_RE.test(sentence);
  });
}

export function thoughtGist(post: string, extra = "") {
  const raw = [post, extra].filter(Boolean).join("\n");
  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(link in bio|more in the den|written in the den)\b/i.test(line));
  return lines.join(" ").replace(/\s+/g, " ").trim().slice(0, 900);
}

export function guidedArt(art: XThoughtArt, guide: string): XThoughtArt {
  const clean = guide.trim();
  if (!clean) return art;
  return {
    ...art,
    composition: {
      id: "guide",
      label: "Your scene",
      line: "follow the user's scene exactly; do not swap in a different location, object, or story",
    },
    twist: {
      id: "none",
      label: "No extra twist",
      line: "no extra surreal twist unless the user asked for it in the scene guide",
    },
  };
}

export function rollXThoughtArt(rng: () => number = Math.random): XThoughtArt {
  return {
    style: pick(X_ART_STYLES, rng),
    composition: pick(X_ART_COMPOSITIONS, rng),
    light: pick(X_ART_LIGHTS, rng),
    palette: pick(X_ART_PALETTES, rng),
    twist: pick(X_ART_TWISTS, rng),
  };
}

export function artLabel(art: XThoughtArt, guide = "") {
  const mix = `${art.style.label} · ${art.composition.label}`;
  const hint = guide.trim();
  return hint ? `${mix} · ${hint.slice(0, 80)}` : mix;
}

export function localScene(input: {
  gist: string;
  topic?: string;
  guide?: string;
  art: XThoughtArt;
}) {
  const gist = input.gist || input.topic || "a human thought that will not sit still";
  const guide = input.guide?.trim();
  if (guide) {
    return [
      `Draw this scene, exactly: ${guide}.`,
      `It has to illustrate this writing, not a different story: "${gist}".`,
      `Lighting: ${input.art.light.line}.`,
      `Palette: ${input.art.palette.line}.`,
      "Keep the user's objects and place. Do not invent a house interior.",
    ].join(" ");
  }
  return [
    `Invent a specific scene that illustrates this writing: "${gist}".`,
    input.topic ? `Topic flavor, not the whole picture: ${input.topic}.` : "",
    `Composition: ${input.art.composition.line}.`,
    `Lighting: ${input.art.light.line}.`,
    `Palette: ${input.art.palette.line}.`,
    `Twist: ${input.art.twist.line}.`,
    "Use concrete nouns from the writing. If the writing is a feeling, pick a public or outdoor metaphor. Do not sit anyone on a couch.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function directorMessages(input: {
  gist: string;
  topic?: string;
  guide?: string;
  art: XThoughtArt;
  aspect: string;
}) {
  const shape =
    input.aspect === "9:16"
      ? "tall 9:16 phone frame"
      : input.aspect === "1:1"
        ? "square 1:1 frame"
        : input.aspect === "4:5"
          ? "tall 4:5 portrait frame"
          : "wide 16:9 landscape";
  const guide = input.guide?.trim();
  const system = `You are an art director for X images. You write ONE original picture prompt that illustrates a specific post.
Return a single image-generation prompt, 70 to 110 words, one paragraph, no quotes, no markdown.
The picture must be about the writing, not a generic moody portrait.
Required medium: ${input.art.style.line}.
Required composition: ${input.art.composition.line}.
Required light: ${input.art.light.line}.
Required palette: ${input.art.palette.line}.
Required twist: ${input.art.twist.line}.
Frame: ${shape}.
${guide ? "The user's scene guide is law. Use their objects and place. Do not replace them with a different metaphor." : ""}
${HOUSE_BAN}
Adult-ok, not pornographic. No logos, no readable text, no UI, no watermarks.`;

  const user = [
    input.topic ? `Topic: ${input.topic}` : "",
    guide ? `Scene guide (must follow):\n${guide}` : "",
    `Post:\n${input.gist}`,
    guide
      ? "Render the scene guide as the picture of this post. Name the user's objects. Do not invent a different location."
      : "Invent the scene from the post. Name real objects, places, weather, or bodies from the writing. Do not describe furniture in a home.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system, user };
}

export function assembleXThoughtImagePrompt(input: {
  scene: string;
  art: XThoughtArt;
  aspect: string;
  gist: string;
  guide?: string;
}) {
  const shape =
    input.aspect === "9:16"
      ? "tall 9:16 phone portrait"
      : input.aspect === "1:1"
        ? "square 1:1"
        : input.aspect === "4:5"
          ? "tall 4:5 portrait"
          : "wide 16:9 landscape";
  const scene = input.scene.replace(/\s+/g, " ").trim();
  const guide = input.guide?.trim();
  return [
    `Render strictly as ${input.art.style.line}.`,
    `${shape}, fill the frame edge to edge.`,
    guide ? `User scene lock: ${guide}.` : "",
    scene,
    `This picture is about: ${input.gist}`,
    `Composition lock: ${input.art.composition.line}.`,
    `Light lock: ${input.art.light.line}. Palette: ${input.art.palette.line}. Twist: ${input.art.twist.line}.`,
    HOUSE_BAN,
    "No logos, no readable text, no UI, no watermarks, not a stock smile, not the same indoor room as last time.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeScene(scene: string, fallback: string) {
  const clean = scene
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^```[\w]*\n?|\n?```$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean || clean.length < 40) return fallback;
  if (isHouseDefault(clean)) return fallback;
  return clean.slice(0, 900);
}

export async function inventXThoughtScene(input: {
  gist: string;
  topic?: string;
  guide?: string;
  art: XThoughtArt;
  aspect: string;
  apiKey: string;
}): Promise<string | null> {
  const { system, user } = directorMessages(input);
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.3",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: input.guide?.trim() ? 0.55 : 0.85,
      max_tokens: 220,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const raw = String(data?.choices?.[0]?.message?.content || "").trim();
  if (!raw) return null;
  const fallback = localScene(input);
  const scene = sanitizeScene(raw, fallback);
  return scene;
}
