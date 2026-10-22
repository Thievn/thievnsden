// Den explicit-mode safeguards (server-side only).
// 1) Provenance lock: SHA-256 + perceptual hash of every image the Den generator makes, in public.den_provenance
//    (Supabase yifocyooygtxwvqfwghv, service role only). clean=true only for text-to-image outputs and edits whose
//    every input image was itself clean. Explicit edits accept ONLY a subject whose exact SHA-256 is a clean record.
// 2) Upload screening: camera EXIF / C2PA signals + Grok vision (realFace, minor). Heuristic, see plan.md.
import sharp from "sharp";
import { readFace } from "@/lib/attic/grok";
import { sha } from "./sign";

function base() {
  return process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
}

async function rest(path: string, init?: RequestInit) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!base() || !key) throw new Error("Provenance store isn't set up.");
  const response = await fetch(`${base()}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`provenance ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// 64-bit difference hash (dHash) as 16 hex chars.
export async function phash(buf: Buffer) {
  const px = await sharp(buf).rotate().grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? "1" : "0";
  return bits.match(/.{4}/g)!.map((nib) => parseInt(nib, 2).toString(16)).join("");
}

export async function recordProvenance(buf: Buffer, row: { origin: "t2i" | "edit"; clean: boolean; parentSha?: string | null; runpodId?: string | null; imageId?: string | null }) {
  await rest("den_provenance?on_conflict=sha256", {
    method: "POST",
    headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      sha256: sha(buf),
      phash: await phash(buf),
      origin: row.origin,
      clean: row.clean,
      parent_sha: row.parentSha ?? null,
      runpod_id: row.runpodId ?? null,
      image_id: row.imageId && /^[0-9a-f-]{36}$/i.test(row.imageId) ? row.imageId : null,
    }),
  });
}

export async function provenanceOf(buf: Buffer): Promise<{ sha: string; clean: boolean; origin: string | null }> {
  const digest = sha(buf);
  const rows = (await rest(`den_provenance?sha256=eq.${digest}&select=clean,origin&limit=1`)) as { clean: boolean; origin: string }[];
  return { sha: digest, clean: Boolean(rows?.[0]?.clean), origin: rows?.[0]?.origin ?? null };
}

// Camera-capture signals: EXIF Make/Model or a C2PA manifest (JUMBF "c2pa" box). Absence proves nothing.
export async function captureSignals(buf: Buffer) {
  const signals: string[] = [];
  try {
    const meta = await sharp(buf).metadata();
    const exif = meta.exif ? meta.exif.toString("latin1") : "";
    if (/Canon|NIKON|SONY|Apple|samsung|Google|FUJIFILM|OLYMPUS|Panasonic|LEICA|HUAWEI|Xiaomi|OnePlus|motorola|LG/i.test(exif)) signals.push("camera-exif");
    if (exif && /\bf\/|ExposureTime|FNumber|ISOSpeed|GPS/i.test(exif)) signals.push("exposure-exif");
  } catch {
    /* ignore */
  }
  if (buf.includes(Buffer.from("c2pa"))) signals.push("c2pa-manifest");
  return signals;
}

export type Screen = { ok: boolean; minor: boolean; realPerson: boolean; signals: string[]; reason?: string };

// Vision + metadata screen. failClosed: treat an unavailable vision check as a refusal.
export async function screenImage(buf: Buffer, failClosed: boolean): Promise<Screen> {
  const signals = await captureSignals(buf);
  const small = await sharp(buf).rotate().resize({ width: 768, height: 768, fit: "inside" }).jpeg({ quality: 85 }).toBuffer();
  let report = null;
  try {
    report = await readFace(`data:image/jpeg;base64,${small.toString("base64")}`, null);
  } catch {
    report = null;
  }
  if (!report) {
    return { ok: !failClosed, minor: false, realPerson: signals.length > 0, signals, reason: failClosed ? "Image screening is unavailable right now." : undefined };
  }
  const realPerson = report.realFace || signals.includes("camera-exif");
  if (report.minor) return { ok: false, minor: true, realPerson, signals, reason: "Adults only: the picture may show someone under 21." };
  return { ok: true, minor: false, realPerson, signals };
}
