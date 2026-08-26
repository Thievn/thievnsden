import {
  pickOpt,
  placesForWorld,
  randomId,
  ACCESSORIES,
  AGES,
  BODIES,
  CAMERAS,
  ETHNICITIES,
  EXPRESSIONS,
  EYES,
  HAIR_COLORS,
  HAIR_STYLES,
  HEATS,
  HEIGHTS,
  LIGHTS,
  LOOKS,
  MAKEUPS,
  PLACES,
  POSES,
  VIBES,
  WARDROBES,
  WEATHERS,
  WHOS,
  WORLDS,
  type Opt,
} from "@/lib/afterimage";

export type StudioDraft = {
  phoneId: string;
  styleId: string;
  styleSearch: string;
  subject: string;
  want: string;
  series: string;
  seriesSlug: string;
  who: string;
  age: string;
  ethnicity: string;
  body: string;
  height: string;
  hairColor: string;
  hairStyle: string;
  eyes: string;
  clothes: string;
  accessory: string;
  makeup: string;
  pose: string;
  expression: string;
  world: string;
  place: string;
  lighting: string;
  weather: string;
  camera: string;
  vibe: string;
  heat: string;
};

export const EMPTY_DRAFT: StudioDraft = {
  phoneId: "classic",
  styleId: "photo",
  styleSearch: "",
  subject: "",
  want: "",
  series: "",
  seriesSlug: "",
  who: "woman",
  age: "21-24",
  ethnicity: "",
  body: "",
  height: "",
  hairColor: "",
  hairStyle: "",
  eyes: "",
  clothes: "",
  accessory: "",
  makeup: "",
  pose: "",
  expression: "",
  world: "",
  place: "",
  lighting: "",
  weather: "",
  camera: "",
  vibe: "",
  heat: "flirty",
};

export type Preset = {
  id: string;
  label: string;
  blurb: string;
  emoji: string;
  wash: string;
  patch: Partial<StudioDraft>;
};

