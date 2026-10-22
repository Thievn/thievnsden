import { STYLES, styleById } from "./options";

export type Choice = { id: string; label: string; text: string };
export type Group = { id: string; label: string; options: Choice[] };

export const ART_STYLES: { id: string; label: string; emoji: string; blurb: string }[] = [
  { id: "semireal", label: "Semi-real", emoji: "🪞", blurb: "Soft render" },
  { id: "pixar", label: "Pixar", emoji: "🎬", blurb: "Stylized 3D" },
  { id: "anime", label: "Anime", emoji: "🌸", blurb: "Clean lines" },
  { id: "photoreal", label: "Photoreal", emoji: "📷", blurb: "Natural skin" },
  { id: "painterly", label: "Painterly", emoji: "🎨", blurb: "Oil pigment" },
  { id: "cinematic", label: "Cinematic", emoji: "🎥", blurb: "Film still" },
  { id: "comic", label: "Comic", emoji: "💥", blurb: "Inked color" },
  { id: "noir", label: "Noir", emoji: "🌃", blurb: "Hard light" },
  { id: "watercolor", label: "Watercolor", emoji: "💧", blurb: "Wet paper" },
  { id: "fashion", label: "Fashion", emoji: "👗", blurb: "Editorial" },
  { id: "fantasy", label: "Fantasy", emoji: "🏰", blurb: "Ornate" },
  { id: "retro", label: "Retro", emoji: "📼", blurb: "Warm grain" },
];

export const APPEARANCE: Group[] = [
  {
    id: "length",
    label: "Hair length",
    options: [
      { id: "cropped", label: "Cropped", text: "Her hair is cropped close." },
      { id: "short", label: "Short", text: "Her hair is short." },
      { id: "bob", label: "Bob", text: "Her hair is a sharp bob." },
      { id: "shoulder", label: "Shoulder", text: "Her hair falls to her shoulders." },
      { id: "long", label: "Long", text: "Her hair is long." },
      { id: "waist", label: "Waist", text: "Her hair falls to her waist." },
    ],
  },
  {
    id: "color",
    label: "Hair color",
    options: [
      { id: "black", label: "Black", text: "Her hair is black." },
      { id: "brown", label: "Brown", text: "Her hair is brown." },
      { id: "blonde", label: "Blonde", text: "Her hair is blonde." },
      { id: "auburn", label: "Auburn", text: "Her hair is auburn." },
      { id: "silver", label: "Silver", text: "Her hair is silver." },
      { id: "rose", label: "Rose gold", text: "Her hair is rose gold." },
    ],
  },
  {
    id: "texture",
    label: "Hair style",
    options: [
      { id: "straight", label: "Straight", text: "Her hair is straight." },
      { id: "wavy", label: "Wavy", text: "Her hair is wavy." },
      { id: "curly", label: "Curly", text: "Her hair is curly." },
      { id: "braid", label: "Braid", text: "Her hair is in a braid." },
      { id: "bun", label: "Bun", text: "Her hair is in a loose bun." },
      { id: "bangs", label: "Bangs", text: "Her hair has soft bangs." },
    ],
  },
  {
    id: "eyes",
    label: "Eyes",
    options: [
      { id: "brown", label: "Brown", text: "Her eyes are brown." },
      { id: "hazel", label: "Hazel", text: "Her eyes are hazel." },
      { id: "green", label: "Green", text: "Her eyes are green." },
      { id: "blue", label: "Blue", text: "Her eyes are blue." },
      { id: "grey", label: "Grey", text: "Her eyes are grey." },
      { id: "amber", label: "Amber", text: "Her eyes are amber." },
    ],
  },
  {
    id: "skin",
    label: "Skin",
    options: [
      { id: "fair", label: "Fair", text: "Her skin is fair." },
      { id: "olive", label: "Olive", text: "Her skin is olive." },
      { id: "tan", label: "Tan", text: "Her skin is tan." },
      { id: "deep", label: "Deep", text: "Her skin is deep brown." },
      { id: "freckles", label: "Freckles", text: "Her skin is freckled." },
    ],
  },
  {
    id: "build",
    label: "Build",
    options: [
      { id: "slender", label: "Slender", text: "She has a slender build." },
      { id: "athletic", label: "Athletic", text: "She has an athletic build." },
      { id: "curvy", label: "Curvy", text: "She has a curvy build." },
      { id: "soft", label: "Soft", text: "She has a soft build." },
      { id: "tall", label: "Tall", text: "She is tall, with a long stance." },
    ],
  },
  {
    id: "expression",
    label: "Expression",
    options: [
      { id: "calm", label: "Calm", text: "Her expression is calm." },
      { id: "smile", label: "Smile", text: "She wears a slow smile." },
      { id: "smolder", label: "Smolder", text: "Her expression is a steady smolder." },
      { id: "laugh", label: "Laugh", text: "She is mid-laugh." },
      { id: "serious", label: "Serious", text: "Her expression is serious." },
    ],
  },
  {
    id: "wardrobe",
    label: "Clothes",
    options: [
      { id: "silk", label: "Silk dress", text: "She wears a black silk dress." },
      { id: "leather", label: "Leather", text: "She wears a leather jacket and dark jeans." },
      { id: "knit", label: "Knit", text: "She wears a soft knit and tailored trousers." },
      { id: "coat", label: "Coat", text: "She wears a long coat." },
      { id: "lingerie", label: "Lingerie", text: "She wears black lingerie." },
      { id: "robe", label: "Robe", text: "She wears an open silk robe." },
      { id: "swim", label: "Swim", text: "She wears a dark one-piece." },
      { id: "armor", label: "Armor", text: "She wears ornate fantasy armor." },
    ],
  },
];

