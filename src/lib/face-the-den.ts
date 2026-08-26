/** Face The Den — roast studio constants */

export type Style =
  | "honest"
  | "unhinged"
  | "filthy"
  | "petty"
  | "deadpan"
  | "savage"
  | "velvet"
  | "street"
  | "poetic"
  | "clinical"
  | "witch"
  | "comic";

export type Focus =
  | "overall"
  | "face"
  | "body"
  | "tits"
  | "ass"
  | "vibe"
  | "fit"
  | "pose"
  | "eyes"
  | "mouth"
  | "energy"
  | "presence";

export type Intensity = "soft" | "sharp" | "vicious" | "nuclear";
export type RoastLength = "needle" | "standard" | "essay";
export type Heat = "tame" | "spicy" | "explicit" | "filthy";
export type Angle = "roast" | "hype" | "mixed" | "backhanded";
export type FilthyMode = "degrade" | "worship" | "mixed";
export type Target = "they" | "she" | "he";
export type Stage = "idle" | "setup" | "judging" | "result";

export type Opt = {
  id: string;
  label: string;
  desc?: string;
  emoji?: string;
  wash?: string;
};

export const STYLES: Opt[] = [
  { id: "honest", label: "Honest", desc: "Direct. No theater.", emoji: "🎯", wash: "from-rose-900/50 to-black/40" },
  { id: "unhinged", label: "Unhinged", desc: "No filter. Hits anyway.", emoji: "⚡", wash: "from-red-800/55 to-purple-950/40" },
  { id: "filthy", label: "Filthy", desc: "Explicit. Sexual. Mean or hungry.", emoji: "🔥", wash: "from-rose-800/55 to-red-950/40" },
  { id: "petty", label: "Petty", desc: "Tiny details. Big attitude.", emoji: "💅", wash: "from-fuchsia-900/45 to-black/40" },
  { id: "deadpan", label: "Deadpan", desc: "Ice. Zero performance.", emoji: "🧊", wash: "from-slate-800/50 to-black/40" },
  { id: "savage", label: "Savage", desc: "A super diss. Clean cut.", emoji: "🗡️", wash: "from-red-900/55 to-black/40" },
  { id: "velvet", label: "Velvet", desc: "Pretty words. Ugly intent.", emoji: "🍷", wash: "from-purple-900/50 to-rose-950/40" },
  { id: "street", label: "Street", desc: "Talks like a person, not a bit.", emoji: "🌃", wash: "from-neutral-800/50 to-red-950/30" },
  { id: "poetic", label: "Poetic", desc: "Pretty. Still a knife.", emoji: "🌙", wash: "from-violet-900/45 to-black/40" },
  { id: "clinical", label: "Clinical", desc: "Doctor notes. No bedside.", emoji: "📋", wash: "from-stone-800/45 to-black/40" },
  { id: "witch", label: "Witch", desc: "Hex energy. Occult shade.", emoji: "🕯️", wash: "from-purple-950/55 to-red-950/30" },
  { id: "comic", label: "Comic", desc: "Funny first. Still rude.", emoji: "🎭", wash: "from-amber-900/40 to-rose-950/30" },
];

export const INTENSITIES: Opt[] = [
  { id: "soft", label: "Soft", desc: "Calm. Still honest.", emoji: "🕯️" },
  { id: "sharp", label: "Sharp", desc: "A real cut.", emoji: "✂️" },
  { id: "vicious", label: "Vicious", desc: "Meant to sting.", emoji: "🦂" },
  { id: "nuclear", label: "Nuclear", desc: "Unhinged on purpose.", emoji: "☢️" },
];

export const LENGTHS: Opt[] = [
  { id: "needle", label: "Needle", desc: "One or two lines.", emoji: "🪡" },
  { id: "standard", label: "Standard", desc: "A proper paragraph.", emoji: "📝" },
  { id: "essay", label: "Essay", desc: "Let it run.", emoji: "📖" },
];

