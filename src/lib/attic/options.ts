export const STYLES = [
  { id: "semireal", label: "Semi-real", text: "Semi-realistic digital render, soft painterly shading, detailed materials." },
  { id: "pixar", label: "Pixar-hybrid", text: "Stylized 3D feature-film look, appealing shapes, soft global light, adult character." },
  { id: "anime", label: "Anime", text: "Anime illustration, clean linework, cel shading, adult character." },
  { id: "photoreal", label: "Photoreal", text: "Photoreal still, natural skin, 85mm lens, sharp focus." },
  { id: "painterly", label: "Painterly", text: "Oil painting, visible brushwork, rich pigment, gallery light." },
  { id: "cinematic", label: "Cinematic", text: "Cinematic film still, anamorphic color, shallow depth of field." },
] as const;

export const RATIOS = [
  { id: "portrait", label: "Portrait", w: 832, h: 1216 },
  { id: "square", label: "Square", w: 1024, h: 1024 },
  { id: "landscape", label: "Landscape", w: 1216, h: 832 },
  { id: "story", label: "Story", w: 768, h: 1344 },
  { id: "wide", label: "Wide", w: 1344, h: 768 },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];
export type RatioId = (typeof RATIOS)[number]["id"];
export type ModelId = "chroma" | "zimage";
export type ResolutionId = "standard" | "large";

export function styleById(id: string) {
  return STYLES.find((style) => style.id === id) ?? STYLES[0];
}

function snap16(value: number) {
  return Math.max(512, Math.min(1408, Math.round(value / 16) * 16));
}

export function pixelSize(ratioId: string, resolution: string): { w: number; h: number } {
  const ratio = RATIOS.find((item) => item.id === ratioId) ?? RATIOS[0];
  const scale = resolution === "large" ? 1.15 : 1;
  return { w: snap16(ratio.w * scale), h: snap16(ratio.h * scale) };
}

export function clampSteps(model: ModelId, value: unknown): number {
  const parsed = Number(value);
  if (model === "zimage") {
    if (!Number.isFinite(parsed)) return 8;
    return Math.max(4, Math.min(12, Math.round(parsed)));
  }
  if (!Number.isFinite(parsed)) return 28;
  return Math.max(12, Math.min(40, Math.round(parsed)));
}

export function clampCfg(model: ModelId, value: unknown): number {
  const parsed = Number(value);
  if (model === "zimage") {
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.min(2, parsed));
  }
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(2, Math.min(8, parsed));
}

export function clampBatch(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(4, Math.round(parsed)));
}

export function clampStrength(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0.65;
  return Math.max(0.2, Math.min(1, parsed));
}

export function clampSeed(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.floor(Math.random() * 1_000_000_000);
  return Math.max(0, Math.min(2_147_483_647, Math.floor(parsed)));
}
