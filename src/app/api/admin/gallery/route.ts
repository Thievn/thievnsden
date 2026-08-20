import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: publicCards, error } = await supabase
      .from("judgments")
      .select(
        "id, user_id, style, focus, score, rarity, verdict, image_url, is_public, is_demo, likes, dislikes, created_at"
      )
      .eq("is_public", true)
      .order("likes", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = publicCards || [];
    const userIds = [...new Set(rows.map((j) => j.user_id).filter(Boolean))];
    let nameMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds as string[]);
      (profiles || []).forEach((p) => {
        nameMap[p.id] = p.username || "—";
      });
    }

    const cards = rows.map((j) => ({
      ...j,
      username: j.user_id ? nameMap[j.user_id] || "Unknown" : "Anonymous",
      ratio:
        (j.likes || 0) + (j.dislikes || 0) > 0
          ? (j.likes || 0) / ((j.likes || 0) + (j.dislikes || 0))
          : null,
    }));

    const topLiked = [...cards].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10);
    const topDisliked = [...cards]
      .sort((a, b) => (b.dislikes || 0) - (a.dislikes || 0))
      .slice(0, 10);

    const totalLikes = cards.reduce((s, c) => s + (c.likes || 0), 0);
    const totalDislikes = cards.reduce((s, c) => s + (c.dislikes || 0), 0);
    const demoCount = cards.filter((c) => c.is_demo).length;

    return NextResponse.json({
      cards,
      topLiked,
      topDisliked,
      stats: {
        publicCount: cards.length,
        totalLikes,
        totalDislikes,
        demoCount,
        realCount: cards.length - demoCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { judgmentId, is_public } = await req.json();
    if (!judgmentId || typeof is_public !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("judgments")
      .update({ is_public })
      .eq("id", judgmentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAudit({
      action: is_public ? "gallery_publish" : "gallery_unpublish",
      target: judgmentId,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { judgmentId } = await req.json();
    if (!judgmentId) {
      return NextResponse.json({ error: "judgmentId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("judgments").delete().eq("id", judgmentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAudit({
      action: "gallery_delete",
      target: judgmentId,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
