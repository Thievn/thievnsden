import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { loadDenStonePng, SatoriDenSeal } from "@/lib/den-seal";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "Thievn's Den").slice(0, 120);
  const subtitle = (searchParams.get("subtitle") || "Dark humor · Gaming · Face The Den").slice(
    0,
    160
  );
  const section = (searchParams.get("section") || "").slice(0, 40);
  const stone = await loadDenStonePng();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070707",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "20%",
            width: 500,
            height: 400,
            borderRadius: 999,
            background: "rgba(185, 28, 92, 0.28)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: "10%",
            width: 420,
            height: 360,
            borderRadius: 999,
            background: "rgba(124, 58, 237, 0.22)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <SatoriDenSeal data={stone} size={72} />
          <div
            style={{
              fontSize: 22,
              color: "#e5e5e5",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Thievn's Den
          </div>
          {section ? (
            <div
              style={{
                marginLeft: 12,
                fontSize: 14,
                color: "#a3a3a3",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {section}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          <div
            style={{
              fontSize: title.length > 48 ? 48 : 56,
              fontWeight: 650,
              color: "#fafafa",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 24, color: "#a3a3a3", lineHeight: 1.4 }}>{subtitle}</div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#737373",
          }}
        >
          <span>thievnsden.com</span>
          <span style={{ color: "#e11d48" }}>Enter the Den</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
