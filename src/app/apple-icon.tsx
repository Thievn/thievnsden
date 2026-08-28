import { ImageResponse } from "next/og";
import { loadPng } from "@/lib/den-seal";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const data = await loadPng("public/mark/apple-180.png");
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          background: "#070707",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data} width={180} height={180} alt="" />
      </div>
    ),
    { ...size }
  );
}
