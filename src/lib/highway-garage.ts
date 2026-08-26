export type HighwayGarage = {
  scrap: number;
  rebirths: number;
  hull: number;
  cannons: number;
  turbo: number;
  mag: number;
  coolant: number;
};

export const EMPTY_GARAGE: HighwayGarage = {
  scrap: 0,
  rebirths: 0,
  hull: 0,
  cannons: 0,
  turbo: 0,
  mag: 0,
  coolant: 0,
};

export const UPGRADE_KEYS = ["hull", "cannons", "turbo", "mag", "coolant"] as const;
export type UpgradeKey = (typeof UPGRADE_KEYS)[number];

export const UPGRADE_META: Record<UpgradeKey, { label: string; line: string }> = {
  hull: { label: "Hull", line: "Extra armor plates." },
  cannons: { label: "Cannons", line: "Heavier shots." },
  turbo: { label: "Turbo", line: "Steer and sprint harder." },
  mag: { label: "Mag", line: "Kits pull toward the coupe." },
  coolant: { label: "Coolant", line: "Faster trigger." },
};

export const UPGRADE_MAX = 5;

export function upgradeCost(key: UpgradeKey, level: number) {
  const base = { hull: 220, cannons: 260, turbo: 200, mag: 160, coolant: 240 }[key];
  return base * (level + 1);
}

export function rebirthCost(g: HighwayGarage) {
  return 2800 + g.rebirths * 900;
}

export function scrapFromRun(score: number, rebirths: number) {
  return Math.max(8, Math.floor((score / 9) * (1 + rebirths * 0.12)));
}
