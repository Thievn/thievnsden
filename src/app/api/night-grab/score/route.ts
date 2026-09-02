import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { BadgeId } from "@/lib/night-grab";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "";
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("night_grab_runs")
      .select("username, score, extracted, clocked, combo, floor, loadout, badges, created_at")
      .gte("created_at", since.toISOString())
      .order("score", { ascending: false })
      .limit(40);
    if (error) return NextResponse.json({ rows: [], error: error.message });
    let meta = null;
    if (userId) {
      const { data: m } = await supabase.from("night_grab_meta").select("*").eq("user_id", userId).maybeSingle();
      meta = m;
    }
    const { data: settings } = await supabase.from("site_settings").select("night_grab_live").eq("id", 1).maybeSingle();
    return NextResponse.json({ rows: data || [], meta, live: settings?.night_grab_live !== false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ rows: [], error: message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();
    const { data: settings } = await supabase.from("site_settings").select("night_grab_live").eq("id", 1).maybeSingle();
    if (settings && settings.night_grab_live === false) {
      return NextResponse.json({ error: "Board is dark." }, { status: 403 });
    }
    const userId = String(body.userId || "");
    if (!userId) return NextResponse.json({ error: "Need an account to save the board." }, { status: 401 });
    const { data: auth } = await supabase.auth.admin.getUserById(userId);
    if (!auth?.user) return NextResponse.json({ error: "Invalid" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("id", userId).maybeSingle();
    const username = profile?.username || profile?.display_name || auth.user.email?.split("@")[0] || "anon";
    const score = Math.max(0, Math.floor(Number(body.score) || 0));
    const extracted = Math.max(0, Math.floor(Number(body.extracted) || 0));
    const clocked = Math.max(0, Math.floor(Number(body.clocked) || 0));
    const combo = Math.max(1, Math.min(4, Math.floor(Number(body.combo) || 1)));
    const floor = String(body.floor || "offices").slice(0, 24);
    const loadout = String(body.loadout || "").slice(0, 24);
    const badges = Array.isArray(body.badges) ? (body.badges as BadgeId[]).slice(0, 8) : [];
    const { error } = await supabase.from("night_grab_runs").insert({
      user_id: userId,
      username,
      score,
      extracted,
      clocked,
      combo,
      floor,
      loadout,
      badges,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: prev } = await supabase.from("night_grab_meta").select("*").eq("user_id", userId).maybeSingle();
    const best = Math.max(prev?.best_score || 0, score);
    const bestCombo = Math.max(prev?.best_combo || 0, combo);
    const extracts = (prev?.extracts || 0) + (extracted > 0 ? 1 : 0);
    const merged = Array.from(new Set([...(prev?.badges || []), ...badges]));
    await supabase.from("night_grab_meta").upsert({
      user_id: userId,
      best_score: best,
      best_combo: bestCombo,
      extracts,
      badges: merged,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({
      success: true,
      meta: { best_score: best, best_combo: bestCombo, extracts, badges: merged },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
