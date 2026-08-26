export type RaritySlug =
  | "legendary"
  | "epic"
  | "rare"
  | "uncommon"
  | "common"
  | "trash";

export type Rarity = {
  name: string;
  slug: RaritySlug;
  border: string;
  glow: string;
  text: string;
  bar: string;
  bg: string;
};

const TIERS: Array<{ min: number; rarity: Rarity }> = [
  {
    min: 9.6,
    rarity: {
      name: "Legendary",
      slug: "legendary",
      border: "border-amber-400/90",
      glow: "shadow-[0_0_32px_-4px_rgba(251,191,36,0.5)]",
      text: "text-amber-300",
      bar: "from-amber-500 to-amber-300",
      bg: "from-amber-950/40 via-[#0c0c0c] to-[#0c0c0c]",
    },
  },
  {
    min: 9.0,
    rarity: {
      name: "Epic",
      slug: "epic",
      border: "border-red-500/80",
      glow: "shadow-[0_0_28px_-4px_rgba(239,68,68,0.45)]",
      text: "text-red-300",
      bar: "from-red-500 to-rose-400",
      bg: "from-red-950/40 via-[#0c0c0c] to-[#0c0c0c]",
    },
  },
  {
    min: 8.0,
    rarity: {
      name: "Rare",
      slug: "rare",
      border: "border-rose-500/70",
      glow: "shadow-[0_0_22px_-6px_rgba(225,29,72,0.4)]",
      text: "text-rose-300",
      bar: "from-rose-600 to-pink-400",
      bg: "from-rose-950/35 via-[#0c0c0c] to-[#0c0c0c]",
    },
  },
  {
    min: 6.0,
    rarity: {
      name: "Uncommon",
      slug: "uncommon",
      border: "border-purple-500/60",
      glow: "shadow-[0_0_18px_-6px_rgba(147,51,234,0.35)]",
      text: "text-purple-300",
      bar: "from-purple-600 to-violet-400",
      bg: "from-purple-950/30 via-[#0c0c0c] to-[#0c0c0c]",
    },
  },
  {
    min: 4.0,
    rarity: {
      name: "Common",
      slug: "common",
      border: "border-neutral-500/50",
      glow: "",
      text: "text-neutral-400",
      bar: "from-neutral-500 to-neutral-400",
      bg: "from-neutral-900/40 via-[#0c0c0c] to-[#0c0c0c]",
    },
  },
];

const TRASH: Rarity = {
  name: "Trash",
  slug: "trash",
  border: "border-neutral-700/40",
  glow: "",
  text: "text-neutral-500",
  bar: "from-neutral-700 to-neutral-600",
  bg: "from-neutral-900/20 via-[#0c0c0c] to-[#0c0c0c]",
};

export function getRarity(score: number): Rarity {
  for (const tier of TIERS) {
    if (score >= tier.min) return tier.rarity;
  }
  return TRASH;
}

export function raritySlug(score: number): RaritySlug {
  return getRarity(score).slug;
}
