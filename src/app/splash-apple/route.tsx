import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { loadDenStonePng, SatoriDenSeal } from "@/lib/den-seal";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const width = Math.min(1290, Math.max(320, Number(searchParams.get("w") || 1284)));
  const height = Math.min(2796, Math.max(568, Number(searchParams.get("h") || 2778)));
  const mark = Math.round(Math.min(width, height) * 0.38);
  const stone = await loadDenStonePng();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <SatoriDenSeal data={stone} size={mark} />
        <div
          style={{
            marginTop: 36,
            display: "flex",
            fontSize: Math.max(20, Math.round(width * 0.045)),
            color: "#f5f5f5",
            fontWeight: 600,
            letterSpacing: "-0.03em",
          }}
        >
          Thievn's Den
        </div>
      </div>
    ),
    { width, height }
  );
}
