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
              width: 72,
              height: 72,
              borderRadius: 999,
              border: "8px solid #e11d48",
              background: "#070707",
            }}
          />
          <div
            style={{
              width: 40,
              height: 64,
              marginTop: -10,
              borderLeft: "8px solid #c026d3",
              borderRight: "8px solid #c026d3",
              borderBottom: "8px solid #a855f7",
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
              background: "#070707",
            }}
          />
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
