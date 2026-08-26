/** Client-safe Cast creator options. Prompt guts live in demo-cast.ts (server). */

export type CastHeat = "clean" | "spicy" | "filthy";
export type CastHeatChoice = "random" | CastHeat;
export type CastGender = "woman" | "man";

export type Chip = {
  id: string;
  label: string;
  desc?: string;
  emoji?: string;
  wash?: string;
};

export const HEAT_CHIPS: Chip[] = [
  {
    id: "random",
    label: "Randomize",
    desc: "Mix clean, spicy, and filthy.",
    emoji: "🎲",
    wash: "from-neutral-800/70 to-black/50",
  },
  {
    id: "clean",
    label: "Clean",
    desc: "Everyday clothes. Looks like real people.",
    emoji: "👕",
    wash: "from-sky-950/50 to-black/40",
  },
  {
    id: "spicy",
    label: "Spicy",
    desc: "Fitted, going-out, bikini, a little heat.",
    emoji: "🌶️",
    wash: "from-rose-900/50 to-black/40",
  },
  {
    id: "filthy",
    label: "Filthy",
    desc: "Lingerie, boudoir, implied heat. Artistic, not a porn set.",
    emoji: "🔥",
    wash: "from-red-900/55 to-purple-950/40",
  },
];

export const GENDER_CHIPS: Chip[] = [
  { id: "random", label: "Either", emoji: "✦" },
  { id: "woman", label: "Women", emoji: "♀" },
  { id: "man", label: "Men", emoji: "♂" },
];

export const AGE_CHIPS: Chip[] = [
  { id: "random", label: "Any age" },
  { id: "18-20", label: "18–20" },
  { id: "21-24", label: "21–24" },
  { id: "25-29", label: "25–29" },
  { id: "30-34", label: "30–34" },
  { id: "35-39", label: "35–39" },
  { id: "40-44", label: "40–44" },
  { id: "45-50", label: "45–50" },
];

export const LOOK_CHIPS: Chip[] = [
  { id: "random", label: "Any look" },
  { id: "white / northern european", label: "N. European" },
  { id: "white / southern european", label: "S. European" },
  { id: "black / west african descent", label: "West African" },
  { id: "black / east african descent", label: "East African" },
  { id: "black / caribbean", label: "Caribbean" },
  { id: "latina / mexican", label: "Mexican" },
  { id: "latina / brazilian", label: "Brazilian" },
  { id: "latina / caribbean hispanic", label: "Caribbean Latina" },
  { id: "east asian / korean", label: "Korean" },
  { id: "east asian / chinese", label: "Chinese" },
  { id: "east asian / japanese", label: "Japanese" },
  { id: "southeast asian / filipino", label: "Filipino" },
  { id: "southeast asian / vietnamese", label: "Vietnamese" },
  { id: "south asian / indian", label: "Indian" },
  { id: "south asian / pakistani", label: "Pakistani" },
  { id: "middle eastern / lebanese", label: "Lebanese" },
  { id: "middle eastern / persian", label: "Persian" },
  { id: "north african / moroccan", label: "Moroccan" },
  { id: "mixed black and white", label: "Black/White mix" },
  { id: "mixed latina and white", label: "Latina/White mix" },
  { id: "mixed asian and white", label: "Asian/White mix" },
  { id: "pacific islander", label: "Pacific Islander" },
  { id: "indigenous american", label: "Indigenous" },
];

export const BODY_CHIPS: Chip[] = [
  { id: "random", label: "Any body" },
  { id: "slim and narrow", label: "Slim" },
  { id: "lean athletic", label: "Athletic" },
  { id: "soft average", label: "Soft" },
  { id: "curvy hourglass", label: "Hourglass" },
  { id: "thick and heavy in the hips", label: "Thick" },
  { id: "pear-shaped, heavier lower body", label: "Pear" },
  { id: "stocky and compact", label: "Stocky" },
  { id: "broad-shouldered", label: "Broad" },
  { id: "dad-bod soft midsection", label: "Dad bod" },
  { id: "very tall and lanky", label: "Lanky" },
  { id: "short and compact", label: "Petite" },
  { id: "muscular gym body", label: "Gym" },
  { id: "plus-size, real weight in the midsection", label: "Plus" },
];

