import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { EMPTY_GARAGE, scrapFromRun } from "@/lib/highway-garage";

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
    if (!userId) return NextResponse.json({ error: "Need an account to save the board and scrap." }, { status: 401 });
    const { data: auth } = await supabase.auth.admin.getUserById(userId);
    if (!auth?.user) return NextResponse.json({ error: "Invalid" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("id", userId).maybeSingle();
    const username =
      profile?.username || profile?.display_name || auth.user.email?.split("@")[0] || "anon";
    const score = Math.max(0, Number(body.score) || 0);
    const row = {
      user_id: userId,
      username,
      score,
      grade: String(body.grade || "D").slice(0, 2),
      distance: Math.max(0, Number(body.distance) || 0),
      kills: Math.max(0, Number(body.kills) || 0),
      civ_hits: Math.max(0, Number(body.civHits) || 0),
      combo_max: Math.max(0, Number(body.comboMax) || 0),
    };
    const { error } = await supabase.from("highway_runs").insert(row);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: garageRow } = await supabase.from("highway_garage").select("*").eq("user_id", userId).maybeSingle();
    const rebirths = garageRow?.rebirths || 0;
    const scrap = (garageRow?.scrap || 0) + scrapFromRun(score, rebirths);
    await supabase.from("highway_garage").upsert({
      user_id: userId,
      scrap,
      rebirths,
      hull: garageRow?.hull || 0,
      cannons: garageRow?.cannons || 0,
      turbo: garageRow?.turbo || 0,
      mag: garageRow?.mag || 0,
      coolant: garageRow?.coolant || 0,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      scrapGain: scrapFromRun(score, rebirths),
      garage: { ...EMPTY_GARAGE, ...(garageRow || {}), scrap, rebirths },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
