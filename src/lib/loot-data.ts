export type LootItem = {
  id: string;
  name: string;
  category: string;
  short: string;
  review: string;
  link: string;
  status: string;
};

export const LOOT_ITEMS: LootItem[] = [
  {
    id: "corsair-4000d",
    name: "Corsair 4000D Airflow",
    category: "PC Builds",
    short: "The case that stopped me from buying another one.",
    review:
      "Clean layout, actually useful cable management, and the front mesh does its job without looking like a fish tank. I’ve built in worse. If you’re putting a real system together, this is still one of the safer choices.",
    link: "https://www.amazon.com/s?k=Corsair+4000D+Airflow&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "rog-rtx",
    name: "ASUS ROG / NVIDIA RTX",
    category: "PC Builds",
    short: "The reason the rest of the build exists.",
    review:
      "Power hungry, expensive, and still the part that makes everything else worth doing. Whether it’s a Strix or a Founders card, the high-end NVIDIA cards are what actually move the needle.",
    link: "https://www.amazon.com/s?k=ASUS+ROG+Strix+RTX&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "anime-figure-sitting",
    name: "Anime Figure – Sitting Pose",
    category: "Anime / Merch",
    short: "Shelf presence without the usual plastic look.",
    review:
      "Decent sculpt, paint that doesn’t look rushed, and it doesn’t dominate the entire shelf. One of the few figures that still looks intentional after the initial hype fades.",
    link: "https://www.amazon.com/s?k=anime+figure+sitting+statue&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "wireless-headset",
    name: "Wireless Gaming Headset",
    category: "Gaming",
    short: "The one that survived the return cycle.",
    review:
      "Comfortable enough for long sessions, mic that doesn’t sound like a tin can, and battery life that outlasts my patience. Not perfect, but it’s the one that stayed.",
    link: "https://www.amazon.com/s?k=wireless+gaming+headset&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "compact-keyboard",
    name: "60% Mechanical Keyboard",
    category: "Gaming",
    short: "Smaller desk footprint, still satisfying.",
    review:
      "RGB can be turned down or off. The switches feel good and it doesn’t take over half the desk. One of the few keyboards that made it past the rotation.",
    link: "https://www.amazon.com/s?k=60+percent+mechanical+keyboard&tag=thievnsden-20",
    status: "In the Den",
  },
  {
    id: "anime-figure-dual",
    name: "Anime Figure – Dual Character",
    category: "Anime / Merch",
    short: "Two characters, one base, less wasted space.",
    review:
      "Better than average paint work and the poses actually work together. Still a luxury item, but at least it doesn’t feel completely hollow once it’s on the shelf.",
    link: "https://www.amazon.com/s?k=anime+figure+statue+set&tag=thievnsden-20",
    status: "In the Den",
  },
];

export function searchTermFromLink(link: string) {
  try {
    const u = new URL(link);
    return decodeURIComponent(u.searchParams.get("k") || "").replace(/\+/g, " ");
  } catch {
    return "";
  }
}

export function lootCoverPrompt(item: LootItem, extra = "") {
  const term = searchTermFromLink(item.link) || item.name;
  const scene =
    item.category === "PC Builds"
      ? "dark clean desk, dim room, subtle RGB bounce, product hero shot of real computer hardware"
      : item.category === "Gaming"
        ? "dark desk setup, moody practical lighting, real gaming peripheral product photo"
        : "dark collector shelf, warm spot light, real painted figure product photo, no brand watermark";

  return [
    "Photorealistic ecommerce product photograph,",
    `subject: ${item.name}.`,
    `shopper would search: ${term}.`,
    scene + ",",
    "looks like a real Amazon listing photo, sharp, catalog lighting,",
    "single hero object, tasteful crop, 4:3 frame,",
    "no text, no logos overlay, no watermark, no collage, no hands unless needed for scale,",
    extra,
    "adult collector aesthetic, premium, not cartoon, not CGI-plastic unless the object is a figure",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
