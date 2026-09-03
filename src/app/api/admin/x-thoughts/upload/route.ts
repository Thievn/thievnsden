import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.byteLength > 8_000_000) return NextResponse.json({ error: "Too large" }, { status: 400 });
    const supabase = createServiceClient();
    const ext = file.type.includes("png") ? "png" : "jpg";
    const path = `x-thoughts/upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from("afterimage").upload(path, buf, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
    return NextResponse.json({ image: pub.publicUrl });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