export const PRESETS: Preset[] = [
  {
    id: "neon-rogue",
    label: "Neon rogue",
    blurb: "Wet leather. Trouble in the glow.",
    emoji: "🗡️",
    wash: "from-fuchsia-700/50 to-cyan-950",
    patch: {
      styleId: "neon",
      who: "woman",
      heat: "fierce",
      clothes: "rogue",
      accessory: "daggers",
      hairColor: "black",
      hairStyle: "wet",
      eyes: "gold",
      world: "cyber",
      place: "alley",
      lighting: "neon",
      weather: "rain",
      pose: "look-back",
      expression: "smirk",
      vibe: "dangerous",
      camera: "low",
    },
  },
  {
    id: "golden-film",
    label: "Golden film",
    blurb: "Portra light. A hush of summer.",
    emoji: "🎬",
    wash: "from-amber-600/45 to-rose-950",
    patch: {
      styleId: "cinematic",
      who: "woman",
      heat: "soft",
      clothes: "gown",
      hairColor: "blonde",
      hairStyle: "long-waves",
      eyes: "hazel",
      world: "modern",
      place: "cliff",
      lighting: "golden",
      pose: "portrait",
      expression: "soft",
      vibe: "romantic",
      camera: "portrait",
      makeup: "natural",
    },
  },
  {
    id: "cel-crush",
    label: "90s cel",
    blurb: "Painted nights. VHS warmth.",
    emoji: "📼",
    wash: "from-sky-600/40 to-rose-950",
    patch: {
      styleId: "90s-cel",
      who: "woman",
      heat: "flirty",
      clothes: "street",
      hairColor: "red",
      hairStyle: "pigtails",
      eyes: "green",
      world: "modern",
      place: "street",
      lighting: "lamp",
      pose: "mid-stride",
      expression: "playful",
      vibe: "cool",
      makeup: "freckles",
    },
  },
  {
    id: "manhwa-lead",
    label: "Manhwa lead",
    blurb: "Gloss hair. Rain on glass.",
    emoji: "📖",
    wash: "from-violet-600/45 to-neutral-950",
    patch: {
      styleId: "manhwa",
      who: "woman",
      heat: "flirty",
      clothes: "coat",
      hairColor: "black",
      hairStyle: "long-straight",
      eyes: "grey",
      world: "modern",
      place: "train",
      lighting: "lamp",
      weather: "rain",
      pose: "look-back",
      expression: "distant",
      vibe: "lonely",
      camera: "portrait",
    },
  },
  {
    id: "throne",
    label: "Claim the chair",
    blurb: "Stone, gold, and a look that ends wars.",
    emoji: "👑",
    wash: "from-amber-700/40 to-purple-950",
    patch: {
      styleId: "fantasy",
      who: "woman",
      heat: "fierce",
      clothes: "gown",
      accessory: "necklace",
      hairColor: "white",
      hairStyle: "long-waves",
      eyes: "violet",
      world: "fantasy",
      place: "throne",
      lighting: "candle",
      pose: "hero",
      expression: "fierce",
      vibe: "mythic",
      makeup: "glam",
      camera: "low",
    },
  },
  {
    id: "noir-coat",
    label: "Noir coat",
    blurb: "Hard light. Soft rain. No answers.",
    emoji: "🕯️",
    wash: "from-zinc-500/30 to-black",
    patch: {
      styleId: "noir",
      who: "woman",
      heat: "fierce",
      clothes: "coat",
      hairColor: "black",
      hairStyle: "bob",
      eyes: "brown",
      world: "modern",
      place: "alley",
      lighting: "rim",
      weather: "rain",
      pose: "lean",
      expression: "bored",
      vibe: "gritty",
      camera: "side",
    },
  },
  {
    id: "cottage-rain",
    label: "Moss & rain",
    blurb: "Knit, fog, and a forest that knows you.",
    emoji: "🌲",
    wash: "from-emerald-800/45 to-stone-950",
    patch: {
      styleId: "analog",
      who: "woman",
      heat: "soft",
      clothes: "knit",
      hairColor: "auburn",
      hairStyle: "messy",
      eyes: "green",
      world: "forest-world",
      place: "forest",
      lighting: "overcast",
      weather: "fog",
      pose: "stand",
      expression: "soft",
      vibe: "lonely",
      makeup: "freckles",
    },
  },
  {
    id: "penthouse",
    label: "Penthouse hush",
    blurb: "Glass, city, silk. Nobody else invited.",
    emoji: "🪟",
    wash: "from-rose-700/40 to-neutral-950",
    patch: {
      styleId: "glamour",
      who: "woman",
      heat: "flirty",
      clothes: "silk",
      hairColor: "dark-brown",
      hairStyle: "wet",
      eyes: "brown",
      world: "modern",
      place: "penthouse",
      lighting: "lamp",
      pose: "sit",
      expression: "smirk",
      vibe: "luxe",
      makeup: "glam",
      camera: "portrait",
    },
  },
  {
    id: "western-dust",
    label: "Last town",
    blurb: "Heat, wood, and a stare that waits.",
    emoji: "🌵",
    wash: "from-orange-800/40 to-amber-950",
    patch: {
      styleId: "photo",
      who: "woman",
      heat: "fierce",
      clothes: "western-wear",
      hairColor: "brown",
      hairStyle: "ponytail",
      eyes: "amber",
      world: "western",
      place: "saloon",
      lighting: "golden",
      weather: "heat",
      pose: "lean",
      expression: "serious",
      vibe: "dangerous",
    },
  },
  {
    id: "pixel-idol",
    label: "Pixel idol",
    blurb: "Tiny sprites. Huge presence.",
    emoji: "👾",
    wash: "from-lime-600/35 to-indigo-950",
    patch: {
      styleId: "pixel",
      who: "woman",
      heat: "funny",
      clothes: "hoodie",
      hairColor: "pink",
      hairStyle: "space-buns",
      eyes: "blue",
      world: "modern",
      place: "arcade",
      lighting: "club",
      pose: "stand",
      expression: "playful",
      vibe: "cool",
    },
  },
  {
    id: "vapor-dusk",
    label: "Vapor dusk",
    blurb: "Chrome sun. Magenta hush.",
    emoji: "🌴",
    wash: "from-fuchsia-600/45 to-cyan-900",
    patch: {
      styleId: "vapor",
      who: "woman",
      heat: "flirty",
      clothes: "lookbook",
      hairColor: "pink",
      hairStyle: "long-waves",
      eyes: "violet",
      world: "cyber",
      place: "rooftop",
      lighting: "neon",
      pose: "portrait",
      expression: "distant",
      vibe: "dreamy",
      camera: "portrait",
    },
  },
  {
    id: "gothic-candle",
    label: "Candle nave",
    blurb: "Stone, smoke, and a quiet dare.",
    emoji: "🦇",
    wash: "from-violet-900/50 to-black",
    patch: {
      styleId: "paint",
      who: "woman",
      heat: "soft",
      clothes: "cloak",
      hairColor: "black",
      hairStyle: "hime",
      eyes: "red",
      world: "gothic",
      place: "cathedral",
      lighting: "candle",
      pose: "walk-in",
      expression: "serious",
      vibe: "mythic",
      makeup: "gothic",
    },
  },
];

function pick(list: Opt[], allowEmpty = false) {
  return randomId(list, allowEmpty);
}

export function surpriseDraft(phoneId: string): StudioDraft {
  const world = pick(WORLDS, true);
  const places = placesForWorld(world);
  const look = LOOKS[Math.floor(Math.random() * LOOKS.length)];
  let lighting = pick(LIGHTS, true);
  if (world !== "cyber" && lighting === "neon") lighting = "lamp";
  return {
    ...EMPTY_DRAFT,
    phoneId,
    styleId: look.id,
    who: pick(WHOS),
    age: pick(AGES),
    ethnicity: pick(ETHNICITIES, true),
    body: pick(BODIES, true),
    height: pick(HEIGHTS, true),
    hairColor: pick(HAIR_COLORS, true),
    hairStyle: pick(HAIR_STYLES, true),
    eyes: pick(EYES, true),
    clothes: pick(WARDROBES, true),
    accessory: pick(ACCESSORIES, true),
    makeup: pick(MAKEUPS, true),
    pose: pick(POSES, true),
    expression: pick(EXPRESSIONS, true),
    world,
    place: pick(places, true),
    lighting,
    weather: pick(WEATHERS, true),
    camera: pick(CAMERAS, true),
    vibe: pick(VIBES, true),
    heat: pick(HEATS),
  };
}

