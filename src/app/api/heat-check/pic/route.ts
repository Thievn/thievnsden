import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { HEAT_POSE_KINDS, heatPicMayMint, poseKindFromAsk, type HeatPoseKind } from "@/lib/heat-check";
import { requireHeatPlayer } from "@/lib/heat-check-server";
import { deliverHeatPic, heatCreditBalance, spendHeatCredit } from "@/lib/heat-pic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireHeatPlayer(req);
    if ("error" in ctx && ctx.error) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const user = ctx.user!;
    if (!heatPicMayMint(ctx.settings.pics_on)) {
      return NextResponse.json({ error: "Pics are off." }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const threadId = String(body.threadId || "");
    const ask = String(body.ask || "");
    const kind = (HEAT_POSE_KINDS.some((p) => p.id === body.kind) ? body.kind : poseKindFromAsk(ask)) as HeatPoseKind;
    if (!threadId) return NextResponse.json({ error: "Need a night." }, { status: 400 });

    const supabase = createServiceClient();
    const { data: thread } = await supabase
      .from("heat_threads")
      .select("id, look_key, they_look, presentation, appearance, contact_id, contact_name, contact_face_url, meta, ended, mood, heat")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!thread) return NextResponse.json({ error: "Night gone." }, { status: 404 });
    if (thread.ended) return NextResponse.json({ error: "This one already faded." }, { status: 409 });

    const { data: history } = await supabase
      .from("heat_messages")
      .select("sender, role, body, image_url")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    const usedUrls = (history || []).map((m) => String(m.image_url || "")).filter(Boolean);
    const recent = (history || [])
      .map((m) => String(m.body || "").trim())
      .filter(Boolean)
      .slice(-6);

    const fast = await deliverHeatPic({
      userId: user.id,
      threadId,
      kind,
      ask,
      settings: ctx.settings,
      thread,
      mint: false,
      usedUrls,
      recent,
    });
    if (fast) {
      const credits = await heatCreditBalance(user.id);
      return NextResponse.json({
        them: fast.message ? [fast.message] : [],
        url: fast.url,
        cached: true,
        billed: { billed: 0, free: true },
        credits,
      });
    }

    const delivered = await deliverHeatPic({
      userId: user.id,
      threadId,
      kind,
      ask,
      settings: ctx.settings,
      thread,
      mint: true,
      usedUrls,
      recent,
    });
    if (!delivered) {
      return NextResponse.json({ error: "That still took too long. Ask again in a second.", toast: true }, { status: 504 });
    }
    let billed = { billed: 0, extra: 0, free: true };
    if (delivered.minted) {
      billed = await spendHeatCredit(user.id, ctx.settings.pic_cost);
    }
    const credits = await heatCreditBalance(user.id);
    return NextResponse.json({
      them: delivered.message ? [delivered.message] : [],
      url: delivered.url,
      cached: delivered.cached,
      billed,
      credits,
    });
  } catch (err: unknown) {
    console.error("heat pic", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Pic failed",
      toast: true,
    }, { status: 500 });
  }
}
