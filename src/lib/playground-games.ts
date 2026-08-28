export type PlaygroundGameId =
  | "face-the-den"
  | "would-you-rather"
  | "highway-hunter"
  | "heat-check"
  | "den-arena";

export type PlaygroundGame = {
  id: PlaygroundGameId;
  href: string;
  title: string;
  tag: string;
  line: string;
  homeLine: string;
  accent: string;
  chip: string;
  homeBorder: string;
  homeKicker: string;
  homeCta: string;
  homeEnter: string;
  disabled?: boolean;
};

export const PLAYGROUND_GAMES: PlaygroundGame[] = [
  {
    id: "face-the-den",
    href: "/playground/face-the-den",
    title: "Face The Den",
    tag: "Live",
    line: "Walk in looking pretty. Leave with notes.",
    homeLine: "Walk in looking pretty. Leave with notes.",
    accent: "from-red-600/20 via-rose-900/10 to-transparent",
    chip: "border-rose-500/40 text-rose-200",
    homeBorder: "border-red-800/40",
    homeKicker: "text-red-300/85",
    homeCta: "text-red-300",
    homeEnter: "Sit for a roast →",
  },
  {
    id: "would-you-rather",
    href: "/playground/would-you-rather",
    title: "Would You Rather",
    tag: "Live",
    line: "Lights on. Ten rounds. Pick a cost.",
    homeLine: "Ten rounds. Two costs. The room splits.",
    accent: "from-violet-600/18 via-fuchsia-900/10 to-transparent",
    chip: "border-violet-500/40 text-violet-200",
    homeBorder: "border-amber-900/40",
    homeKicker: "text-amber-300/85",
    homeCta: "text-amber-300",
    homeEnter: "Lights on →",
  },
  {
    id: "highway-hunter",
    href: "/playground/highway-hunter",
    title: "Highway Hunter",
    tag: "Live",
    line: "Night interstate. Kits. Rebirths. Soft wrecks.",
    homeLine: "Night interstate. Soft wrecks. Preview heat.",
    accent: "from-amber-500/16 via-orange-900/10 to-transparent",
    chip: "border-amber-500/40 text-amber-200",
    homeBorder: "border-orange-900/35",
    homeKicker: "text-orange-300/85",
    homeCta: "text-orange-300",
    homeEnter: "Take the on-ramp →",
  },
  {
    id: "heat-check",
    href: "/playground/heat-check",
    title: "Heat Check",
    tag: "Private",
    line: "Late night. One thread. They stay a person.",
    homeLine: "Late night. One thread. They stay a person.",
    accent: "from-orange-600/20 via-rose-900/12 to-purple-950/20",
    chip: "border-orange-400/45 text-orange-100",
    homeBorder: "border-orange-900/45",
    homeKicker: "text-orange-300/85",
    homeCta: "text-orange-300",
    homeEnter: "Open a thread →",
  },
  {
    id: "den-arena",
    href: "#",
    title: "Den Arena",
    tag: "Soon",
    line: "1v1 later. The lights aren't on yet.",
    homeLine: "1v1 later. The lights aren't on yet.",
    accent: "from-neutral-800/20 to-transparent",
    chip: "border-neutral-800 text-neutral-600",
    homeBorder: "border-neutral-800/60",
    homeKicker: "text-neutral-500",
    homeCta: "text-neutral-600",
    homeEnter: "Not open",
    disabled: true,
  },
];

const SHARED = `Cinematic 16:9 atmospheric background plate for a dark premium arcade card. Photoreal, moody, deep blacks, large empty dark area on the left for overlay text. Soft bokeh, film grain, one accent color only. Not a poster, not a collage, not a UI mock. No readable text, no logos, no watermarks, no bright faces looking at camera, no clutter. Quiet luxury, low contrast haze, edge-to-edge fill.`;

export const PLAYGROUND_ART_PROMPTS: Record<PlaygroundGameId, string> = {
  "face-the-den": `${SHARED} Scene: a crimson velvet judgment booth in near-dark, unfocused vanity bulbs as rose bokeh, a chair silhouette facing away, faint smoke, analog film. Accent: blood rose.`,
  "would-you-rather": `${SHARED} Scene: empty late-night game-show floor split by two pools of light, violet left and amber right, glossy black stage, no host, no crowd. Accent: split neon.`,
  "highway-hunter": `${SHARED} Scene: wet night interstate from a low hood angle, orange sodium lamps, rain streaks, distant headlights as bokeh, empty road. Accent: sodium orange.`,
  "heat-check": `${SHARED} Scene: late-night luxury phone face-down on black marble, ember coals, crimson-purple rim light, no readable chat, keyhole den. Accent: ember.`,
  "den-arena": `${SHARED} Scene: unused circular pit in a dark den, one cold spotlight on dust, empty ropes in shadow, waiting. Accent: cool steel.`,
};

export type PlaygroundArtEntry = {
  url: string;
  prompt?: string;
  updated_at?: string;
};

export type PlaygroundArtMap = Partial<Record<PlaygroundGameId, PlaygroundArtEntry>>;

export function artUrlMap(art: PlaygroundArtMap | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!art) return out;
  for (const game of PLAYGROUND_GAMES) {
    const url = art[game.id]?.url;
    if (url) out[game.id] = url;
  }
  return out;
}
