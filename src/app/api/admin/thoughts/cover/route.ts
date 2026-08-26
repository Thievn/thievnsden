import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  artLabel,
  assembleXThoughtImagePrompt,
  inventXThoughtScene,
  localScene,
  rollXThoughtArt,
  thoughtGist,
} from "@/lib/x-thought-image";

export const runtime = "nodejs";
export const maxDuration = 90;

function jsonError(msg: string, status = 500) {
  return NextResponse.json({ error: msg.slice(0, 280) }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const excerpt = String(body.excerpt || "").trim();
    if (!title) return jsonError("Title first", 400);

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return jsonError("XAI_API_KEY missing");

    const gist = thoughtGist(`${title}. ${excerpt}`) || title;
    const art = rollXThoughtArt();
    const brief = { gist, topic: title, art, aspect: "16:9" as const };
    const scene = (await inventXThoughtScene({ ...brief, apiKey }).catch(() => null)) || localScene(brief);
    const prompt = assembleXThoughtImagePrompt({ scene, art, aspect: "16:9", gist });

    const models = ["grok-imagine-image", "grok-imagine-image-2.0"];
    let bytes: Uint8Array | null = null;
    let last = "";

    for (const model of models) {
      const payload: Record<string, unknown> = {
        model,
        prompt,
        n: 1,
        aspect_ratio: "16:9",
        response_format: "url",
        resolution: "1k",
      };
      if (model.includes("2.0")) payload.quality = "medium";
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        last = text.slice(0, 220);
        continue;
      }
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        last = text.slice(0, 180);
        continue;
      }
      const url = data.data?.[0]?.url;
      const b64 = data.data?.[0]?.b64_json;
      if (url) {
        const img = await fetch(url);
        if (img.ok) {
          bytes = new Uint8Array(await img.arrayBuffer());
          break;
        }
        last = "image url fetch failed";
      } else if (b64) {
        bytes = new Uint8Array(Buffer.from(b64, "base64"));
        break;
      }
    }

    if (!bytes) return jsonError(last || "Cover failed", 502);

    const supabase = createServiceClient();
    const path = `thoughts/covers/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error: upErr } = await supabase.storage.from("afterimage").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (upErr) return jsonError(upErr.message);
    const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
    return NextResponse.json({ cover_url: pub.publicUrl, look: artLabel(art) });
  } catch (err: any) {
    return jsonError(err?.message || "Cover failed");
  }
}
