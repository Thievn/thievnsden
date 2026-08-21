import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        {/* Keyhole approximation for Satori */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              border: "2.5px solid #e11d48",
              background: "#070707",
            }}
          />
          <div
            style={{
              width: 7,
              height: 10,
              marginTop: -2,
              borderLeft: "2.5px solid #c026d3",
              borderRight: "2.5px solid #c026d3",
              borderBottom: "2.5px solid #a855f7",
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              background: "#070707",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
