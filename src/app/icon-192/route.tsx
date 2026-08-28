import { ImageResponse } from "next/og";
import { SatoriDenSeal } from "@/lib/den-seal";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070707",
        }}
      >
        <SatoriDenSeal size={168} />
      </div>
    ),
    { width: 192, height: 192 }
  );
}
