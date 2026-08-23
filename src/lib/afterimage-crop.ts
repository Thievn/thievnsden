export async function cropTo916(b64: string) {
  const sharp = (await import("sharp")).default;
  const input = Buffer.from(b64, "base64");
  const img = sharp(input, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;
  const target = 9 / 16;
  const current = w / h;
  let extract;
  if (current > target) {
    const nw = Math.round(h * target);
    extract = { left: Math.max(0, Math.floor((w - nw) / 2)), top: 0, width: nw, height: h };
  } else {
    const nh = Math.round(w / target);
    extract = { left: 0, top: Math.max(0, Math.floor((h - nh) / 2)), width: w, height: nh };
  }
  const out = await img
    .extract(extract)
    .resize(1080, 1920, { fit: "cover" })
    .jpeg({ quality: 88 })
    .toBuffer();
  return out;
}