export const HEATS: Opt[] = [
  { id: "tame", label: "Tame", desc: "Rude without the bedroom.", emoji: "🧥" },
  { id: "spicy", label: "Spicy", desc: "Suggestive. Not graphic.", emoji: "🌶️" },
  { id: "explicit", label: "Explicit", desc: "Adult language. Direct.", emoji: "💋" },
  { id: "filthy", label: "Filthy", desc: "Anything goes.", emoji: "🖤" },
];

export const ANGLES: Opt[] = [
  { id: "roast", label: "Roast me", desc: "A super diss.", emoji: "🔥", wash: "from-red-800/50 to-black/40" },
  { id: "hype", label: "Hype me", desc: "Still specific. Not a pep talk.", emoji: "✨", wash: "from-amber-800/40 to-rose-950/30" },
  { id: "mixed", label: "Mixed", desc: "Cut, then a crumb.", emoji: "⚖️", wash: "from-purple-900/45 to-black/40" },
  { id: "backhanded", label: "Backhanded", desc: "Compliment with a blade.", emoji: "🤝", wash: "from-rose-900/45 to-purple-950/40" },
];

export const FOCUSES: Opt[] = [
  { id: "overall", label: "Overall", emoji: "👤" },
  { id: "face", label: "Face", emoji: "😊" },
  { id: "body", label: "Body", emoji: "💫" },
  { id: "tits", label: "Tits", emoji: "🍒" },
  { id: "ass", label: "Ass", emoji: "🍑" },
  { id: "vibe", label: "Vibe", emoji: "🌡️" },
  { id: "fit", label: "Fit", emoji: "👕" },
  { id: "pose", label: "Pose", emoji: "📸" },
  { id: "eyes", label: "Eyes", emoji: "👁️" },
  { id: "mouth", label: "Mouth", emoji: "👄" },
  { id: "energy", label: "Energy", emoji: "⚡" },
  { id: "presence", label: "Presence", emoji: "👑" },
];

export const FILTHY_MODES: Opt[] = [
  { id: "degrade", label: "Degrade me", desc: "Objectify. Tear down.", emoji: "⛓️" },
  { id: "worship", label: "Worship me", desc: "Hungry. Still filthy.", emoji: "🛐" },
  { id: "mixed", label: "Mixed", desc: "Desire and disrespect.", emoji: "🎲" },
];

export const TARGETS: Opt[] = [
  { id: "they", label: "They", desc: "Neutral" },
  { id: "she", label: "She", desc: "She / her" },
  { id: "he", label: "He", desc: "He / him" },
];

export const VOTE = {
  like: {
    value: 1 as const,
    verb: "Mark",
    noun: "Marks",
    board: "The Marked",
    hint: "This one stays.",
  },
  dislike: {
    value: -1 as const,
    verb: "Cut",
    noun: "Cuts",
    board: "The Cut",
    hint: "This one leaves.",
  },
};

export type DenPreset = {
  id: string;
  label: string;
  blurb: string;
  emoji: string;
  wash: string;
  style: Style;
  intensity: Intensity;
  length: RoastLength;
  heat: Heat;
  angle: Angle;
  focus: Focus;
  filthyMode: FilthyMode;
};

