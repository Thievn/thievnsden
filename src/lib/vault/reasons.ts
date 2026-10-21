import labels from "../reason_labels.json" with { type: "json" };

const wildcards = Object.entries(labels.reasons)
  .filter(([key]) => key.endsWith("*"))
  .map(([key, label]) => ({ prefix: key.slice(0, -1).toLowerCase(), label }))
  .sort((left, right) => right.prefix.length - left.prefix.length);

export function stageLabel(stage: string): string {
  return labels.stages[stage as keyof typeof labels.stages] ?? stage;
}

export function explainReason(stage: string | null, verdict: string | null, reason: string | null): {
  label: string;
  raw: string | null;
} {
  const raw = reason?.trim() ?? "";
  if (!raw) return { label: "No reason.", raw: null };
  const mapped = lookup(raw);
  if (mapped) return { label: mapped, raw };
  if (stage === "grok") {
    const prefix = verdict === "BUY" || verdict === "SKIP" ? labels.grok_prefix[verdict] : "";
    return { label: `${prefix}${raw}`, raw: null };
  }
  return { label: raw, raw: null };
}

function lookup(raw: string): string | null {
  const folded = raw.toLowerCase();
  const exact = labels.reasons[folded as keyof typeof labels.reasons];
  if (exact && !folded.endsWith("*")) return exact;
  for (const wildcard of wildcards) {
    if (!folded.startsWith(wildcard.prefix)) continue;
    if (!wildcard.label.includes("{detail}")) return wildcard.label;
    const detail = raw.slice(wildcard.prefix.length).trim();
    if (!detail) return null;
    return wildcard.label.replaceAll("{detail}", detail);
  }
  return null;
}
