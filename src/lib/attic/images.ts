const MAX_BYTES = 3_500_000;

export function parseDataUrl(value: unknown): { mime: string; bytes: Uint8Array } | null {
  if (typeof value !== "string") return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\s]+)$/i.exec(value.trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(Buffer.from(match[2].replace(/\s/g, ""), "base64"));
  } catch {
    return null;
  }
  if (bytes.byteLength < 32 || bytes.byteLength > MAX_BYTES) return null;
  if (mime === "image/png" && bytes[0] !== 0x89) return null;
  if (mime === "image/jpeg" && bytes[0] !== 0xff) return null;
  if (mime === "image/webp" && bytes[8] !== 0x57) return null;
  return { mime, bytes };
}

export function toDataUrl(mime: string, bytes: Uint8Array): string {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
