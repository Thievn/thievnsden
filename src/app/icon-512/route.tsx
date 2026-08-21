import { ImageResponse } from "next/og";

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: 999,
              border: "18px solid #e11d48",
              background: "#070707",
            }}
          />
          <div
            style={{
              width: 108,
              height: 170,
              marginTop: -24,
              borderLeft: "18px solid #c026d3",
              borderRight: "18px solid #c026d3",
              borderBottom: "18px solid #a855f7",
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
              background: "#070707",
            }}
          />
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
