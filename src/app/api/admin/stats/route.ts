import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("created_at");

    const { data: judgments } = await supabase
      .from("judgments")
      .select("score, style, focus, rarity, created_at");

    const total = judgments?.length || 0;
    const avgScore =
      total > 0
        ? judgments!.reduce((sum, j) => sum + Number(j.score), 0) / total
        : 0;

    const styleCounts: Record<string, number> = {};
    const focusCounts: Record<string, number> = {};
    const rarityCounts: Record<string, number> = {};
    const scoreBuckets: Record<string, number> = {
      "1-2": 0,
      "3-4": 0,
      "5-6": 0,
      "7-8": 0,
      "9-10": 0,
    };

    (judgments || []).forEach((j) => {
      styleCounts[j.style] = (styleCounts[j.style] || 0) + 1;
      focusCounts[j.focus] = (focusCounts[j.focus] || 0) + 1;
      rarityCounts[j.rarity] = (rarityCounts[j.rarity] || 0) + 1;

      const s = Number(j.score);
      if (s <= 2) scoreBuckets["1-2"]++;
      else if (s <= 4) scoreBuckets["3-4"]++;
      else if (s <= 6) scoreBuckets["5-6"]++;
      else if (s <= 8) scoreBuckets["7-8"]++;
      else scoreBuckets["9-10"]++;
    });

    // Last 14 days activity
    const days = lastNDays(14);
    const judgmentsByDay: Record<string, number> = {};
    const usersByDay: Record<string, number> = {};
    days.forEach((d) => {
      judgmentsByDay[d] = 0;
      usersByDay[d] = 0;
    });

    (judgments || []).forEach((j) => {
      const key = dayKey(new Date(j.created_at));
      if (key in judgmentsByDay) judgmentsByDay[key]++;
    });

    (profiles || []).forEach((p) => {
      const key = dayKey(new Date(p.created_at));
      if (key in usersByDay) usersByDay[key]++;
    });

    const activity = days.map((d) => ({
      date: d,
      label: d.slice(5), // MM-DD
      judgments: judgmentsByDay[d],
      users: usersByDay[d],
    }));

    // Today / week
    const today = dayKey(new Date());
    const weekDays = lastNDays(7);
    const judgmentsToday = judgmentsByDay[today] || 0;
    const usersToday = usersByDay[today] || 0;
    const judgmentsWeek = weekDays.reduce((s, d) => s + (judgmentsByDay[d] || 0), 0);
    const usersWeek = weekDays.reduce((s, d) => s + (usersByDay[d] || 0), 0);

    return NextResponse.json({
      users: userCount || 0,
      judgments: total,
      avgScore: Math.round(avgScore * 10) / 10,
      judgmentsToday,
      usersToday,
      judgmentsWeek,
      usersWeek,
      styleCounts,
      focusCounts,
      rarityCounts,
      scoreBuckets,
      activity,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
