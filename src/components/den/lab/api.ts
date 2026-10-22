export async function postLab(body: Record<string, unknown>) {
  const response = await fetch("/api/lab", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lab: true, ...body }),
  });
  const payload = (await response.json().catch(() => ({ error: `Server error ${response.status}` }))) as {
    error?: string;
    detail?: unknown;
  } & Record<string, unknown>;
  if (!response.ok) {
    const detail = payload.detail ? `: ${JSON.stringify(payload.detail).slice(0, 180)}` : "";
    throw new Error((payload.error || "Request failed") + detail);
  }
  return payload;
}

export async function postDen(body: Record<string, unknown>) {
  const response = await fetch("/api/lab", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({ error: "Server error" }))) as { error?: string } & Record<string, unknown>;
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

export async function pollJob(ticket: string, onStatus?: (status: string) => void) {
  const started = Date.now();
  let current = ticket;
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const payload = await postLab({ action: "status", t: current });
    if (payload.status === "COMPLETED") return payload;
    if (payload.error || ["FAILED", "CANCELLED", "TIMED_OUT"].includes(String(payload.status))) {
      throw new Error(String(payload.error || payload.status));
    }
    if (Date.now() - started > 480000) throw new Error("Timed out waiting for the picture machine");
    const status = String(payload.status || "");
    onStatus?.(status === "IN_QUEUE" ? "queued" : status === "IN_PROGRESS" ? "working" : status || "working");
  }
}

export function fileToJpeg(file: File, max = 1280) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.onerror = () => reject(new Error("Couldn't read that image"));
    image.src = URL.createObjectURL(file);
  });
}

export function shrinkData(data: string, max = 2048, quality = 0.9) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("Couldn't read that image"));
    image.src = data;
  });
}
