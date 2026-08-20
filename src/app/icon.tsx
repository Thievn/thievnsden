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
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "linear-gradient(135deg, #ef4444 0%, #a855f7 100%)",
            boxShadow: "0 0 10px rgba(185, 28, 92, 0.8)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
