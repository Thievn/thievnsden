export function runpodConfigured(): boolean {
  return Boolean(process.env.RUNPOD_API_KEY?.trim() && process.env.RUNPOD_ENDPOINT_ID?.trim());
}

function config(): { endpoint: string; key: string } {
  const endpoint = process.env.RUNPOD_ENDPOINT_ID?.trim() ?? "";
  const key = process.env.RUNPOD_API_KEY?.trim() ?? "";
  if (!endpoint || !key) throw new Error("IMAGE_NOT_CONFIGURED");
  return { endpoint, key };
}

export async function submitWorkflow(
  workflow: Record<string, unknown>,
  images: { name: string; image: string }[],
): Promise<string> {
  const { endpoint, key } = config();
  const started = await fetch(`https://api.runpod.ai/v2/${endpoint}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: { workflow, images } }),
  });
  const body = (await started.json().catch(() => null)) as { id?: string; error?: string } | null;
  if (!started.ok || !body?.id) throw new Error("IMAGE_FAILED");
  return body.id;
}

export async function readRunpod(jobId: string): Promise<{ status: string; output?: unknown; error?: string }> {
  const { endpoint, key } = config();
  const res = await fetch(`https://api.runpod.ai/v2/${endpoint}/status/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = (await res.json().catch(() => null)) as { status?: string; output?: unknown; error?: string } | null;
  if (!res.ok || !body?.status) throw new Error("IMAGE_FAILED");
  return { status: body.status, output: body.output, error: body.error };
}

function pickImagePayload(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (typeof output !== "object") return null;
  const row = output as Record<string, unknown>;
  for (const key of ["image", "image_url", "url", "image_base64", "message"]) {
    if (typeof row[key] === "string" && row[key]) return String(row[key]);
  }
  if (Array.isArray(row.images) && row.images.length) {
    const first = row.images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const nested = first as Record<string, unknown>;
      for (const key of ["image", "url", "data", "image_base64"]) {
        if (typeof nested[key] === "string") return String(nested[key]);
      }
    }
  }
  return null;
}

export async function bytesFromRunpodOutput(output: unknown): Promise<{ mime: string; bytes: Uint8Array }> {
  const candidate = pickImagePayload(output);
  if (!candidate) throw new Error("IMAGE_FAILED");
  if (candidate.startsWith("http")) {
    const res = await fetch(candidate);
    if (!res.ok) throw new Error("IMAGE_FAILED");
    const bytes = new Uint8Array(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    return { mime: mime.startsWith("image/") ? mime : "image/png", bytes };
  }
  const mime = candidate.startsWith("data:image/jpeg")
    ? "image/jpeg"
    : candidate.startsWith("data:image/webp")
      ? "image/webp"
      : "image/png";
  const clean = candidate.replace(/^data:image\/\w+;base64,/, "");
  return { mime, bytes: new Uint8Array(Buffer.from(clean, "base64")) };
}

export function publicImageError(code: string): string {
  if (code === "IMAGE_NOT_CONFIGURED") return "The picture machine isn't connected yet.";
  return "Couldn't finish that. Try again in a moment.";
}
