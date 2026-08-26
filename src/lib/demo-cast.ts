import { createServiceClient } from "@/lib/supabase/server";
import { getRarity } from "@/lib/rarity";
import { claimUsername, isUsernameTaken } from "@/lib/usernames";
import {
  BODY_CHIPS,
  CAMERA_CHIPS,
  CHEST_CHIPS,
  CLOTHES_MAN,
  CLOTHES_WOMAN,
  EXPRESSION_CHIPS,
  FACE_SHAPE_CHIPS,
  FOCUS_CHIPS,
  HAIR_COLOR_CHIPS,
  HAIR_MAN,
  HAIR_WOMAN,
  HEIGHT_CHIPS,
  LOOK_CHIPS,
  MARK_CHIPS,
  PLACE_CHIPS,
  POSE_CHIPS,
  STYLE_CHIPS,
  type CastGender,
  type CastHeat,
} from "@/lib/demo-cast-options";

export const STYLES = ["honest", "unhinged", "filthy", "petty", "deadpan"] as const;
export const FOCUSES = ["overall", "face", "body", "tits", "ass", "vibe"] as const;
export const FILTHY = ["degrade", "worship", "mixed"] as const;
export const HEATS = ["clean", "spicy", "filthy"] as const;
export const AGE_BANDS = [
  "18-20",
  "21-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-50",
] as const;

export type Style = (typeof STYLES)[number];
export type Focus = (typeof FOCUSES)[number];
export type FilthyMode = (typeof FILTHY)[number];

export type CastFilters = {
  heat?: string;
  gender?: string;
  ageBand?: string;
  ethnicity?: string;
  bodyType?: string;
  height?: string;
  hair?: string;
  hairColor?: string;
  expression?: string;
  camera?: string;
  pose?: string;
  setting?: string;
  outfit?: string;
  chest?: string;
  faceShape?: string;
  nose?: string;
  eyes?: string;
  brows?: string;
  lips?: string;
  skin?: string;
  mark?: string;
  style?: string;
  focus?: string;
  filthyMode?: string | null;
};

export type CastRecipe = {
  heat: CastHeat;
  gender: CastGender;
  ageBand: string;
  ethnicity: string;
  bodyType: string;
  height: string;
  hair: string;
  hairColor: string;
  expression: string;
  camera: string;
  pose: string;
  setting: string;
  outfit: string;
  chest: string;
  faceShape: string;
  nose: string;
  eyes: string;
  brows: string;
  lips: string;
  skin: string;
  mark: string;
  style: Style;
  focus: Focus;
  filthyMode: FilthyMode | null;
  uniq: string;
};

export const CAST_FILTER_KEYS = [
  "heat",
  "gender",
  "ageBand",
  "ethnicity",
  "bodyType",
  "height",
  "hair",
  "hairColor",
  "expression",
  "camera",
  "pose",
  "setting",
  "outfit",
  "chest",
  "faceShape",
  "nose",
  "eyes",
  "brows",
  "lips",
  "skin",
  "mark",
  "style",
  "focus",
  "filthyMode",
] as const;

const NOSES = [
  "a small button nose",
  "a straight narrow nose",
  "a wide nose with a rounded tip",
  "an aquiline nose with a slight hook",
  "a nose with a visible bump on the bridge",
  "a short upturned nose",
  "a long nose, a little too long for the face",
  "flared nostrils, strong nose",
  "a flat wide nose bridge",
];

const EYES = [
  "almond-shaped brown eyes",
  "round dark eyes",
  "hooded eyes",
  "deep-set eyes",
  "wide-set eyes",
  "close-set eyes",
  "monolid eyes",
  "upturned eyes with a slight cat shape",
  "downturned tired eyes",
  "pale grey-green eyes",
  "hazel eyes with a ring around the iris",
  "dark brown eyes with heavy lids",
];

const BROWS = [
  "thick naturally unkempt brows",
  "thin brows, slightly overplucked",
  "straight low brows",
  "high arched brows",
  "bushy brows that almost meet",
  "soft sparse brows",
  "dark bold brows",
  "blonde barely-there brows",
];

const LIPS = [
  "full lips",
  "thin lips",
  "a wide mouth",
  "a strong cupid's bow",
  "downturned lips",
  "uneven lips, lower fuller than upper",
  "a small mouth",
  "lips slightly chapped",
];

