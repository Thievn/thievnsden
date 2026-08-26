import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { dropFeature } from "@/lib/x-drop";
import { rowToPair } from "@/lib/wyr-map";
import { getRarity } from "@/lib/rarity";

export function dropSize(aspect: string) {
  if (aspect === "9:16") return { width: 1080, height: 1920 };
  if (aspect === "4:5") return { width: 1080, height: 1350 };
  return { width: 1200, height: 675 };
}

async function asDataUri(url: string | null | undefined) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!mime.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${mime};base64,${buf.toString("base64")}`;
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
    const portrait = await asDataUri(data.image_url);
    return new ImageResponse(
      (
        <Shell section="Face The Den" footer={`${rarity.name} · ${Number(data.score).toFixed(1)}`} tall={tall}>
          <div style={{ display: "flex", gap: 36, width: "100%", alignItems: "center" }}>
            {portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portrait}
                width={tall ? 420 : 320}
                height={tall ? 560 : 420}
                style={{
                  objectFit: "cover",
                  borderRadius: 28,
                  border: "2px solid rgba(251,191,36,0.35)",
                }}
              />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, maxWidth: 560 }}>
              <div style={{ fontSize: 22, color: "#fbbf24", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                @{username}
              </div>
              <div style={{ fontSize: tall ? 28 : 24, color: "#fafafa", lineHeight: 1.35, fontWeight: 500 }}>
                {verdict}
              </div>
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
    const still = await asDataUri(data.image_url);
    const want = String(data.want || "A lock screen from the den.").slice(0, 140);
    return new ImageResponse(
      (
        <Shell section="Afterimage" footer={data.finish || "lock screen"} tall={tall}>
          <div style={{ display: "flex", gap: 36, width: "100%", alignItems: "center" }}>
            {still ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={still}
                width={tall ? 380 : 280}
                height={tall ? 760 : 500}
                style={{
                  objectFit: "cover",
                  borderRadius: 36,
                  border: "2px solid rgba(232,121,249,0.4)",
                }}
              />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
              <div style={{ fontSize: 18, color: "#e879f9", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                @{data.username || "den"}
              </div>
              <div style={{ fontSize: tall ? 30 : 26, color: "#fafafa", lineHeight: 1.35 }}>{want}</div>
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
        a = pair.a;
        b = pair.b;
        contrast = `${pair.topic || "Heat"} vs ${pair.topicB || "Cost"}`;
      }
    }
    return new ImageResponse(
      (
        <Shell section="The Floor" footer="Ten rounds" tall={tall}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
            <div style={{ fontSize: 16, color: "#fde68a", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Tonight · {contrast}
            </div>
            <div style={{ display: "flex", gap: 18, width: "100%", flexDirection: tall ? "column" : "row" }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 28,
                  borderRadius: 28,
                  border: "1px solid rgba(244,63,94,0.45)",
                  background: "linear-gradient(160deg, rgba(127,29,29,0.45), #0a0a0a)",
                }}
              >
                <div style={{ fontSize: 14, color: "#fda4af", letterSpacing: "0.2em" }}>A</div>
                <div style={{ fontSize: tall ? 26 : 22, color: "#fafafa", lineHeight: 1.35 }}>{a}</div>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 28,
                  borderRadius: 28,
                  border: "1px solid rgba(139,92,246,0.45)",
                  background: "linear-gradient(200deg, rgba(76,29,149,0.4), #0a0a0a)",
                }}
              >
                <div style={{ fontSize: 14, color: "#c4b5fd", letterSpacing: "0.2em" }}>B</div>
                <div style={{ fontSize: tall ? 26 : 22, color: "#fafafa", lineHeight: 1.35 }}>{b}</div>
              </div>
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