export const PRESETS: DenPreset[] = [
  {
    id: "pit",
    label: "The Pit",
    blurb: "Unhinged roast. No mercy.",
    emoji: "🕳️",
    wash: "from-red-900/40 to-black",
    style: "unhinged",
    intensity: "nuclear",
    length: "standard",
    heat: "explicit",
    angle: "roast",
    focus: "overall",
    filthyMode: "mixed",
  },
  {
    id: "velvet",
    label: "Velvet Knife",
    blurb: "Pretty mouth. Ugly point.",
    emoji: "🍷",
    wash: "from-purple-900/40 to-rose-950/30",
    style: "velvet",
    intensity: "sharp",
    length: "standard",
    heat: "spicy",
    angle: "backhanded",
    focus: "presence",
    filthyMode: "mixed",
  },
  {
    id: "filth",
    label: "Church of Filth",
    blurb: "Explicit. Degrading. Loud.",
    emoji: "🖤",
    wash: "from-rose-950/50 to-black",
    style: "filthy",
    intensity: "vicious",
    length: "standard",
    heat: "filthy",
    angle: "roast",
    focus: "body",
    filthyMode: "degrade",
  },
  {
    id: "sunday",
    label: "Sunday School",
    blurb: "Calm. Honest. Still a read.",
    emoji: "🕊️",
    wash: "from-stone-800/40 to-black",
    style: "honest",
    intensity: "soft",
    length: "standard",
    heat: "tame",
    angle: "mixed",
    focus: "overall",
    filthyMode: "mixed",
  },
  {
    id: "street",
    label: "Street Clock",
    blurb: "Sounds like a person.",
    emoji: "🌃",
    wash: "from-neutral-800/40 to-red-950/20",
    style: "street",
    intensity: "sharp",
    length: "needle",
    heat: "spicy",
    angle: "roast",
    focus: "vibe",
    filthyMode: "mixed",
  },
  {
    id: "cold",
    label: "Cold Read",
    blurb: "Clinical. No bedside manner.",
    emoji: "📋",
    wash: "from-slate-800/40 to-black",
    style: "clinical",
    intensity: "sharp",
    length: "essay",
    heat: "tame",
    angle: "roast",
    focus: "face",
    filthyMode: "mixed",
  },
  {
    id: "hype",
    label: "Hype Machine",
    blurb: "Specific praise. Not a pep talk.",
    emoji: "✨",
    wash: "from-amber-900/35 to-rose-950/25",
    style: "comic",
    intensity: "sharp",
    length: "standard",
    heat: "spicy",
    angle: "hype",
    focus: "overall",
    filthyMode: "worship",
  },
  {
    id: "petty",
    label: "Petty Hours",
    blurb: "One detail. Maximum attitude.",
    emoji: "💅",
    wash: "from-fuchsia-900/35 to-black",
    style: "petty",
    intensity: "vicious",
    length: "needle",
    heat: "spicy",
    angle: "roast",
    focus: "face",
    filthyMode: "mixed",
  },
];

export type RoastDraft = {
  style: Style;
  intensity: Intensity;
  length: RoastLength;
  heat: Heat;
  angle: Angle;
  focus: Focus;
  filthyMode: FilthyMode;
  target: Target;
  note: string;
};

export const EMPTY_DRAFT: RoastDraft = {
  style: "unhinged",
  intensity: "sharp",
  length: "standard",
  heat: "explicit",
  angle: "roast",
  focus: "overall",
  filthyMode: "mixed",
  target: "they",
  note: "",
};

export function applyPreset(draft: RoastDraft, preset: DenPreset): RoastDraft {
  return {
    ...draft,
    style: preset.style,
    intensity: preset.intensity,
    length: preset.length,
    heat: preset.heat,
    angle: preset.angle,
    focus: preset.focus,
    filthyMode: preset.filthyMode,
  };
}

export function surpriseDraft(keep?: Partial<RoastDraft>): RoastDraft {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    style: pick(STYLES).id as Style,
    intensity: pick(INTENSITIES).id as Intensity,
    length: pick(LENGTHS).id as RoastLength,
    heat: pick(HEATS).id as Heat,
    angle: pick(ANGLES).id as Angle,
    focus: pick(FOCUSES).id as Focus,
    filthyMode: pick(FILTHY_MODES).id as FilthyMode,
    target: keep?.target || "they",
    note: "",
  };
}

export function recipeChips(draft: RoastDraft) {
  const find = (list: Opt[], id: string) => list.find((o) => o.id === id)?.label || id;
  const chips = [
    find(STYLES, draft.style),
    find(INTENSITIES, draft.intensity),
    find(ANGLES, draft.angle),
    find(HEATS, draft.heat),
    find(FOCUSES, draft.focus),
    find(LENGTHS, draft.length),
  ];
  if (draft.heat === "filthy" || draft.style === "filthy") {
    chips.push(find(FILTHY_MODES, draft.filthyMode));
  }
  return chips;
}

export function needsFilth(draft: RoastDraft) {
  return draft.style === "filthy" || draft.heat === "filthy" || draft.heat === "explicit";
}

export { getRarity } from "@/lib/rarity";
