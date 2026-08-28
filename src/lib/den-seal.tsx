import { readFile } from "fs/promises";
import { join } from "path";

export async function loadPng(rel: string) {
  const buf = await readFile(join(process.cwd(), rel));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export async function loadDenStonePng() {
  return loadPng("public/mark/den-stone-og.png");
}

/** Square-safe stone + keyhole for OG and generated images. */
export function SatoriDenSeal({
  data,
  size,
}: {
  data: ArrayBuffer;
  size: number;
}) {
  const h = Math.round(size * 0.84);
  const w = Math.round(h * (485 / 640));
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data} width={w} height={h} alt="" />
    </div>
  );
}