export const HEIGHT_CHIPS: Chip[] = [
  { id: "random", label: "Any height" },
  { id: "short, around 5'2\"", label: "Short" },
  { id: "a little under average height", label: "Under avg" },
  { id: "average height", label: "Average" },
  { id: "a little taller than average", label: "Tall-ish" },
  { id: "tall, around 6'1\"", label: "Tall" },
];

export const HAIR_WOMAN: Chip[] = [
  { id: "random", label: "Any hair" },
  { id: "long straight hair past the shoulders", label: "Long straight" },
  { id: "long loose waves", label: "Waves" },
  { id: "big natural curls", label: "Curls" },
  { id: "tight coils / afro texture", label: "Coils" },
  { id: "shoulder-length blunt cut", label: "Blunt" },
  { id: "short pixie cut", label: "Pixie" },
  { id: "lob / chin-length bob", label: "Bob" },
  { id: "high ponytail", label: "Ponytail" },
  { id: "messy bun with flyaways", label: "Messy bun" },
  { id: "braids / box braids", label: "Braids" },
  { id: "slicked-back wet look", label: "Slick" },
  { id: "curtain bangs, medium length", label: "Bangs" },
  { id: "bed hair, unbrushed", label: "Bed hair" },
];

export const HAIR_MAN: Chip[] = [
  { id: "random", label: "Any hair" },
  { id: "short faded sides, textured top", label: "Fade" },
  { id: "buzz cut", label: "Buzz" },
  { id: "medium length, pushed back", label: "Pushed back" },
  { id: "curly on top, short sides", label: "Curly top" },
  { id: "long-ish hair to the jaw", label: "Long-ish" },
  { id: "slicked back with product", label: "Slick" },
  { id: "messy bed hair", label: "Messy" },
  { id: "receding hairline, kept short", label: "Receding" },
  { id: "bald / shaved head", label: "Bald" },
  { id: "beard with short hair", label: "Beard" },
  { id: "stubble, unkempt", label: "Stubble" },
  { id: "man bun, not trendy-perfect", label: "Man bun" },
];

export const HAIR_COLOR_CHIPS: Chip[] = [
  { id: "random", label: "Any color" },
  { id: "jet black hair", label: "Black" },
  { id: "dark brown hair", label: "Dark brown" },
  { id: "chestnut brown hair", label: "Chestnut" },
  { id: "dirty blonde hair", label: "Dirty blonde" },
  { id: "ash blonde hair", label: "Ash blonde" },
  { id: "platinum blonde with dark roots", label: "Platinum" },
  { id: "auburn hair", label: "Auburn" },
  { id: "copper red hair", label: "Copper" },
  { id: "salt-and-pepper hair", label: "Salt + pepper" },
  { id: "mostly grey hair", label: "Grey" },
  { id: "dark hair with a faded color at the ends", label: "Faded ends" },
];

export const EXPRESSION_CHIPS: Chip[] = [
  { id: "random", label: "Any face" },
  { id: "neutral, almost bored", label: "Bored" },
  { id: "soft closed-mouth smile", label: "Soft smile" },
  { id: "mid-laugh, teeth showing, not posed", label: "Laughing" },
  { id: "smirk, one corner of the mouth up", label: "Smirk" },
  { id: "confident stare into the lens", label: "Stare" },
  { id: "looking slightly away, candid", label: "Away" },
  { id: "raised eyebrow, unimpressed", label: "Unimpressed" },
  { id: "biting the lower lip slightly", label: "Bite lip" },
  { id: "pout, not cartoonish", label: "Pout" },
  { id: "tired eyes, late night", label: "Tired" },
  { id: "flirty squint", label: "Flirty" },
  { id: "mouth slightly open, caught mid-sentence", label: "Talking" },
];