export const PERSONALITY: Choice[] = [
  { id: "tender", label: "Tender", text: "She is tender and unhurried." },
  { id: "teasing", label: "Teasing", text: "She is teasing, with a crooked smile." },
  { id: "shy", label: "Shy", text: "She is shy and glances up." },
  { id: "bold", label: "Bold", text: "She is bold and direct." },
  { id: "playful", label: "Playful", text: "She is playful and bright." },
  { id: "intense", label: "Intense", text: "She is intense and holds eye contact." },
  { id: "dreamy", label: "Dreamy", text: "She is dreamy and faraway." },
  { id: "fierce", label: "Fierce", text: "She is fierce and composed." },
  { id: "warm", label: "Warm", text: "She is warm and easy." },
  { id: "aloof", label: "Aloof", text: "She is cool and a little aloof." },
];

export const SCENES: Choice[] = [
  { id: "studio", label: "Studio", text: "She is in a seamless photo studio with soft key light." },
  { id: "candle", label: "Candlelight", text: "She is in a candlelit bedroom." },
  { id: "rain", label: "Rain window", text: "She stands at a rain-streaked window at night." },
  { id: "neon", label: "Neon street", text: "She is on a neon-lit street after dark." },
  { id: "garden", label: "Garden", text: "She is in a moonlit garden." },
  { id: "roof", label: "Rooftop", text: "She is on a rooftop at dusk." },
  { id: "bath", label: "Marble bath", text: "She is in a marble bathroom with steam and warm light." },
  { id: "lounge", label: "Lounge", text: "She is in a velvet lounge with low lamps." },
  { id: "beach", label: "Beach", text: "She is on a quiet beach after sunset." },
  { id: "throne", label: "Throne room", text: "She is in a dark throne room." },
  { id: "kitchen", label: "Kitchen", text: "She is in a small kitchen in the morning." },
  { id: "forest", label: "Forest", text: "She is in a foggy forest clearing." },
];

