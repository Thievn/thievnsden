import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { dropFeature } from "@/lib/x-drop";
import { dropSize, renderDropCard } from "@/lib/drop-card";

export const maxDuration = 120;
export const runtime = "nodejs";

function aspectForVideo(aspect: string) {
  if (aspect === "9:16") return "9:16";
  if (aspect === "4:5") return "3:4";
  return "16:9";
}

async function pollVideo(apiKey: string, requestId: string) {
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (data.status === "done" && data.video?.url) return String(data.video.url);
    if (data.status === "failed" || data.status === "expired") {
      throw new Error(data.error || data.status || "clip failed");
    }
  }
  throw new Error("Clip timed out");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const feature = dropFeature(String(body.feature || "den"));
    const aspect = String(body.aspect || "4:5");
    const id = String(body.id || "");
    const prompt =
      String(body.prompt || "").trim() ||
      `Slow cinematic drift over this ${feature.label} card from Thievn's Den. Keep every word readable. Film grain, dark den lighting, no extra text.`;
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });

    const card = await renderDropCard({ kind: feature.id, aspect, id });
    if (!card.ok) return NextResponse.json({ error: "Could not render the still" }, { status: 400 });
    const stillBytes = new Uint8Array(await card.arrayBuffer());
    const supabase = createServiceClient();
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const stillPath = `x-drops/still-${stamp}.png`;
    const stillUp = await supabase.storage.from("afterimage").upload(stillPath, stillBytes, {
      contentType: "image/png",
      upsert: false,
    });
    if (stillUp.error) return NextResponse.json({ error: stillUp.error.message }, { status: 500 });
    const { data: stillPub } = supabase.storage.from("afterimage").getPublicUrl(stillPath);
    const stillUrl = stillPub.publicUrl;
    const size = dropSize(aspect);

    const start = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-video-1.5",
        prompt,
        duration: 5,
        resolution: "720p",
        aspect_ratio: aspectForVideo(aspect),
        image: { url: stillUrl },
        image_url: stillUrl,
      }),
    });
    const startText = await start.text();
    if (!start.ok) {
      return NextResponse.json(
        { error: startText.slice(0, 280) || "Video start failed", still: stillUrl },
        { status: 502 }
      );
    }
    const started = JSON.parse(startText);
    const requestId = started.request_id;
    if (!requestId) return NextResponse.json({ error: "No request_id", still: stillUrl }, { status: 502 });
    const videoUrl = await pollVideo(apiKey, requestId);

    const file = await fetch(videoUrl);
    if (!file.ok) return NextResponse.json({ video: videoUrl, still: stillUrl, stored: false, width: size.width });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const path = `x-drops/clip-${stamp}.mp4`;
    const { error } = await supabase.storage.from("afterimage").upload(path, bytes, {
      contentType: "video/mp4",
      upsert: false,
    });
    if (error) return NextResponse.json({ video: videoUrl, still: stillUrl, stored: false, hint: error.message });
    const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
    return NextResponse.json({ video: pub.publicUrl, still: stillUrl, stored: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Clip failed" }, { status: 500 });
  }
}
