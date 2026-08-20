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
            width: 260,
            height: 260,
            borderRadius: 999,
            background:
              "radial-gradient(circle at 30% 30%, #ef4444 0%, #b91c5c 40%, #7c3aed 75%, #070707 100%)",
            boxShadow: "0 0 80px rgba(185,28,92,0.55)",
          }}
        />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
