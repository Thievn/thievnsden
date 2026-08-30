import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { mintHeatContact } from "@/lib/heat-face-cache";
import { requireHeatPlayer } from "@/lib/heat-check-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireHeatPlayer(req);
    if ("error" in ctx && ctx.error) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const user = ctx.user!;
    if (!ctx.settings.face_gen) {
      return NextResponse.json({ url: null, skipped: true });
    }
    const body = await req.json().catch(() => ({}));
    const threadId = String(body.threadId || "");
    if (!threadId) return NextResponse.json({ error: "Need a night." }, { status: 400 });

    const supabase = createServiceClient();
    const { data: thread } = await supabase
      .from("heat_threads")
      .select("id, contact_name, contact_face_url, generate_face, they_look, presentation, appearance, look_key, meta")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!thread) return NextResponse.json({ error: "Night gone." }, { status: 404 });
    if (thread.contact_face_url) {
      return NextResponse.json({ url: thread.contact_face_url, already: true });
    }
    if (!thread.generate_face) {
      return NextResponse.json({ url: null, skipped: true });
    }

    const meta = (thread.meta || {}) as { face_prompt?: string; look?: string; presentation?: string; appearance?: string };
    const minted = await mintHeatContact({
      userId: user.id,
      threadId: thread.id,
      name: thread.contact_name,
      who: String(thread.they_look || meta.look || "woman"),
      presentation: String(thread.presentation || meta.presentation || "default"),
      appearance: String(thread.appearance || meta.appearance || "any"),
      look_key: String(thread.look_key || ""),
      face_prompt: String(meta.face_prompt || ""),
    });
    return NextResponse.json({ url: minted.url, contact_id: minted.contact_id });
  } catch (err: unknown) {
    console.error("heat face", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Face failed" }, { status: 500 });
  }
}
