import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireHeatPlayer, uploadHeatBytes } from "@/lib/heat-check-server";

export const runtime = "nodejs";

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), bytes: Buffer.from(match[2], "base64") };
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireHeatPlayer(req);
    if ("error" in ctx && ctx.error) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const user = ctx.user!;
    const body = await req.json();
    const image = body.image as string | undefined;
    if (!image) return NextResponse.json({ error: "No photo." }, { status: 400 });
    const parsed = dataUrlToBytes(image);
    if (!parsed) return NextResponse.json({ error: "Use jpeg, png, or webp." }, { status: 400 });
    if (parsed.bytes.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo is too large." }, { status: 400 });
    }
    const kind = body.kind === "chat" || body.kind === "mine" ? "heat-uploads" : "heat-faces";
    const intent = body.kind === "chat" ? "chat" : body.kind === "mine" ? "mine" : "contact";
    const ext = parsed.mime === "image/png" ? "png" : parsed.mime === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const up = await uploadHeatBytes({
      bucket: kind,
      path,
      bytes: parsed.bytes,
      contentType: parsed.mime,
    });
    const supabase = createServiceClient();
    let url = up.url;
    if (kind === "heat-uploads") {
      const signed = await supabase.storage.from("heat-uploads").createSignedUrl(path, 60 * 60 * 24 * 7);
      url = signed.data?.signedUrl || url;
    }
    await supabase.from("heat_assets").insert({
      user_id: user.id,
      kind: intent === "chat" ? "chat" : intent === "mine" ? "upload" : "upload",
      bucket: kind,
      path,
      url,
      status: "pending",
    });
    return NextResponse.json({ path: up.path, url, bucket: kind });
  } catch (err: unknown) {
    console.error("heat upload", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
