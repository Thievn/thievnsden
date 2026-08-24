import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("highway_runs")
      .select("username, score, grade, distance, kills, created_at")
      .order("score", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ rows: [], error: error.message });
    return NextResponse.json({ rows: data || [] });
  } catch (err: any) {
    return NextResponse.json({ rows: [], error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();
    const userId = String(body.userId || "");
    if (!userId) return NextResponse.json({ error: "Need account" }, { status: 401 });
    const { data: auth } = await supabase.auth.admin.getUserById(userId);
    if (!auth?.user) return NextResponse.json({ error: "Invalid" }, { status: 401 });
    const username =
      auth.user.user_metadata?.username || auth.user.email?.split("@")[0] || "anon";
    const row = {
      user_id: userId,
      username,
      score: Math.max(0, Number(body.score) || 0),
      grade: String(body.grade || "D").slice(0, 2),
      distance: Math.max(0, Number(body.distance) || 0),
      kills: Math.max(0, Number(body.kills) || 0),
      civ_hits: Math.max(0, Number(body.civHits) || 0),
      combo_max: Math.max(0, Number(body.comboMax) || 0),
    };
    const { error } = await supabase.from("highway_runs").insert(row);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