const SKINS = [
  "fair cool-toned skin with visible pores",
  "warm olive skin",
  "deep brown skin with cool undertone",
  "warm golden-brown skin",
  "porcelain skin with redness around the nose",
  "sun-tanned skin, not spray tan",
  "medium skin with a few acne marks",
  "freckled fair skin",
  "rich dark skin with a slight sheen",
  "light brown skin with a mole near the jaw",
];

const AGE_LOCK: Record<string, string> = {
  "18-20":
    "MUST look 18 to 20: very young adult, leftover baby fat in the cheeks, smooth unlined forehead, no crow's feet, no nasolabial folds, college-age, legally adult, NOT a child, NOT 25+",
  "21-24":
    "MUST look 21 to 24: early-20s adult, youthful but fully grown, light under-eye only if tired, no wrinkles, not a teenager, not 30",
  "25-29":
    "MUST look 25 to 29: mid-to-late 20s, more adult bone structure, slight definition at the jaw, maybe a hint of under-eye shadow, still young but not 21",
  "30-34":
    "MUST look 30 to 34: early 30s, faint smile lines starting, slightly more mature skin texture, not a 22-year-old with a filter",
  "35-39":
    "MUST look 35 to 39: mid-to-late 30s adult, visible nasolabial lines, early crow's feet, mature skin, this is NOT a 25-year-old",
  "40-44":
    "MUST look 40 to 44: early 40s, clear aging — crow's feet, forehead lines, slight softening at the jaw, neck texture, possible grey at the temples, NEVER look 20 or 30",
  "45-50":
    "MUST look 45 to 50: middle-aged adult, deep nasolabial folds, obvious crow's feet, forehead wrinkles, slight jowls, neck skin, possible grey or salt-and-pepper hair, age spots possible, thinner under-eye skin — a 25-year-old face is WRONG",
};

const CAMERA_LANG: Record<string, string> = {
  mirror_selfie: "mirror selfie taken by the subject themselves in a real bathroom or closet mirror",
  self_held: "phone selfie held out at arm's length, slight wide-angle distortion on the nose is ok",
  other_person: "candid photo taken by another person, not a self-held selfie, natural snapshot energy",
};

const POSE_LANG: Record<string, string> = {
  front: "facing the camera directly",
  three_quarter: "three-quarter angle to the camera",
  side: "side profile view",
  over_shoulder: "looking back over one shoulder toward the camera",
  back_ass:
    "back view with clear focus on lower body and ass, looking over the shoulder or face partially visible",
  full_body: "full body visible from head to roughly mid-thigh or feet",
  close_face: "close-up on the face, face fills most of the frame",
  overhead: "shot from slightly above, subject looking up toward the camera",
  lying_down: "lying down on a bed or couch, relaxed, looking at the camera",
  sitting: "sitting down, casual",
  leaning: "leaning against a wall, car, or furniture",
  on_bed: "on a rumpled bed, propped on elbows, looking at the camera",
  sprawled: "sprawled on the bed, one knee bent, amateur phone snapshot",
  ass_up:
    "lying on the bed face toward the pillow, hips lifted, looking back over the shoulder, amateur not a porn set",
  all_fours: "on all fours on the bed, looking at the camera, still a phone photo not a studio",
  kneeling_bed: "kneeling on the bed, sitting back on the heels, looking at the camera",
  arched: "back arched, chest forward, amateur snapshot energy",
  from_behind_bent:
    "bent forward looking back at the camera, lower body emphasized, still an amateur photo",
  knees_apart:
    "sitting on the bed, knees apart, looking at the camera, amateur snapshot, not a porn set",
  on_side: "lying on one side on the bed, hips stacked, looking at the camera",
  standing_hip: "standing with weight in one hip, full-body amateur photo",
  legs_up:
    "on the bed, one or both legs raised, amateur phone photo, still not a studio",
};

const CHEST_LANG: Record<string, string> = {
  covered: "chest fully covered by clothing",
  low_cut: "low-cut top, tasteful cleavage, editorial not porn",
  bare: "tasteful boudoir, chest visible the way a gallery photograph would allow, adult 25+, implied more than explicit, not pornography",
};

