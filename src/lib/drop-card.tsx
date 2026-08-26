import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/server";
import { dropFeature } from "@/lib/x-drop";
import { rowToPair } from "@/lib/wyr-map";
import { getRarity } from "@/lib/rarity";

export function dropSize(aspect: string) {
  if (aspect === "9:16") return { width: 1080, height: 1920 };
  if (aspect === "4:5") return { width: 1080, height: 1350 };
  return { width: 1200, height: 675 };
}

async function asCardImage(url: string | null | undefined, w: number, h: number) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await sharp(buf)
      .rotate()
      .resize(w, h, { fit: "cover" })
      .jpeg({ quality: 78 })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

function Shell({
  children,
  section,
  footer,
  tall,
}: {
  children: ReactNode;
  section: string;
  footer?: string;
  tall?: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#070707",
        padding: tall ? 56 : 48,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          left: "12%",
          width: 520,
          height: 420,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(185,28,92,0.32) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -50,
          right: "8%",
          width: 440,
          height: 360,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(124,58,237,0.26) 0%, transparent 70%)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 20, color: "#e5e5e5", fontWeight: 650, letterSpacing: "-0.02em" }}>
          Thievn's Den
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#a3a3a3",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          {section}
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "#737373" }}>
        <span>thievnsden.com</span>
        <span style={{ color: "#fb7185" }}>{footer || "Enter the Den"}</span>
      </div>
    </div>
  );
}

export async function renderDropCard(opts: { kind: string; aspect: string; id?: string }) {
  try {
    return await renderDropCardInner(opts);
  } catch (err: any) {
    console.error("drop-card", err);
    return new Response(err?.message || "Drop card failed", { status: 500 });
  }
}

async function renderDropCardInner(opts: { kind: string; aspect: string; id?: string }) {
  const { width, height } = dropSize(opts.aspect);
  const tall = height > width;
  const kind = opts.kind || "den";
  const id = opts.id || "";
  const supabase = createServiceClient();

  if (kind === "ftd" && id) {
    const { data } = await supabase
      .from("judgments")
      .select("id, user_id, score, rarity, verdict, image_url")
      .eq("id", id)
      .maybeSingle();
    if (!data) return new Response("Card not found", { status: 404 });
    let username = "house";
    if (data.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user_id)
        .maybeSingle();
      if (profile?.username) username = profile.username;
    }
    const rarity = getRarity(Number(data.score));
    const verdict = String(data.verdict || "").slice(0, 160);
    const portrait = await asCardImage(data.image_url, tall ? 420 : 320, tall ? 560 : 420);
    return new ImageResponse(
      (
        <Shell section="Face The Den" footer={`${rarity.name} · ${Number(data.score).toFixed(1)}`} tall={tall}>
          <div
            style={{
              display: "flex",
              flexDirection: tall ? "column" : "row",
              gap: 28,
              width: "100%",
              alignItems: "flex-start",
            }}
          >
            {portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portrait}
                width={tall ? 420 : 300}
                height={tall ? 560 : 400}
                style={{
                  objectFit: "cover",
                  borderRadius: 24,
                }}
              />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, width: tall ? 900 : 520 }}>
              <div style={{ fontSize: 20, color: "#fbbf24" }}>{`@${username}`}</div>
              <div style={{ fontSize: tall ? 28 : 22, color: "#fafafa", lineHeight: 1.3 }}>{verdict}</div>
              <div style={{ fontSize: 18, color: "#a3a3a3" }}>Walked in looking pretty.</div>
            </div>
          </div>
        </Shell>
      ),
      { width, height }
    );
  }

  if (kind === "afterimage" && id) {
    const { data } = await supabase
      .from("afterimage_prints")
      .select("id, image_url, want, username, heat, finish")
      .eq("id", id)
      .maybeSingle();
    if (!data) return new Response("Print not found", { status: 404 });
    const still = await asCardImage(data.image_url, tall ? 380 : 280, tall ? 760 : 500);
    const want = String(data.want || "A lock screen from the den.").slice(0, 140);
    return new ImageResponse(
      (
        <Shell section="Afterimage" footer={String(data.finish || "lock screen")} tall={tall}>
          <div
            style={{
              display: "flex",
              flexDirection: tall ? "column" : "row",
              gap: 28,
              width: "100%",
              alignItems: "flex-start",
            }}
          >
            {still ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={still}
                width={tall ? 360 : 260}
                height={tall ? 640 : 460}
                style={{ objectFit: "cover", borderRadius: 28 }}
              />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, width: tall ? 900 : 540 }}>
              <div style={{ fontSize: 18, color: "#e879f9" }}>{`@${data.username || "den"}`}</div>
              <div style={{ fontSize: tall ? 28 : 24, color: "#fafafa", lineHeight: 1.3 }}>{want}</div>
            </div>
          </div>
        </Shell>
      ),
      { width, height }
    );
  }

  if (kind === "floor") {
    let a = "Take the heat.";
    let b = "Keep the story clean.";
    let contrast = "The Floor";
    if (id) {
      const { data } = await supabase.from("wyr_pairs").select("*").eq("id", id).maybeSingle();
      const pair = data ? rowToPair(data) : null;
      if (pair) {
        a = pair.a.slice(0, 180);
        b = pair.b.slice(0, 180);
        contrast = `${pair.topic || "Heat"} vs ${pair.topicB || "Cost"}`;
      }
    }
    return new ImageResponse(
      (
        <Shell section="The Floor" footer="Ten rounds" tall={tall}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
            <div style={{ fontSize: 16, color: "#fde68a" }}>{`Tonight - ${contrast}`}</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
                padding: 24,
                borderRadius: 24,
                background: "#1a0a0c",
              }}
            >
              <div style={{ fontSize: 14, color: "#fda4af" }}>A</div>
              <div style={{ fontSize: tall ? 26 : 22, color: "#fafafa", lineHeight: 1.3 }}>{a}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
                padding: 24,
                borderRadius: 24,
                background: "#12081c",
              }}
            >
              <div style={{ fontSize: 14, color: "#c4b5fd" }}>B</div>
              <div style={{ fontSize: tall ? 26 : 22, color: "#fafafa", lineHeight: 1.3 }}>{b}</div>
            </div>
          </div>
        </Shell>
      ),
      { width, height }
    );
  }

  const feature = dropFeature(kind);
  return new ImageResponse(
    (
      <Shell section={feature.section} footer="Enter the Den" tall={tall}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 920 }}>
          <div
            style={{
              fontSize: feature.label.length > 18 ? 54 : 64,
              fontWeight: 650,
              color: "#fafafa",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {feature.label}
          </div>
          <div style={{ fontSize: 28, color: "#a3a3a3", lineHeight: 1.4 }}>{feature.line}</div>
        </div>
      </Shell>
    ),
    { width, height }
  );
}
