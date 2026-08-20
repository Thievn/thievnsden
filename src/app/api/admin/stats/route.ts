import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { data: judgments } = await supabase
      .from("judgments")
      .select("score, style, focus, rarity");

    const total = judgments?.length || 0;
    const avgScore =
      total > 0
        ? judgments!.reduce((sum, j) => sum + Number(j.score), 0) / total
        : 0;

    const styleCounts: Record<string, number> = {};
    const focusCounts: Record<string, number> = {};
    const rarityCounts: Record<string, number> = {};

    (judgments || []).forEach((j) => {
      styleCounts[j.style] = (styleCounts[j.style] || 0) + 1;
      focusCounts[j.focus] = (focusCounts[j.focus] || 0) + 1;
      rarityCounts[j.rarity] = (rarityCounts[j.rarity] || 0) + 1;
    });

    return NextResponse.json({
      users: userCount || 0,
      judgments: total,
      avgScore: Math.round(avgScore * 10) / 10,
      styleCounts,
      focusCounts,
      rarityCounts,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
