export type FloorId = "offices" | "vault" | "docks";
export type LootKind = "cash" | "watch" | "jewelry" | "ember" | "keycard" | "phone";
export type LoadoutId =
  | "quiet-soles"
  | "deep-pockets"
  | "smoke"
  | "second-wind"
  | "fast-hands"
  | "long-lungs";
export type BadgeId = "first-bank" | "greedy" | "ghost" | "dead-phone" | "sub-20";

export const RUN_SECONDS = 60;
export const COMBO_CAP = 4;
export const BAG_SLOW_AT = 3;
export const DEEP_POCKETS_AT = 5;
export const SMOKE_SECONDS = 1.4;
export const POWER_BOX_SECONDS = 4;
export const VENT_SECONDS = 1;
export const STUN_SECONDS = 0.85;
export const CLOCK_SEE_SECONDS = 0.22;
export const CAMERA_WINDUP = 0.32;

export const FLOOR_ORDER: FloorId[] = ["offices", "vault", "docks"];

export const LOOT: Record<
  LootKind,
  { label: string; value: number; common: number; loud?: boolean }
> = {
  cash: { label: "Cash brick", value: 120, common: 1 },
  watch: { label: "Watch", value: 280, common: 0.55 },
  jewelry: { label: "Jewelry", value: 340, common: 0.45 },
  ember: { label: "Ember case", value: 720, common: 0.12, loud: true },
  keycard: { label: "Keycard", value: 0, common: 0 },
  phone: { label: "Dead phone", value: 0, common: 0 },
};

export const LOADOUTS: Record<LoadoutId, { label: string; line: string }> = {
  "quiet-soles": { label: "Quiet soles", line: "One noisy tile. Combo stays." },
  "deep-pockets": { label: "Deep pockets", line: "No bag drag until five." },
  smoke: { label: "Smoke", line: "One puff. Cones go blind 1.4s." },
  "second-wind": { label: "Second wind", line: "First clocked is a warning." },
  "fast-hands": { label: "Fast hands", line: "Grab from a little farther." },
  "long-lungs": { label: "Long lungs", line: "Sneak still moves." },
};

export const ALL_LOADOUTS = Object.keys(LOADOUTS) as LoadoutId[];

export const BADGES: Record<BadgeId, { label: string; mark: string }> = {
  "first-bank": { label: "First Bank", mark: "BK" },
  greedy: { label: "Greedy", mark: "GR" },
  ghost: { label: "Ghost", mark: "GH" },
  "dead-phone": { label: "Dead Phone Club", mark: "PH" },
  "sub-20": { label: "Sub-20", mark: "20" },
};

export const ROASTS = [
  "You treated the bag like it owed you rent.",
  "Clocked like you paid for the spotlight.",
  "Greedy. Embarrassing. Correct.",
  "The grate told on you. Fair.",
  "Extracted like you were late for nothing.",
  "That dead phone was a personality.",
  "You almost made it look professional.",
  "Sixty seconds and you still negotiated with a desk.",
  "The cameras liked you more than the loot did.",
  "Soft fail. Hard cope.",
];

export function lootValue(kind: LootKind): number {
  return LOOT[kind].value;
}

export function bagValue(items: LootKind[]): number {
  return items.reduce((n, k) => n + lootValue(k), 0);
}

export function timeBonus(timeLeft: number, extractedTimes: number): number {
  if (extractedTimes < 1) return 0;
  return Math.max(0, Math.round(timeLeft * 18));
}

export function finalScore(extractedValue: number, comboPeak: number, timeLeft: number, extractedTimes: number) {
  const combo = Math.min(COMBO_CAP, Math.max(1, comboPeak));
  const loot = Math.max(0, extractedValue) * combo;
  const time = timeBonus(timeLeft, extractedTimes);
  return { loot, combo, time, total: loot + time };
}

export function pickFloor(last?: FloorId | null): FloorId {
  const rest = FLOOR_ORDER.filter((id) => id !== last);
  return rest[Math.floor(Math.random() * rest.length)] || "offices";
}

export function pickLoadoutTrio(seed = Math.random()): LoadoutId[] {
  const copy = [...ALL_LOADOUTS];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}

export function roastLine(score: number, clocked: number, phone: boolean, extracted: number): string {
  if (phone) return "That dead phone was a personality.";
  if (clocked === 0 && extracted > 0) return "You almost made it look professional.";
  if (clocked >= 3) return "Clocked like you paid for the spotlight.";
  if (extracted === 0) return "Sixty seconds and you still negotiated with a desk.";
  const i = Math.abs(score + clocked * 17) % ROASTS.length;
  return ROASTS[i];
}

export function earnBadges(opts: {
  extractedTimes: number;
  clocked: number;
  bagPeak: number;
  deadPhoneExtracted: boolean;
  firstExtractElapsed: number | null;
}): BadgeId[] {
  const out: BadgeId[] = [];
  if (opts.extractedTimes >= 1) out.push("first-bank");
  if (opts.bagPeak >= 5 || opts.extractedTimes >= 3) out.push("greedy");
  if (opts.clocked === 0 && opts.extractedTimes >= 1) out.push("ghost");
  if (opts.deadPhoneExtracted) out.push("dead-phone");
  if (opts.firstExtractElapsed !== null && opts.firstExtractElapsed <= 20) out.push("sub-20");
  return out;
}

export function shareText(score: number, roast: string) {
  return `Night Grab · ${score}\n${roast}\nthievnsden.com/playground/night-grab`;
}

export function boardRank(score: number, rows: { score: number }[]): number {
  const better = rows.filter((r) => r.score > score).length;
  return better + 1;
}
