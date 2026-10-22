import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.EDIT_SIGNING_SECRET || process.env.SESSION_SECRET || "";
  if (value.length < 16) throw new Error("Signing isn't set up yet.");
  return value;
}

function hmac(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export const SRC_RANK: Record<string, number> = { upload: 0, character: 1, lab: 2 };

export function weakest(srcs: string[]) {
  return srcs.reduce((a, b) => ((SRC_RANK[b] ?? 0) < (SRC_RANK[a] ?? 0) ? b : a), "lab");
}

export function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

export function signImage(buf: Buffer, src: string) {
  return `${src}.${hmac(`img:${src}:${sha(buf)}`)}`;
}

export function verifyImage(buf: Buffer, tag: unknown) {
  if (typeof tag !== "string") return "upload";
  const [src, mac] = tag.split(".");
  if (!(src in SRC_RANK) || !mac) return "upload";
  const want = hmac(`img:${src}:${sha(buf)}`);
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(want)) ? src : "upload";
  } catch {
    return "upload";
  }
}

export function signTicket(value: Record<string, unknown>) {
  const packed = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${packed}.${hmac(`tk:${packed}`)}`;
}

export function readTicket(ticket: unknown): Record<string, unknown> | null {
  if (typeof ticket !== "string") return null;
  const [packed, mac] = ticket.split(".");
  if (!packed || !mac) return null;
  try {
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(hmac(`tk:${packed}`)))) return null;
    return JSON.parse(Buffer.from(packed, "base64url").toString()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseDataUrl(value: unknown): { ct: string; ext: string; buf: Buffer } | null {
  if (typeof value !== "string") return null;
  const match = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(value);
  if (!match) return null;
  return { ct: match[1], ext: match[2] === "jpeg" ? "jpg" : match[2], buf: Buffer.from(match[3], "base64") };
}
