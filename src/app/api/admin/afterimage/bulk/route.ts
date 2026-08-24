import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const userId = String(form.get("userId") || "");
    const caption = String(form.get("caption") || "Board drop").slice(0, 120);
    const makePublic = String(form.get("public") || "1") !== "0";
    const file = form.get("file");

    if (!userId) return NextResponse.json({ error: "Log in" }, { status: 401 });
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Images only" }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Max 12MB per image" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: auth } = await supabase.auth.admin.getUserById(userId);
    if (!auth?.user || !isAdmin(auth.user)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const username =
      auth.user.user_metadata?.username ||
      auth.user.email?.split("@")[0] ||
      "Thievn";

    const bytes = Buffer.from(await file.arrayBuffer());
    let uploadBytes = bytes;
    try {
      const { cropTo916 } = await import("@/lib/afterimage-crop");
      uploadBytes = await cropTo916(bytes.toString("base64"));
    } catch {
      uploadBytes = bytes;
    }

    const path = `${userId}/bulk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error: upErr } = await supabase.storage.from("afterimage").upload(path, uploadBytes, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabase.storage.from("afterimage").getPublicUrl(path);
    const { data: row, error } = await supabase
      .from("afterimage_prints")
      .insert({
        user_id: userId,
        username,
        image_url: pub.publicUrl,
        want: caption,
        compiled_prompt: "admin bulk upload",
        phone_id: "classic",
        style_id: "photo",
        heat: "flirty",
        finish: "print",
        model: "upload",
        resolution: "1080x1920",
        aspect: "9:16",
        is_public: makePublic,
        is_admin: true,
        rejected: false,
      })
      .select("id, image_url, username, is_public")
      .single();

    if (error) throw new Error(error.message);

    await writeAudit({
      action: "afterimage_bulk_upload",
      details: `${row.id} public=${makePublic}`,
    });

    return NextResponse.json({ success: true, print: row });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