export function applyPreset(current: StudioDraft, preset: Preset): StudioDraft {
  return {
    ...current,
    ...preset.patch,
    series: "",
    seriesSlug: "",
    subject: current.subject,
    want: current.want,
    styleSearch: current.styleSearch,
  };
}

export const STUDIO_PANELS = [
  { id: "look", label: "Look", kicker: "How it's made" },
  { id: "face", label: "Face", kicker: "Who shows up" },
  { id: "hair", label: "Hair", kicker: "Color and cut" },
  { id: "fit", label: "Fit", kicker: "Clothes and extras" },
  { id: "scene", label: "Scene", kicker: "World around them" },
  { id: "shot", label: "Shot", kicker: "Pose and energy" },
  { id: "spice", label: "Spice", kicker: "Optional notes" },
] as const;

export type StudioPanel = (typeof STUDIO_PANELS)[number]["id"];

export function recipeChips(draft: StudioDraft) {
  const rows: { panel: StudioPanel; key: string; label: string }[] = [];
  const add = (panel: StudioPanel, key: string, list: Opt[], id?: string) => {
    const hit = pickOpt(list, id);
    if (hit?.label) rows.push({ panel, key, label: hit.label });
  };
  add("look", "look", LOOKS, draft.styleId);
  add("face", "who", WHOS, draft.who);
  add("face", "age", AGES, draft.age);
  add("face", "eth", ETHNICITIES, draft.ethnicity);
  add("face", "body", BODIES, draft.body);
  add("hair", "color", HAIR_COLORS, draft.hairColor);
  add("hair", "cut", HAIR_STYLES, draft.hairStyle);
  add("face", "eyes", EYES, draft.eyes);
  add("fit", "fit", WARDROBES, draft.clothes);
  add("fit", "acc", ACCESSORIES, draft.accessory);
  add("scene", "world", WORLDS, draft.world);
  add("scene", "place", PLACES, draft.place);
  add("scene", "light", LIGHTS, draft.lighting);
  add("shot", "pose", POSES, draft.pose);
  add("shot", "heat", HEATS, draft.heat);
  add("shot", "vibe", VIBES, draft.vibe);
  if (draft.series) rows.push({ panel: "spice", key: "series", label: draft.series });
  if (draft.subject.trim()) rows.push({ panel: "spice", key: "subject", label: draft.subject.trim() });
  if (draft.want.trim()) rows.push({ panel: "spice", key: "want", label: draft.want.trim() });
  return rows;
}

export function shufflePanel(draft: StudioDraft, panel: StudioPanel): StudioDraft {
  switch (panel) {
    case "look":
      return { ...draft, styleId: randomId(LOOKS) };
    case "face":
      return {
        ...draft,
        who: randomId(WHOS),
        age: randomId(AGES),
        ethnicity: randomId(ETHNICITIES, true),
        body: randomId(BODIES, true),
        height: randomId(HEIGHTS, true),
        eyes: randomId(EYES, true),
        makeup: randomId(MAKEUPS, true),
      };
    case "hair":
      return {
        ...draft,
        hairColor: randomId(HAIR_COLORS, true),
        hairStyle: randomId(HAIR_STYLES, true),
      };
    case "fit":
      return {
        ...draft,
        clothes: randomId(WARDROBES, true),
        accessory: randomId(ACCESSORIES, true),
      };
    case "scene": {
      const world = randomId(WORLDS, true);
      return {
        ...draft,
        world,
        place: randomId(placesForWorld(world), true),
        lighting: randomId(LIGHTS, true),
        weather: randomId(WEATHERS, true),
      };
    }
    case "shot":
      return {
        ...draft,
        pose: randomId(POSES, true),
        expression: randomId(EXPRESSIONS, true),
        camera: randomId(CAMERAS, true),
        vibe: randomId(VIBES, true),
        heat: randomId(HEATS),
      };
    default:
      return draft;
  }
}

export function draftToPrintBody(draft: StudioDraft, userId: string) {
  return {
    userId,
    want: draft.want,
    styleId: draft.styleId,
    styleSearch: draft.styleSearch,
    series: draft.series,
    pose: draft.pose,
    heat: draft.heat,
    phoneId: draft.phoneId,
    subject: draft.subject,
    clothes: draft.clothes,
    lighting: draft.lighting,
    place: draft.place,
    who: draft.who,
    age: draft.age,
    ethnicity: draft.ethnicity,
    body: draft.body,
    height: draft.height,
    hairColor: draft.hairColor,
    hairStyle: draft.hairStyle,
    eyes: draft.eyes,
    world: draft.world,
    expression: draft.expression,
    accessory: draft.accessory,
    weather: draft.weather,
    makeup: draft.makeup,
    camera: draft.camera,
    vibe: draft.vibe,
    finish: "print",
  };
}
