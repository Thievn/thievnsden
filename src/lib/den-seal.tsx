import { readFile } from "fs/promises";
import { join } from "path";

export async function loadDenStonePng() {
  const buf = await readFile(join(process.cwd(), "public/mark/den-stone-og.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** Square-safe stone + keyhole for OG and generated images. */
export function SatoriDenSeal({
  data,
  size,
}: {
  data: string;
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
