/** Shared Face The Den constants */
export type Style = "honest" | "unhinged" | "filthy" | "petty" | "deadpan";
export type Focus = "overall" | "face" | "body" | "tits" | "ass" | "vibe";
export type FilthyMode = "degrade" | "worship" | "mixed";
export type Stage = "idle" | "setup" | "judging" | "result";

export const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: "honest", label: "Honest", desc: "Direct and real" },
  { id: "unhinged", label: "Unhinged", desc: "No filter" },
  { id: "filthy", label: "Filthy", desc: "Explicit & sexual" },
  { id: "petty", label: "Petty", desc: "Small and mean" },
  { id: "deadpan", label: "Deadpan", desc: "Cold and flat" },
];

export const FOCUSES: { id: Focus; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "face", label: "Face" },
  { id: "body", label: "Body" },
  { id: "tits", label: "Tits" },
  { id: "ass", label: "Ass" },
  { id: "vibe", label: "Vibe" },
];

export const FILTHY_MODES: { id: FilthyMode; label: string }[] = [
  { id: "degrade", label: "Degrade me" },
  { id: "worship", label: "Worship me" },
  { id: "mixed", label: "Mixed" },
];

export function getRarity(score: number) {
  if (score >= 9.6)
    return {
      name: "Legendary",
      border: "border-amber-400/90",
      glow: "shadow-[0_0_32px_-4px_rgba(251,191,36,0.5)]",
      text: "text-amber-300",
      bar: "from-amber-500 to-amber-300",
      bg: "from-amber-950/40 via-[#0c0c0c] to-[#0c0c0c]",
    };
  if (score >= 9.0)
    return {
      name: "Epic",
      border: "border-red-500/80",
      glow: "shadow-[0_0_28px_-4px_rgba(239,68,68,0.45)]",
      text: "text-red-300",
      bar: "from-red-500 to-rose-400",
      bg: "from-red-950/40 via-[#0c0c0c] to-[#0c0c0c]",
    };
  if (score >= 8.0)
    return {
      name: "Rare",
      border: "border-rose-500/70",
      glow: "shadow-[0_0_22px_-6px_rgba(225,29,72,0.4)]",
      text: "text-rose-300",
      bar: "from-rose-600 to-pink-400",
      bg: "from-rose-950/35 via-[#0c0c0c] to-[#0c0c0c]",
    };
  if (score >= 6.0)
    return {
      name: "Uncommon",
      border: "border-purple-500/60",
      glow: "shadow-[0_0_18px_-6px_rgba(147,51,234,0.35)]",
      text: "text-purple-300",
      bar: "from-purple-600 to-violet-400",
      bg: "from-purple-950/30 via-[#0c0c0c] to-[#0c0c0c]",
    };
  if (score >= 4.0)
    return {
      name: "Common",
      border: "border-neutral-500/50",
      glow: "",
      text: "text-neutral-400",
      bar: "from-neutral-500 to-neutral-400",
      bg: "from-neutral-900/40 via-[#0c0c0c] to-[#0c0c0c]",
    };
  return {
    name: "Trash",
    border: "border-neutral-700/40",
    glow: "",
    text: "text-neutral-500",
    bar: "from-neutral-700 to-neutral-600",
    bg: "from-neutral-900/20 via-[#0c0c0c] to-[#0c0c0c]",
  };
}
