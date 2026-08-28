import { ImageResponse } from "next/og";
import { loadPng } from "@/lib/den-seal";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const data = await loadPng("public/mark/icon-32.png");
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          background: "#070707",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data} width={32} height={32} alt="" />
      </div>
    ),
    { ...size }
  );
}
