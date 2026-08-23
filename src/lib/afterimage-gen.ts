export type GenKind = "preview" | "phone";

export async function generateWallpaper(opts: {
  prompt: string;
  aspect: string;
  kind: GenKind;
  n?: number;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");

  const n = Math.min(Math.max(opts.n || 1, 1), 3);
  const model = opts.kind === "phone" ? "grok-imagine-image-2.0" : "grok-imagine-image";
  const resolution = opts.kind === "phone" ? "2k" : "1k";
  const fallbacks =
    opts.kind === "phone"
      ? ["grok-imagine-image-2.0", "grok-imagine-image-quality", "grok-imagine-image"]
      : ["grok-imagine-image", "grok-imagine-image-2.0"];

  const errors: string[] = [];
  for (const m of fallbacks) {
    const body: Record<string, unknown> = {
      model: m,
      prompt: opts.prompt,
      n,
      resolution: m.includes("2.0") || m.includes("quality") ? resolution : opts.kind === "phone" ? "2k" : "1k",
      aspect_ratio: opts.aspect || "9:16",
      response_format: "b64_json",
    };
    if (m.includes("2.0")) body.quality = "medium";

    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      errors.push(`${m}: ${res.status} ${text.slice(0, 220)}`);
      const low = text.toLowerCase();
      if (low.includes("moderat") || low.includes("violat") || low.includes("safety") || res.status === 400) {
        const err = new Error("REJECTED");
        (err as any).rejected = true;
        (err as any).detail = text.slice(0, 240);
        throw err;
      }
      continue;
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      errors.push(`${m}: bad json`);
      continue;
    }
    const rows = (data.data || []).map((d: any) => d.b64_json).filter(Boolean);
    if (!rows.length) {
      errors.push(`${m}: empty`);
      continue;
    }
    return { model: m, resolution: String(body.resolution), images: rows as string[] };
  }

  throw new Error(`PRINT_FAILED: ${errors.join(" | ")}`);
}
