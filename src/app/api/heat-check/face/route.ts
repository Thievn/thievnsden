import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";
import { imagineHeatBytes, loadHeatSettings, mayPlayHeat, uploadHeatBytes } from "@/lib/heat-check-server";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const settings = await loadHeatSettings();
  if (!(await mayPlayHeat(user, settings))) return NextResponse.json({ error: "Coming soon." }, { status: 403 });
  if (!settings.face_gen) return NextResponse.json({ error: "Faces are off." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "them").slice(0, 24);
  const voice = String(body.voice || "dry");
  try {
    const bytes = await imagineHeatBytes(
      `Photoreal adult 25-35 close phone portrait, ${voice} energy, SFW-sexy, clothes on, looking slightly off-camera, dim indoor crimson lamp, no celebrity likeness, no real-person copy, no text, no watermark, not hardcore. Mood only, not a named identity (${name.slice(0, 12)}).`,
      "3:4"
    );
    const url = await uploadHeatBytes({
      bucket: "heat-faces",
      path: `${user.id}/${Date.now().toString(36)}.jpg`,
      bytes,
      contentType: "image/jpeg",
    });
    const threadId = String(body.threadId || "");
    if (threadId) {
      const supabase = createServiceClient();
      await supabase.from("heat_threads").update({ contact_face_url: url }).eq("id", threadId).eq("user_id", user.id);
    }
    return NextResponse.json({ url });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Face failed" }, { status: 500 });
  }
}
