import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";
import { loadHeatSettings, mayPlayHeat, uploadHeatBytes } from "@/lib/heat-check-server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const settings = await loadHeatSettings();
  if (!(await mayPlayHeat(user, settings))) return NextResponse.json({ error: "Coming soon." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo." }, { status: 400 });
  if (file.size > 4_500_000) return NextResponse.json({ error: "Too heavy." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const url = await uploadHeatBytes({
    bucket: "heat-uploads",
    path: `${user.id}/${Date.now().toString(36)}.jpg`,
    bytes,
    contentType: file.type || "image/jpeg",
  });
  const threadId = String(form?.get("threadId") || "");
  if (threadId) {
    const supabase = createServiceClient();
    await supabase.from("heat_threads").update({ user_photo_url: url }).eq("id", threadId).eq("user_id", user.id);
  }
  return NextResponse.json({ url });
}