const STYLE_PROMPTS: Record<string, string> = {
  honest: `You are a blunt, observant judge in Thievn's Den. You can see the photo. Give an honest, human rating based on what you actually see. Be direct. Short and sharp — 1 to 2 sentences max.`,
  unhinged: `You are the unhinged resident of Thievn's Den. You can see the photo. Full permission to swear, be dark, crude, and mean based on what is actually in the image. 1 to 2 short sentences. Make it hit.`,
  filthy: `You are the filthy, explicit judge of Thievn's Den. You can see the photo. Rate the body and sexual energy with zero restraint based on what you see. You can be degrading, objectifying, or worshipful. Use real sexual language. Sound human. 1 to 2 short sentences max.`,
  petty: `You are petty and specific. You can see the photo. Focus on small details visible in the image. Allow swearing. 1 to 2 short sentences.`,
  deadpan: `You are completely flat and cold. You can see the photo. Deliver judgment based on what is visible with zero emotion. 1 to 2 sentences.`,
};

const FILTHY_SUB: Record<string, string> = {
  degrade: `Lean hard into degradation and objectification based on the actual body and appearance in the photo.`,
  worship: `Be explicitly positive and objectifying about what you see. Still filthy and direct.`,
  mixed: `Mix degradation and desire based on what is actually in the photo.`,
};

const FOCUS_HINTS: Record<string, string> = {
  overall: "Judge the whole package — face, body, and energy together.",
  face: "Focus mainly on the face, expression, and how it lands.",
  body: "Focus on overall body shape, proportions, and presence.",
  tits: "Focus specifically on their chest. Be direct about what you see.",
  ass: "Focus specifically on their ass and lower body. Be direct about what you see.",
  vibe: "Focus on the energy and vibe they give off more than pure looks.",
};

const FIRST_W = [
  "kaia", "maren", "elodie", "nia", "yasmin", "priya", "camila", "noelle", "talia",
  "reina", "maeve", "anika", "dahlia", "selene", "paloma", "kehlani", "aaliyah",
  "ines", "chiara", "amara", "leila", "hana", "yuna", "mei", "aisha", "sienna",
  "juniper", "wren", "tessa", "blair", "harlow", "soren", "lina", "farah",
  "noura", "zoya", "esme", "ophelia", "rory", "sloane", "delilah", "iona",
  "nalani", "keiko", "minh", "lucia", "valentina", "ximena", "adriana", "giulia",
  "freya", "saskia", "anya", "kira", "nova", "sage", "rowan", "indie",
];

const FIRST_M = [
  "jalen", "dorian", "marcel", "enzo", "kai", "omar", "rafael", "andres", "nico",
  "seth", "colton", "miles", "jasper", "evan", "malik", "devon", "cruz", "leon",
  "theo", "callum", "ibrahim", "kenji", "yusuf", "dante", "reed", "cassian",
  "nash", "bodhi", "kieran", "luca", "mateo", "diego", "hassan", "arjun",
  "rohan", "eli", "jonah", "felix", "oscar", "silas", "roman", "knox",
  "andre", "tomas", "viktor", "nolan", "hayes", "brooks", "griffin", "cody",
];

const LAST = [
  "vale", "reed", "hayes", "west", "lane", "brook", "stone", "cross", "wild",
  "sharp", "fox", "cole", "drew", "nunez", "alvarez", "park", "choi", "nguyen",
  "patel", "khan", "rossi", "moreau", "berg", "lind", "okafor", "mensah",
  "santos", "riley", "quinn", "blake", "ash", "hollow", "voss", "keane",
];

const HANDLE_BITS = [
  "ok", "rn", "later", "after", "low", "still", "maybe", "half", "left",
  "quiet", "late", "off", "on", "again",
];

const HUMAN_COMPOUNDS = [
  "leftoverwine", "latecheckout", "unsentdraft", "wrongexit", "secondtab",
  "afterglowish", "notyourshift", "closetab", "dimmernow", "lasttrain",
  "softalarm", "missedcall", "holdthedoor", "almosthome", "borrowedlight",
  "sideoftheroad", "halfoff", "stillawake", "lowbattery", "outtheback",
];

const BLOCKED = /(demo|seed|bot|npc|fake|testuser|user\d+|admin)/i;

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chipIds(chips: { id: string }[]) {
  return chips.filter((c) => c.id !== "random").map((c) => c.id);
}

function isBlank(v: unknown): v is undefined | null | "" | "random" {
  return v == null || v === "" || v === "random";
}