export const CAMERA_CHIPS: Chip[] = [
  { id: "random", label: "Any camera" },
  { id: "mirror_selfie", label: "Mirror", desc: "They took it" },
  { id: "self_held", label: "Selfie", desc: "Arm's length" },
  { id: "other_person", label: "Someone else", desc: "Candid" },
];

export const POSE_CHIPS: Chip[] = [
  { id: "random", label: "Any pose" },
  { id: "front", label: "Front" },
  { id: "three_quarter", label: "3/4" },
  { id: "side", label: "Profile" },
  { id: "over_shoulder", label: "Over shoulder" },
  { id: "back_ass", label: "Back / ass" },
  { id: "full_body", label: "Full body" },
  { id: "close_face", label: "Close face" },
  { id: "overhead", label: "Overhead" },
  { id: "lying_down", label: "Lying down" },
  { id: "sitting", label: "Sitting" },
  { id: "leaning", label: "Leaning" },
  { id: "on_bed", label: "On the bed" },
  { id: "sprawled", label: "Sprawled" },
  { id: "ass_up", label: "Hips up" },
  { id: "all_fours", label: "All fours" },
  { id: "kneeling_bed", label: "Kneeling" },
  { id: "arched", label: "Arched" },
  { id: "from_behind_bent", label: "Bent, looking back" },
  { id: "knees_apart", label: "Knees apart" },
  { id: "on_side", label: "On her side" },
  { id: "standing_hip", label: "Hip cocked" },
  { id: "legs_up", label: "Legs up" },
];

export const PLACE_CHIPS: Chip[] = [
  { id: "random", label: "Any place" },
  { id: "bedroom, soft warm lamp light, messy sheets in the background", label: "Bedroom lamp" },
  { id: "bedroom, dim evening light, phone flash bounce", label: "Bedroom night" },
  { id: "bathroom mirror, overhead vanity light, toothpaste on the counter", label: "Bathroom" },
  { id: "bathroom, soft window light, fogged mirror edge", label: "Bath window" },
  { id: "car interior at night, dashboard glow, street lights", label: "Car night" },
  { id: "car interior daytime, harsh windshield light", label: "Car day" },
  { id: "standing next to a parked car outside, late afternoon", label: "Parking lot" },
  { id: "beach, natural daylight, wind in hair", label: "Beach" },
  { id: "poolside, bright sun, wet hair", label: "Pool" },
  { id: "gym locker room mirror, fluorescent lights", label: "Gym" },
  { id: "coffee shop window seat, overcast daylight", label: "Cafe" },
  { id: "apartment balcony at night, city lights", label: "Balcony" },
  { id: "hotel room, warm lamps, ugly art on the wall", label: "Hotel" },
  { id: "living room couch, TV glow", label: "Couch" },
  { id: "kitchen, under-cabinet lights, lived-in mess", label: "Kitchen" },
  { id: "club bathroom mirror, neon and flash", label: "Club bathroom" },
  { id: "outdoor night street, sodium lights", label: "Night street" },
  { id: "rooftop golden hour", label: "Rooftop" },
  { id: "apartment stairwell / hallway, cheap overhead light", label: "Hallway" },
  { id: "closet mirror, clothes on the floor", label: "Closet" },
  { id: "office bathroom after work, tired fluorescent", label: "Office bath" },
  { id: "backyard at dusk, string lights", label: "Backyard" },
];