export const POSES: { id: string; label: string; emoji: string; keywords: string }[] = [
  { id: "stand", label: "Stand", emoji: "🧍", keywords: "standing, weight on one hip, full body" },
  { id: "sit", label: "Sit", emoji: "🪑", keywords: "seated, knees together, upright posture" },
  { id: "lean", label: "Lean", emoji: "🧱", keywords: "leaning against a wall, one shoulder touching it" },
  { id: "lookback", label: "Look back", emoji: "👀", keywords: "looking back over her shoulder" },
  { id: "hair", label: "In hair", emoji: "✋", keywords: "both hands in her hair" },
  { id: "walk", label: "Walk", emoji: "🚶", keywords: "walking toward the camera, mid stride" },
  { id: "kneel", label: "Kneel", emoji: "🧎", keywords: "kneeling upright" },
  { id: "recline", label: "Recline", emoji: "🛋️", keywords: "reclining on a chaise" },
  { id: "stretch", label: "Stretch", emoji: "🙌", keywords: "arms raised overhead in a stretch" },
  { id: "profile", label: "Profile", emoji: "🌓", keywords: "side profile, portrait crop" },
  { id: "close", label: "Close-up", emoji: "🔎", keywords: "close portrait, face and shoulders" },
  { id: "behind", label: "Behind", emoji: "🔙", keywords: "three-quarter view from behind" },
  { id: "edge", label: "Bed edge", emoji: "🛏️", keywords: "sitting on the edge of the bed" },
  { id: "side", label: "On side", emoji: "🌙", keywords: "lying on her side, head propped on one hand" },
  { id: "crouch", label: "Crouch", emoji: "⬇️", keywords: "low athletic crouch" },
  { id: "arch", label: "Arch", emoji: "〰️", keywords: "standing with her back slightly arched" },
];

export const RATIO_CHOICES = [
  { id: "portrait", label: "Portrait" },
  { id: "square", label: "Square" },
  { id: "landscape", label: "Landscape" },
  { id: "story", label: "Story" },
  { id: "wide", label: "Wide" },
] as const;

export type Recipe = {
  name: string;
  style: string;
  appearance: Record<string, string>;
  personality: string;
  scene: string;
  action: string;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export function sanitizeRecipe(value: unknown): Recipe | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const appearance: Record<string, string> = {};
  const raw = row.appearance;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const group of APPEARANCE) {
      const picked = (raw as Record<string, unknown>)[group.id];
      if (typeof picked === "string" && group.options.some((option) => option.id === picked)) {
        appearance[group.id] = picked;
      }
    }
  }
  const personality = PERSONALITY.some((item) => item.id === row.personality) ? String(row.personality) : "";
  const scene = SCENES.some((item) => item.id === row.scene) ? String(row.scene) : "";
  const style = styleById(typeof row.style === "string" ? row.style : "").id;
  return {
    name: clean(row.name, 40),
    style,
    appearance,
    personality,
    scene,
    action: clean(row.action, 400),
  };
}

export function buildCharacterPrompt(recipe: Recipe): string {
  const parts: string[] = [];
  if (recipe.name) parts.push(`Her name is ${recipe.name}.`);
  for (const group of APPEARANCE) {
    const picked = group.options.find((option) => option.id === recipe.appearance[group.id]);
    if (picked) parts.push(picked.text);
  }
  const personality = PERSONALITY.find((item) => item.id === recipe.personality);
  if (personality) parts.push(personality.text);
  const scene = SCENES.find((item) => item.id === recipe.scene);
  if (scene) parts.push(scene.text);
  if (recipe.action) parts.push(/[.!?]$/.test(recipe.action) ? recipe.action : `${recipe.action}.`);
  if (!parts.length) parts.push("An adult woman stands in a quiet room, looking at the camera.");
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 1800);
}

export function poseById(id: string | null | undefined) {
  return POSES.find((pose) => pose.id === id) ?? null;
}

export function withPose(prompt: string, poseId: string): string {
  const pose = poseById(poseId);
  if (!pose) return prompt.replace(/\s+/g, " ").trim().slice(0, 2000);
  const base = prompt.replace(/\s+/g, " ").trim();
  if (base.includes(pose.keywords)) return base.slice(0, 2000);
  return `${base} ${pose.keywords}`.trim().slice(0, 2000);
}

export function styleEmoji(id: string) {
  return ART_STYLES.find((style) => style.id === id)?.emoji ?? "✦";
}

export function knownStyle(id: string) {
  return STYLES.some((style) => style.id === id);
}