function resolveHeat(raw?: string): CastHeat {
  if (raw === "clean" || raw === "spicy" || raw === "filthy") return raw;
  const roll = Math.random();
  if (roll < 0.34) return "clean";
  if (roll < 0.72) return "spicy";
  return "filthy";
}

function resolveGender(raw?: string): CastGender {
  if (raw === "woman" || raw === "man") return raw;
  return Math.random() < 0.58 ? "woman" : "man";
}

function resolveStyle(raw?: string): Style {
  if (raw && (STYLES as readonly string[]).includes(raw)) return raw as Style;
  return pick(STYLES);
}

function resolveFocus(raw?: string): Focus {
  if (raw && (FOCUSES as readonly string[]).includes(raw)) return raw as Focus;
  return pick(FOCUSES);
}

function clothesFor(gender: CastGender, heat: CastHeat): string[] {
  const pack = gender === "man" ? CLOTHES_MAN : CLOTHES_WOMAN;
  return pack[heat].map((c) => c.id);
}

function hairFor(gender: CastGender): string[] {
  return chipIds(gender === "man" ? HAIR_MAN : HAIR_WOMAN);
}

function chestFor(gender: CastGender, heat: CastHeat, outfit: string): string {
  if (heat === "clean") return "covered";
  const lingerieOn =
    /lingerie|teddy|garter|corset|mesh|slip|micro|bikini|bra|babydoll|bralette|harness|vinyl|kimono|stockings|swimsuit|bodysuit/i.test(
      outfit
    );
  const wantsBare = /topless|shirtless|panties only|nothing underneath|boxers|underwear|in bed|towel/i.test(
    outfit
  );
  if (heat === "filthy") {
    if (gender === "woman") {
      if (wantsBare) return Math.random() < 0.7 ? "bare" : "low_cut";
      if (lingerieOn) return "low_cut";
      return Math.random() < 0.35 ? "bare" : "low_cut";
    }
    return wantsBare || Math.random() < 0.55 ? "bare" : "covered";
  }
  if (gender === "woman") return Math.random() < 0.55 ? "low_cut" : "covered";
  return Math.random() < 0.35 ? "bare" : "covered";
}

