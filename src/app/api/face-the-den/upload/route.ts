import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const b64 = match[2];
  const bytes = Buffer.from(b64, "base64");
  if (!bytes.length) return null;
  return { mime, bytes };
}

export async function POST(req: NextRequest) {
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Log in to save a photo." }, { status: 401 });
    }

    const body = await req.json();
    const image = body.image as string | undefined;
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const parsed = dataUrlToBytes(image);
    if (!parsed) {
      return NextResponse.json({ error: "Use a jpeg, png, or webp photo." }, { status: 400 });
    }
    if (parsed.bytes.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo is too large. Try a smaller one." }, { status: 400 });
    }

    const ext = parsed.mime === "image/png" ? "png" : parsed.mime === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const supabase = createServiceClient();
    const { error } = await supabase.storage.from("judgment-images").upload(path, parsed.bytes, {
      contentType: parsed.mime,
      upsert: false,
    });
    if (error) {
      console.error("judgment upload error:", error);
      return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }

    const { data } = supabase.storage.from("judgment-images").getPublicUrl(path);
    if (!data?.publicUrl) {
      return NextResponse.json({ error: "No public URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url: data.publicUrl, path });
  } catch (err) {
    console.error("Face The Den upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