export const CLOTHES_WOMAN: Record<CastHeat, Chip[]> = {
  clean: [
    { id: "oversized hoodie and leggings", label: "Hoodie" },
    { id: "fitted plain t-shirt and jeans", label: "Tee + jeans" },
    { id: "crewneck sweater", label: "Sweater" },
    { id: "sundress, casual not formal", label: "Sundress" },
    { id: "button-up flannel over a tank", label: "Flannel" },
    { id: "work blouse, slightly wrinkled", label: "Work top" },
    { id: "university sweatshirt", label: "Sweatshirt" },
    { id: "simple tank top and shorts", label: "Tank" },
  ],
  spicy: [
    { id: "crop top and low-rise jeans", label: "Crop + jeans" },
    { id: "tight going-out dress", label: "Going-out" },
    { id: "satin camisole", label: "Cami" },
    { id: "workout leggings and sports bra", label: "Gym set" },
    { id: "classic triangle bikini", label: "Triangle bikini" },
    { id: "string bikini, thin straps", label: "String bikini" },
    { id: "high-cut thong bikini", label: "Thong bikini" },
    { id: "wrap bikini, tied at the hip", label: "Wrap bikini" },
    { id: "bandeau bikini", label: "Bandeau" },
    { id: "sporty scoop bikini", label: "Sport bikini" },
    { id: "high-cut one-piece swimsuit", label: "One-piece" },
    { id: "off-shoulder top", label: "Off-shoulder" },
    { id: "club top and mini skirt", label: "Club" },
    { id: "sleep shirt that rides up", label: "Sleep shirt" },
  ],
  filthy: [
    { id: "black lace bra and panty set", label: "Black lace" },
    { id: "red lace garter belt, stockings, matching bra", label: "Red garter" },
    { id: "white sheer teddy, lights through the fabric", label: "Sheer teddy" },
    { id: "strappy black lingerie bodysuit", label: "Strappy body" },
    { id: "emerald satin slip that rides up", label: "Satin slip" },
    { id: "vintage corset and stockings", label: "Corset" },
    { id: "mesh lingerie, bedroom lamp through it", label: "Mesh" },
    { id: "pearl thong and an open silk robe", label: "Robe + pearl" },
    { id: "blush pink babydoll with a bow", label: "Babydoll" },
    { id: "black lace bralette and matching boyshorts", label: "Bralette" },
    { id: "cage bra and high-waist panties", label: "Cage bra" },
    { id: "harness lingerie over a lace bra", label: "Harness" },
    { id: "wet-look vinyl lingerie set", label: "Vinyl" },
    { id: "white lace bodysuit, bridal energy", label: "White lace" },
    { id: "silk kimono hanging open over lingerie", label: "Kimono" },
    { id: "thigh-high stockings and a garter belt", label: "Stockings" },
    { id: "micro string bikini, barely there", label: "Micro bikini" },
    { id: "crochet micro bikini", label: "Crochet bikini" },
    { id: "panties only", label: "Panties" },
    { id: "an unbuttoned shirt with nothing underneath", label: "Open shirt" },
    { id: "towel wrapped after a shower, slipping a little", label: "Towel" },
  ],
};

export const CLOTHES_MAN: Record<CastHeat, Chip[]> = {
  clean: [
    { id: "plain fitted t-shirt", label: "Tee" },
    { id: "hoodie", label: "Hoodie" },
    { id: "button-up shirt, sleeves rolled", label: "Button-up" },
    { id: "henley", label: "Henley" },
    { id: "work polo, a little tired", label: "Polo" },
    { id: "flannel shirt", label: "Flannel" },
    { id: "crewneck sweater", label: "Sweater" },
  ],
  spicy: [
    { id: "tank top, gym arms showing", label: "Tank" },
    { id: "gym shirt, slightly sweaty", label: "Gym shirt" },
    { id: "open jacket over a plain tee", label: "Jacket" },
    { id: "swim trunks, beach", label: "Swim" },
    { id: "low-rise shorts, no shirt", label: "Shorts" },
    { id: "unbuttoned shirt over a bare chest", label: "Open shirt" },
  ],
  filthy: [
    { id: "shirtless in underwear", label: "Underwear" },
    { id: "towel around the waist after a shower", label: "Towel" },
    { id: "sweatpants, no shirt", label: "Sweats" },
    { id: "just boxers, bedroom", label: "Boxers" },
    { id: "unbuttoned jeans, no shirt", label: "Jeans open" },
    { id: "shirtless in bed, sheet at the hips", label: "In bed" },
  ],
};

