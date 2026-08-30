import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { HEAT_POSE_KINDS, poseKindFromAsk, type HeatPoseKind } from "@/lib/heat-check";
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
    if (!ctx.settings.pics_on) {
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
      .select("id, look_key, they_look, presentation, appearance, contact_id, contact_name, meta, ended")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!thread) return NextResponse.json({ error: "Night gone." }, { status: 404 });
    if (thread.ended) return NextResponse.json({ error: "This one already faded." }, { status: 409 });

    const spent = await spendHeatCredit(user.id, ctx.settings.pic_cost);
    try {
      const delivered = await deliverHeatPic({
        userId: user.id,
        threadId,
        kind,
        ask,
        settings: ctx.settings,
        thread,
      });
      const credits = await heatCreditBalance(user.id);
      return NextResponse.json({
        them: delivered.message ? [delivered.message] : [],
        url: delivered.url,
        cached: delivered.cached,
        billed: spent,
        credits,
      });
    } catch (err) {
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from("heat_credits").upsert({
        user_id: user.id,
        extra: spent.free ? spent.extra : spent.extra + spent.billed,
        free_used_on: spent.free ? null : today,
        updated_at: new Date().toISOString(),
      });
      throw err;
    }
  } catch (err: unknown) {
    console.error("heat pic", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Pic failed" }, { status: 500 });
  }
}
