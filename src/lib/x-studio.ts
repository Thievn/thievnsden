import type { XRecipe } from "./x-thoughts";
import { emptyXRecipe } from "./x-thoughts";

export type StudioKind = "thought" | "art" | "quote" | "mixed";
export type StudioStatus = "draft" | "queued" | "sent" | "failed" | "skipped";
export type CadenceMode = "review" | "auto";

export const STUDIO_KINDS: { id: StudioKind; label: string; line: string }[] = [
  { id: "thought", label: "Thought", line: "Text." },
  { id: "art", label: "Art", line: "Image + a short line." },
  { id: "quote", label: "Quote-ready", line: "Text. Image only if you add one." },
  { id: "mixed", label: "Mixed", line: "Studio picks from the types you left on." },
];

export const STUDIO_LOOKS = [
  { id: "still", label: "Still", line: "quiet still photograph, no text in the image" },
  { id: "cinematic", label: "Cinematic", line: "cinematic still, anamorphic haze, no text in the image" },
  { id: "parody", label: "Parody", line: "deadpan parody tableau, satirical, no readable text or logos" },
  { id: "portrait", label: "Clean portrait", line: "clean adult portrait, simple backdrop, no text in the image" },
] as const;

export const STUDIO_ASPECTS = ["16:9", "1:1", "4:5", "9:16"] as const;
export type StudioAspect = (typeof STUDIO_ASPECTS)[number];

export const DAY_IDS = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
] as const;

export type Cadence = {
  types: StudioKind[];
  per_day: number;
  days: number[];
  times: string[];
  timezone: string;
  mode: CadenceMode;
  paused: boolean;
  recipe: XRecipe;
};

export type StudioSettings = {
  timezone: string;
  spend_cap: number | null;
  zernio_account_id: string;
  has_key: boolean;
  key_hint: string;
  cadence: Cadence;
};

export function defaultCadence(): Cadence {
  return {
    types: ["thought", "art", "quote", "mixed"],
    per_day: 2,
    days: [0, 1, 2, 3, 4, 5, 6],
    times: ["11:00", "19:00"],
    timezone: "America/New_York",
    mode: "review",
    paused: false,
    recipe: emptyXRecipe(),
  };
}

export function parseCadence(raw: unknown): Cadence {
  const base = defaultCadence();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const types = Array.isArray(o.types)
    ? (o.types.filter((t) => STUDIO_KINDS.some((k) => k.id === t)) as StudioKind[])
    : base.types;
  const times = Array.isArray(o.times)
    ? o.times.map(String).filter((t) => /^\d{1,2}:\d{2}$/.test(t)).slice(0, 3)
    : base.times;
  const days = Array.isArray(o.days)
    ? o.days.map(Number).filter((d) => d >= 0 && d <= 6)
    : base.days;
  return {
    types: types.length ? types : base.types,
    per_day: Math.min(4, Math.max(1, Number(o.per_day) || 2)),
    days: days.length ? days : base.days,
    times: times.length ? times : base.times,
    timezone: String(o.timezone || base.timezone),
    mode: o.mode === "auto" ? "auto" : "review",
    paused: o.paused === true,
    recipe: { ...emptyXRecipe(), ...(typeof o.recipe === "object" && o.recipe ? o.recipe : {}) },
  };
}

export function hasRawUrl(text: string) {
  return /https?:\/\/\S+/i.test(text);
}

export function wantsArt(kind: StudioKind, enabled: StudioKind[], slotIndex: number) {
  let pick: StudioKind = kind;
  if (kind === "mixed") {
    const pool = enabled.filter((k) => k !== "mixed");
    pick = pool[slotIndex % Math.max(1, pool.length)] || "thought";
  }
  return pick === "art";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function wallParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") bag[p.type] = p.value;
  }
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(bag.weekday || "Mon");
  return {
    y: Number(bag.year),
    m: Number(bag.month),
    d: Number(bag.day),
    h: Number(bag.hour),
    min: Number(bag.minute),
    weekday: weekday < 0 ? 1 : weekday,
    stamp: `${bag.year}-${bag.month}-${bag.day}`,
  };
}

export function slotDate(stamp: string, hm: string, tz: string) {
  const [y, mo, d] = stamp.split("-").map(Number);
  const [hh, mm] = hm.split(":").map(Number);
  let lo = Date.UTC(y, mo - 1, d - 1, 0, 0, 0);
  let hi = Date.UTC(y, mo - 1, d + 1, 23, 59, 0);
  for (let i = 0; i < 48; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const w = wallParts(new Date(mid), tz);
    const cmp = w.y !== y ? w.y - y : w.m !== mo ? w.m - mo : w.d !== d ? w.d - d : w.h !== hh ? w.h - hh : w.min - mm;
    if (cmp === 0) return new Date(mid);
    if (cmp < 0) lo = mid + 30000;
    else hi = mid - 30000;
    if (hi < lo) break;
  }
  return new Date(lo);
}

export type UpcomingSlot = {
  at: string;
  stamp: string;
  time: string;
  index: number;
};

export function upcomingSlots(cadence: Cadence, from = new Date(), count = 12): UpcomingSlot[] {
  const out: UpcomingSlot[] = [];
  const times = cadence.times.slice(0, cadence.per_day);
  if (!times.length || !cadence.days.length) return out;
  const seen = new Set<string>();
  let cursor = from;
  for (let n = 0; n < 28 && out.length < count; n++) {
    const w = wallParts(cursor, cadence.timezone);
    if (cadence.days.includes(w.weekday) && !seen.has(w.stamp)) {
      seen.add(w.stamp);
      for (let i = 0; i < times.length && out.length < count; i++) {
        const at = slotDate(w.stamp, times[i], cadence.timezone);
        if (at.getTime() >= from.getTime() - 20000) {
          out.push({ at: at.toISOString(), stamp: w.stamp, time: times[i], index: i });
        }
      }
    }
    cursor = new Date(slotDate(w.stamp, "12:00", cadence.timezone).getTime() + 36 * 3600000);
  }
  return out.slice(0, count);
}

export function zernioScheduleStamp(iso: string, tz: string) {
  const w = wallParts(new Date(iso), tz);
  return `${w.y}-${pad(w.m)}-${pad(w.d)}T${pad(w.h)}:${pad(w.min)}:00`;
}

export function maskKey(key: string) {
  const k = key.trim();
  if (!k) return "";
  if (k.length < 8) return "••••";
  return `••••${k.slice(-4)}`;
}