export const CHEST_CHIPS: Chip[] = [
  { id: "random", label: "Auto" },
  { id: "covered", label: "Covered" },
  { id: "low_cut", label: "Low-cut" },
  { id: "bare", label: "Bare / topless" },
];

export const FACE_SHAPE_CHIPS: Chip[] = [
  { id: "random", label: "Any face" },
  { id: "oval face", label: "Oval" },
  { id: "round face with full cheeks", label: "Round" },
  { id: "long narrow face", label: "Long" },
  { id: "square jaw", label: "Square" },
  { id: "heart-shaped face, wider forehead", label: "Heart" },
  { id: "diamond face, high cheekbones", label: "Diamond" },
  { id: "soft undefined jaw", label: "Soft jaw" },
];

export const MARK_CHIPS: Chip[] = [
  { id: "random", label: "Any mark" },
  { id: "a small mole on one cheek", label: "Cheek mole" },
  { id: "a beauty mark above the lip", label: "Lip mark" },
  { id: "freckles across the nose and cheeks", label: "Freckles" },
  { id: "a faint scar through one eyebrow", label: "Brow scar" },
  { id: "a gap between the front teeth", label: "Gap tooth" },
  { id: "one dimple only", label: "One dimple" },
  { id: "slightly crooked front tooth", label: "Crooked tooth" },
  { id: "dark under-eye circles", label: "Tired eyes" },
  { id: "a bump on the nose bridge", label: "Nose bump" },
  { id: "uneven eyebrows", label: "Uneven brows" },
  { id: "a few closed comedones on the chin", label: "Real skin" },
  { id: "no special mark, just an ordinary face", label: "Plain" },
];

export const STYLE_CHIPS: Chip[] = [
  { id: "random", label: "Any voice" },
  { id: "honest", label: "Honest" },
  { id: "unhinged", label: "Unhinged" },
  { id: "filthy", label: "Filthy" },
  { id: "petty", label: "Petty" },
  { id: "deadpan", label: "Deadpan" },
];

export const FOCUS_CHIPS: Chip[] = [
  { id: "random", label: "Any focus" },
  { id: "overall", label: "Overall" },
  { id: "face", label: "Face" },
  { id: "body", label: "Body" },
  { id: "tits", label: "Tits" },
  { id: "ass", label: "Ass" },
  { id: "vibe", label: "Vibe" },
];

export const FILTHY_CHIPS: Chip[] = [
  { id: "mixed", label: "Mixed" },
  { id: "degrade", label: "Degrade" },
  { id: "worship", label: "Worship" },
];

export type CastDraft = {
  heat: CastHeatChoice;
  gender: "random" | CastGender;
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
  mark: string;
  style: string;
  focus: string;
  filthyMode: string;
};

export const EMPTY_DRAFT: CastDraft = {
  heat: "random",
  gender: "random",
  ageBand: "random",
  ethnicity: "random",
  bodyType: "random",
  height: "random",
  hair: "random",
  hairColor: "random",
  expression: "random",
  camera: "random",
  pose: "random",
  setting: "random",
  outfit: "random",
  chest: "random",
  faceShape: "random",
  mark: "random",
  style: "random",
  focus: "random",
  filthyMode: "mixed",
};

export function hairChipsFor(gender: CastDraft["gender"]): Chip[] {
  if (gender === "man") return HAIR_MAN;
  if (gender === "woman") return HAIR_WOMAN;
  const rest = [
    ...HAIR_WOMAN.filter((h) => h.id !== "random"),
    ...HAIR_MAN.filter((h) => h.id !== "random"),
  ];
  return [{ id: "random", label: "Any hair" }, ...rest];
}

