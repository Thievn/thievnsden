import type { WyrHeat, WyrLean, WyrPack, WyrPair } from "@/lib/wyr-data";

const HEATS: WyrHeat[] = ["clean", "spicy", "nasty"];
const PACKS: WyrPack[] = [
  "bodies",
  "reputation",
  "money",
  "love",
  "celebs",
  "people",
  "internet",
];

export const DEFAULT_LEAN: WyrLean = { appetite: 1, image: 1, stay: 1 };

function leanOf(raw: unknown): WyrLean {
  const o = (raw || {}) as Record<string, unknown>;
  const n = (v: unknown) => Math.min(2, Math.max(0, Number(v) || 0));
  return {
    appetite: n(o.appetite),
    image: n(o.image),
    stay: n(o.stay),
  };
}

export function rowToPair(row: any): WyrPair | null {
  if (!row?.id || !row?.a || !row?.b) return null;
  const heat = HEATS.includes(row.heat) ? row.heat : "spicy";
  const packs = (Array.isArray(row.packs) ? row.packs : []).filter((p: string) =>
    PACKS.includes(p as WyrPack)
  ) as WyrPack[];
  return {
    id: String(row.id),
    a: String(row.a),
    b: String(row.b),
    heat,
    packs: packs.length ? packs : ["people"],
    aLean: leanOf(row.a_lean),
    bLean: leanOf(row.b_lean),
  };
}

export function pairToRow(p: WyrPair) {
  return {
    id: p.id,
    a: p.a,
    b: p.b,
    heat: p.heat,
    packs: p.packs,
    a_lean: p.aLean,
    b_lean: p.bLean,
    active: true,
    updated_at: new Date().toISOString(),
  };
}
