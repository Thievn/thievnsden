// Prompt-triggered extra LoRAs for the Qwen-Image-Edit-2511 lab edit (server-side only).
// Allowlist: only files confirmed present in models/loras on the RunPod network volume.
// Non-nude styling LoRAs only (lighting, camera angle, outfit/lingerie transfer, swimwear).
// Never loads on neutral prompts. Max 3 extras, strengths clamped 0.5-0.8.

export type LabLora = { id: string; file: string; strength: number; trigger: string };

type Rule = LabLora & {
  priority: number; // lower = picked first
  group: string; // only one LoRA per group
  match: RegExp;
  needsRefs?: boolean; // only when an outfit reference image is supplied
  noRefs?: boolean; // only when no outfit reference image is supplied
  skipWhenExplicit?: boolean;
};

const RULES: Rule[] = [
  {
    id: "lingerie-transfer",
    file: "den_lingerie_transfer_qie2509.safetensors",
    strength: 0.7,
    trigger: "",
    priority: 1,
    group: "outfit",
    needsRefs: true,
    skipWhenExplicit: true,
    match: /\b(lingerie|bra(lette)?|corset|bustier|garter|teddy|babydoll|negligee|chemise|bodysuit|lace (set|underwear)|stockings|thong|panties|boudoir set)\b/i,
  },
  {
    id: "clothes-tryon",
    file: "den_clothes_tryon_qie.safetensors",
    strength: 0.7,
    trigger: "",
    priority: 2,
    group: "outfit",
    needsRefs: true,
    match: /\b(outfit|dress|clothes|clothing|garment|wear(ing)?|put (her|him) in|try[- ]?on|swap (the )?(outfit|clothes))\b/i,
  },
  {
    id: "relight",
    file: "den_relight_qie2509.safetensors",
    strength: 0.7,
    trigger: "重新照明,",
    priority: 3,
    group: "light",
    match: /\b(relight|re-light|boudoir|candle ?lit|candlelight|window light|golden hour|rim light|backlit|neon light|moody light(ing)?|soft light(ing)?|studio light(ing)?|dramatic light(ing)?|lighting|sunset light|low[- ]key|high[- ]key)\b/i,
  },
  {
    id: "swimwear",
    file: "den_microbikini_qwen.safetensors",
    strength: 0.6,
    trigger: "",
    priority: 4,
    group: "swim",
    noRefs: true,
    skipWhenExplicit: true,
    match: /\b(micro[- ]?bikini|bikini|string bikini|swimsuit|swimwear|bathing suit|two[- ]piece)\b/i,
  },
  {
    id: "camera-angle",
    file: "den_multiangle_qie2509.safetensors",
    strength: 0.6,
    trigger: "",
    priority: 5,
    group: "camera",
    match: /\b(camera angle|from (above|below|behind|the side)|low angle|high angle|overhead|bird'?s[- ]eye|close[- ]?up|wide shot|rotate (the )?camera|side view|three[- ]quarter view|top[- ]down)\b/i,
  },
];

export const LORA_ALLOWLIST = new Set(RULES.map((rule) => rule.file));
export const MAX_EXTRA_LORAS = 3;

const clamp = (value: number) => Math.max(0.5, Math.min(0.8, value));

export function pickLoras(text: string, opts: { refs: boolean; explicit: boolean }): LabLora[] {
  const source = String(text || "");
  if (!source.trim()) return [];
  const seen = new Set<string>();
  const picked: LabLora[] = [];
  for (const rule of [...RULES].sort((a, b) => a.priority - b.priority)) {
    if (picked.length >= MAX_EXTRA_LORAS) break;
    if (seen.has(rule.group) || !LORA_ALLOWLIST.has(rule.file)) continue;
    if (rule.needsRefs && !opts.refs) continue;
    if (rule.noRefs && opts.refs) continue;
    if (rule.skipWhenExplicit && opts.explicit) continue;
    if (!rule.match.test(source)) continue;
    seen.add(rule.group);
    picked.push({ id: rule.id, file: rule.file, strength: clamp(rule.strength), trigger: rule.trigger });
  }
  return picked;
}

export function withTriggers(text: string, loras: LabLora[]) {
  const add = loras.map((lora) => lora.trigger).filter((trigger) => trigger && !text.includes(trigger));
  return add.length ? `${add.join(" ")} ${text}` : text;
}