export function resolveRecipe(filters: CastFilters = {}): CastRecipe {
  const heat = resolveHeat(filters.heat);
  const gender = resolveGender(filters.gender);
  const ageBand = !isBlank(filters.ageBand) ? filters.ageBand! : pick(AGE_BANDS);
  const style = resolveStyle(filters.style);
  const focus = resolveFocus(filters.focus);
  const filthyMode =
    style === "filthy"
      ? filters.filthyMode && (FILTHY as readonly string[]).includes(filters.filthyMode)
        ? (filters.filthyMode as FilthyMode)
        : pick(FILTHY)
      : null;

  const outfit = !isBlank(filters.outfit)
    ? filters.outfit!
    : pick(clothesFor(gender, heat));

  let chest = !isBlank(filters.chest) ? filters.chest! : chestFor(gender, heat, outfit);
  if (heat === "clean") chest = "covered";

  return {
    heat,
    gender,
    ageBand,
    ethnicity: !isBlank(filters.ethnicity) ? filters.ethnicity! : pick(chipIds(LOOK_CHIPS)),
    bodyType: !isBlank(filters.bodyType) ? filters.bodyType! : pick(chipIds(BODY_CHIPS)),
    height: !isBlank(filters.height) ? filters.height! : pick(chipIds(HEIGHT_CHIPS)),
    hair: !isBlank(filters.hair) ? filters.hair! : pick(hairFor(gender)),
    hairColor: !isBlank(filters.hairColor) ? filters.hairColor! : pick(chipIds(HAIR_COLOR_CHIPS)),
    expression: !isBlank(filters.expression) ? filters.expression! : pick(chipIds(EXPRESSION_CHIPS)),
    camera: !isBlank(filters.camera) ? filters.camera! : pick(chipIds(CAMERA_CHIPS)),
    pose: !isBlank(filters.pose) ? filters.pose! : pick(chipIds(POSE_CHIPS)),
    setting: !isBlank(filters.setting) ? filters.setting! : pick(chipIds(PLACE_CHIPS)),
    outfit,
    chest,
    faceShape: !isBlank(filters.faceShape) ? filters.faceShape! : pick(chipIds(FACE_SHAPE_CHIPS)),
    nose: !isBlank(filters.nose) ? filters.nose! : pick(NOSES),
    eyes: !isBlank(filters.eyes) ? filters.eyes! : pick(EYES),
    brows: !isBlank(filters.brows) ? filters.brows! : pick(BROWS),
    lips: !isBlank(filters.lips) ? filters.lips! : pick(LIPS),
    skin: !isBlank(filters.skin) ? filters.skin! : pick(SKINS),
    mark: !isBlank(filters.mark) ? filters.mark! : pick(chipIds(MARK_CHIPS)),
    style,
    focus,
    filthyMode,
    uniq: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function buildImagePrompt(recipe: CastRecipe) {
  const genderLock =
    recipe.gender === "woman"
      ? "adult woman, clearly female presentation"
      : "adult man, clearly male presentation";

  const ageLock = AGE_LOCK[recipe.ageBand] || `appearing ${recipe.ageBand} years old`;
  const camera = CAMERA_LANG[recipe.camera] || "amateur phone photo, natural candid style";
  const pose = POSE_LANG[recipe.pose] || "natural casual pose";

  let chest = "";
  if (recipe.gender === "woman" && CHEST_LANG[recipe.chest]) {
    chest = CHEST_LANG[recipe.chest] + ",";
  } else if (recipe.gender === "man" && recipe.chest === "bare") {
    chest = "shirtless, bare chest visible,";
  }

  const focusHint =
    recipe.pose === "back_ass" || recipe.focus === "ass"
      ? "composition emphasizes lower body and ass,"
      : recipe.focus === "tits"
        ? "composition emphasizes chest and torso,"
        : recipe.focus === "face"
          ? "face is the clear primary subject,"
          : "";

  const heatLine =
    recipe.heat === "filthy"
      ? "intimate amateur photograph of a consenting adult, editorial boudoir heat, gallery figure-study energy if the clothes allow it, analog film grain, not pornography, not a studio porn set, no sex act,"
      : recipe.heat === "spicy"
        ? "attractive amateur photo with some heat, still looks like a real person's camera roll, magazine-safe,"
        : "fully clothed everyday amateur photo, nothing explicit,";

  const avoid =
    "Avoid: child, teen, underage, loli, cartoon, hentai, studio pornography, sex act, penetration, extra people, watermark, text overlay, deformed hands, plastic skin."

  return [
    "Photorealistic amateur smartphone photo of one real unique person.",
    genderLock + ",",
    `of ${recipe.ethnicity} appearance,`,
    ageLock + ",",
    `Face identity (follow exactly, do not beautify into a generic model): ${recipe.faceShape}, ${recipe.nose}, ${recipe.eyes}, ${recipe.brows}, ${recipe.lips}, ${recipe.skin}, ${recipe.mark}.`,
    "Asymmetry is good. Distinct bone structure. This person must NOT look like a repeated Instagram face, stock model, or previous generation.",
    `${recipe.hairColor}, ${recipe.hair},`,
    `${recipe.height}, ${recipe.bodyType} body,`,
    `${recipe.expression},`,
    `wearing ${recipe.outfit},`,
    chest,
    recipe.setting + ",",
    camera + ",",
    pose + ",",
    focusHint,
    heatLine,
    `variation seed ${recipe.uniq},`,
    "shot on a real smartphone, natural skin texture, visible pores, slight noise, imperfect framing,",
    "no beauty filter, no airbrush, no studio lighting, no fashion catalog, no text, no watermark, not AI-looking.",
    avoid,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function mintUsername(gender: CastGender) {
  const first = pick(gender === "man" ? FIRST_M : FIRST_W);
  const last = pick(LAST);
  const n = randInt(2, 98);
  const yearBit =
    Math.random() < 0.55 ? String(randInt(88, 99)) : String(randInt(0, 4)).padStart(2, "0");
  const mode = Math.random();

  if (mode < 0.16) return `${first}${last}`;
  if (mode < 0.3) return `${first}.${last[0]}`;
  if (mode < 0.42) return `${first}_${last}`;
  if (mode < 0.52) return `${first}${n}`;
  if (mode < 0.6) return `${first}${yearBit}`;
  if (mode < 0.7) return `${first}.${pick(HANDLE_BITS)}`;
  if (mode < 0.8) return pick(HUMAN_COMPOUNDS);
  if (mode < 0.88) return `${pick(HUMAN_COMPOUNDS)}${randInt(1, 9)}`;
  if (mode < 0.94) return `${first}${pick(LAST).slice(0, 3)}`;
  return `${first}${last}${randInt(1, 7)}`;
}

export async function uniqueHumanUsername(gender: CastGender) {
  const supabase = createServiceClient();
  for (let i = 0; i < 40; i++) {
    const candidate = mintUsername(gender).replace(/[^a-z0-9._]/g, "");
    if (candidate.length < 4 || candidate.length > 18) continue;
    if (BLOCKED.test(candidate)) continue;
    const taken = await isUsernameTaken(supabase, candidate);
    if (!taken) return candidate;
  }
  return `k${Date.now().toString(36).slice(-6)}${randInt(10, 99)}`;
}

export function rollVotes() {
  const roll = Math.random();
  if (roll < 0.16) {
    return { likes: randInt(0, 3), dislikes: randInt(0, 2) };
  }
  if (roll < 0.44) {
    return { likes: randInt(4, 17), dislikes: randInt(0, 6) };
  }
  if (roll < 0.7) {
    return { likes: randInt(18, 58), dislikes: randInt(1, 11) };
  }
  if (roll < 0.88) {
    const likes = randInt(8, 36);
    return { likes, dislikes: randInt(Math.max(3, Math.floor(likes * 0.35)), likes + 8) };
  }
  return { likes: randInt(64, 168), dislikes: randInt(4, 26) };
}

export function parseScoreVerdict(raw: string) {
  let score = 5.0;
  let verdict = raw;
  const scoreMatch = raw.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
  if (scoreMatch) {
    score = Math.min(10, Math.max(1, parseFloat(scoreMatch[1])));
    verdict = raw.replace(/SCORE:\s*\d+(?:\.\d+)?/i, "").trim();
  }
  return { verdict, score };
}

function isModeration(status: number, text: string) {
  const low = text.toLowerCase();
  return (
    low.includes("moderat") ||
    low.includes("violat") ||
    low.includes("safety") ||
    low.includes("content policy") ||
    (status === 400 && low.includes("request was rejected"))
  );
}

function artisticFallback(prompt: string) {
  const cleaned = prompt
    .replace(/\bnipple\w*\b/gi, "")
    .replace(/\bnude\b/gi, "implied figure")
    .replace(/tasteful boudoir[^,]*/gi, "tasteful boudoir, strategic shadow over the chest")
    .replace(/hips lifted[^,]*/gi, "on the bed looking back over the shoulder")
    .replace(/on all fours[^,]*/gi, "kneeling on the bed")
    .replace(/knees apart[^,]*/gi, "sitting on the bed, relaxed")
    .replace(/bent forward[^,]*/gi, "standing, looking back");
  return `${cleaned} STRICT: implied nudity only, museum lighting, no explicit anatomy, no pornography, adult 25 or older, one person, amateur iPhone photo.`;
}

export async function generateSelfieImage(prompt: string): Promise<{ b64: string; dataUrl: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing on Vercel");

  const models = ["grok-imagine-image-2.0", "grok-imagine-image"];
  const errors: string[] = [];
  const attempts = [prompt, artisticFallback(prompt)];

  for (const attempt of attempts) {
    for (const model of models) {
      const payload: Record<string, unknown> = {
        model,
        prompt: attempt,
        n: 1,
        resolution: "1k",
        aspect_ratio: "3:4",
        response_format: "b64_json",
      };
      if (model.includes("2.0")) payload.quality = "medium";
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        errors.push(`${model}: ${res.status} ${text.slice(0, 180)}`);
        if (isModeration(res.status, text)) break;
        continue;
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        errors.push(`${model}: bad json`);
        continue;
      }
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) {
        errors.push(`${model}: empty b64 payload`);
        continue;
      }

      return { b64, dataUrl: `data:image/jpeg;base64,${b64}` };
    }
  }

  throw new Error(`IMAGE_GEN_FAILED: ${errors.join(" | ")}`);
}

export async function uploadJudgmentImage(userId: string, b64: string): Promise<string> {
  const supabase = createServiceClient();
  const bytes = Buffer.from(b64, "base64");
  const path = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage.from("judgment-images").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(
      `STORAGE_FAILED: ${error.message}. Create public bucket "judgment-images" in Supabase Storage.`
    );
  }

  const { data } = supabase.storage.from("judgment-images").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("STORAGE_FAILED: no public URL returned");
  return data.publicUrl;
}

export async function visionJudge(opts: {
  style: string;
  focus: string;
  filthyMode?: string | null;
  imageDataUrl: string;
}) {
  const apiKey = process.env.XAI_API_KEY!;
  let system = STYLE_PROMPTS[opts.style] || STYLE_PROMPTS.unhinged;
  if (opts.style === "filthy" && opts.filthyMode && FILTHY_SUB[opts.filthyMode]) {
    system += " " + FILTHY_SUB[opts.filthyMode];
  }
  system +=
    " Always end your response with a score on a new line in this exact format: SCORE: X.X (1.0 to 10.0). Match the score to how positive or negative the judgment is. Never say there is no photo. Do not refuse adult or suggestive photos of adults.";

  const textPrompt = `Focus: ${FOCUS_HINTS[opts.focus] || FOCUS_HINTS.overall}\n\nJudge the person in this photo. Keep it short and human.`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.3",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: opts.imageDataUrl } },
            { type: "text", text: textPrompt },
          ],
        },
      ],
      temperature: 1.05,
      max_tokens: 180,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`VISION_FAILED: ${res.status} ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("VISION_FAILED: empty model response");
  return parseScoreVerdict(raw);
}

export async function removeStorageUrl(
  supabase: ReturnType<typeof createServiceClient>,
  imageUrl: string | null
) {
  if (!imageUrl) return;
  try {
    const marker = `/judgment-images/`;
    const idx = imageUrl.indexOf(marker);
    if (idx !== -1) {
      const path = imageUrl.slice(idx + marker.length);
      await supabase.storage.from("judgment-images").remove([path]);
    }
  } catch {
    // best effort
  }
}

export function heatToJudgmentHeat(heat: CastHeat) {
  if (heat === "clean") return "tame";
  if (heat === "spicy") return "spicy";
  return "filthy";
}

export async function createHouseAccount(recipe: CastRecipe) {
  const supabase = createServiceClient();
  const username = await uniqueHumanUsername(recipe.gender);
  const email = `house+${username.replace(/[^a-z0-9]/gi, "")}${Date.now().toString(36).slice(-4)}@thievnsden.internal`;
  const password = `House!${Math.random().toString(36).slice(2)}A1`;

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, is_demo: true },
    app_metadata: { is_demo: true },
  });

  if (createErr || !created.user) {
    throw new Error(`AUTH_FAILED: ${createErr?.message || "could not create house account"}`);
  }

  const userId = created.user.id;

  try {
    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        username,
        display_name: username,
        is_demo: true,
      },
      { onConflict: "id" }
    );
    if (profileErr) throw new Error(`PROFILE_FAILED: ${profileErr.message}`);
    await claimUsername(supabase, username, userId, "cast");
    return { supabase, userId, username };
  } catch (err) {
    try {
      await supabase.from("profiles").delete().eq("id", userId);
    } catch {
      // ignore
    }
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // ignore
    }
    throw err;
  }
}

export async function insertCastJudgment(opts: {
  userId: string;
  recipe: CastRecipe;
  imageUrl: string;
  verdict: string;
  score: number;
  makePublic: boolean;
}) {
  const supabase = createServiceClient();
  const rarity = getRarity(opts.score).name;
  const votes = rollVotes();

  const { data: judgment, error } = await supabase
    .from("judgments")
    .insert({
      user_id: opts.userId,
      style: opts.recipe.style,
      focus: opts.recipe.focus,
      filthy_mode: opts.recipe.filthyMode,
      score: opts.score,
      rarity,
      verdict: opts.verdict,
      image_url: opts.imageUrl,
      is_public: opts.makePublic,
      is_demo: true,
      likes: votes.likes,
      dislikes: votes.dislikes,
      heat: heatToJudgmentHeat(opts.recipe.heat),
      cast_recipe: opts.recipe,
    })
    .select()
    .single();

  if (error) throw new Error(`INSERT_FAILED: ${error.message}`);
  if (!judgment?.image_url) throw new Error("INSERT_FAILED: judgment saved without image_url");
  return judgment;
}

export function filtersFromBody(custom: Record<string, unknown> | undefined): CastFilters {
  if (!custom) return {};
  const filters: CastFilters = {};
  for (const key of CAST_FILTER_KEYS) {
    const value = custom[key];
    if (value !== undefined && value !== null && value !== "" && value !== "random") {
      (filters as Record<string, unknown>)[key] = value;
    }
  }
  return filters;
}
