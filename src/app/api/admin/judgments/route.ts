import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const style = searchParams.get("style");
    const focus = searchParams.get("focus");
    const rarity = searchParams.get("rarity");

    let query = supabase
      .from("judgments")
      .select("id, user_id, style, focus, filthy_mode, score, rarity, verdict, is_public, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (style) query = query.eq("style", style);
    if (focus) query = query.eq("focus", focus);
    if (rarity) query = query.eq("rarity", rarity);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = [...new Set((data || []).map((j) => j.user_id).filter(Boolean))];
    let nameMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      (profiles || []).forEach((p) => {
        nameMap[p.id] = p.username || "—";
      });
    }

    const judgments = (data || []).map((j) => ({
      ...j,
      username: j.user_id ? nameMap[j.user_id] || "Unknown" : "Anonymous",
    }));

    return NextResponse.json({ judgments });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    // Bulk delete
    if (Array.isArray(body.judgmentIds) && body.judgmentIds.length > 0) {
      const { error } = await supabase.from("judgments").delete().in("id", body.judgmentIds);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAudit({
        action: "bulk_delete_judgments",
        details: `Deleted ${body.judgmentIds.length} judgments`,
      });
      return NextResponse.json({ success: true, count: body.judgmentIds.length });
    }

    if (body.userId) {
      const { error } = await supabase.from("judgments").delete().eq("user_id", body.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAudit({
        action: "nuke_user_judgments",
        target: body.userId,
      });
      return NextResponse.json({ success: true });
    }

    if (!body.judgmentId) {
      return NextResponse.json({ error: "judgmentId required" }, { status: 400 });
    }

    const { error } = await supabase.from("judgments").delete().eq("id", body.judgmentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAudit({
      action: "delete_judgment",
      target: body.judgmentId,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { judgmentId, is_public } = await req.json();
    if (!judgmentId) {
      return NextResponse.json({ error: "judgmentId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("judgments")
      .update({ is_public: !!is_public })
      .eq("id", judgmentId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAudit({
      action: is_public ? "publish_judgment" : "hide_judgment",
      target: judgmentId,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}