export function clothesChipsFor(
  gender: CastDraft["gender"],
  heat: CastHeatChoice
): Chip[] {
  const genders: CastGender[] =
    gender === "random" ? ["woman", "man"] : [gender];
  const heats: CastHeat[] =
    heat === "random" ? ["clean", "spicy", "filthy"] : [heat];
  const out: Chip[] = [{ id: "random", label: "Any clothes" }];
  const seen = new Set<string>(["random"]);
  for (const g of genders) {
    const pack = g === "man" ? CLOTHES_MAN : CLOTHES_WOMAN;
    for (const h of heats) {
      for (const item of pack[h]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          out.push(item);
        }
      }
    }
  }
  return out;
}

function pickChip(chips: Chip[], avoidRandom = true): string {
  const pool = avoidRandom ? chips.filter((c) => c.id !== "random") : chips;
  const list = pool.length ? pool : chips;
  return list[Math.floor(Math.random() * list.length)].id;
}

export function randomizeCastDraft(partial: Partial<CastDraft> = {}): CastDraft {
  const heat = (partial.heat || pickChip(HEAT_CHIPS)) as CastHeatChoice;
  const gender = (partial.gender || pickChip(GENDER_CHIPS)) as CastDraft["gender"];
  return {
    ...EMPTY_DRAFT,
    heat,
    gender,
    ageBand: pickChip(AGE_CHIPS),
    ethnicity: pickChip(LOOK_CHIPS),
    bodyType: pickChip(BODY_CHIPS),
    height: pickChip(HEIGHT_CHIPS),
    hair: pickChip(hairChipsFor(gender)),
    hairColor: pickChip(HAIR_COLOR_CHIPS),
    expression: pickChip(EXPRESSION_CHIPS),
    camera: pickChip(CAMERA_CHIPS),
    pose: pickChip(POSE_CHIPS),
    setting: pickChip(PLACE_CHIPS),
    outfit: pickChip(clothesChipsFor(gender, heat)),
    chest: heat === "clean" ? "covered" : pickChip(CHEST_CHIPS),
    faceShape: pickChip(FACE_SHAPE_CHIPS),
    mark: pickChip(MARK_CHIPS),
    style: pickChip(STYLE_CHIPS),
    focus: pickChip(FOCUS_CHIPS),
    filthyMode: pickChip(FILTHY_CHIPS, false),
    ...partial,
  };
}

export function draftToFilters(draft: CastDraft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const map: Array<[keyof CastDraft, string]> = [
    ["heat", "heat"],
    ["gender", "gender"],
    ["ageBand", "ageBand"],
    ["ethnicity", "ethnicity"],
    ["bodyType", "bodyType"],
    ["height", "height"],
    ["hair", "hair"],
    ["hairColor", "hairColor"],
    ["expression", "expression"],
    ["camera", "camera"],
    ["pose", "pose"],
    ["setting", "setting"],
    ["outfit", "outfit"],
    ["chest", "chest"],
    ["faceShape", "faceShape"],
    ["mark", "mark"],
    ["style", "style"],
    ["focus", "focus"],
    ["filthyMode", "filthyMode"],
  ];
  for (const [key, dest] of map) {
    const value = draft[key];
    if (value && value !== "random") out[dest] = value;
  }
  if (out.style !== "filthy") delete out.filthyMode;
  return out;
}

export const CAST_PACKS: Array<{
  id: string;
  label: string;
  desc: string;
  preset: string;
}> = [
  { id: "busy_room", label: "Busy room", desc: "10 mixed people", preset: "busy_room" },
  { id: "clean_crowd", label: "Clean crowd", desc: "8 everyday looks", preset: "clean_crowd" },
  { id: "spicy_night", label: "Spicy night", desc: "8 going-out shots", preset: "spicy_night" },
  { id: "filthy_set", label: "Filthy set", desc: "6 borderline NSFW", preset: "filthy_set" },
  { id: "women_mix", label: "Women mix", desc: "6 women, mixed heat", preset: "women_mix" },
  { id: "men_mix", label: "Men mix", desc: "6 men, mixed heat", preset: "men_mix" },
];
