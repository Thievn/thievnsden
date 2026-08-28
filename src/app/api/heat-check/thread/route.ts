import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";
import { grokHeatTurn, loadHeatSettings, mayPlayHeat, pickHeatName, threadSetupLine, wipeHeatThread } from "@/lib/heat-check-server";
import { HEAT_SKINS, blocksMinors, catalogFromSettings } from "@/lib/heat-check";

export const runtime = "nodejs";
export const maxDuration = 60;

function ids<T extends { id: string }>(list: readonly T[]) {
  return new Set(list.map((x) => x.id));
}

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in to open a thread." }, { status: 401 });
  const supabase = createServiceClient();
  const { data: threads } = await supabase
    .from("heat_threads")
    .select("id, skin, role, heat, voice, contact_name, contact_face_url, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(40);
  const { data: saves } = await supabase
    .from("heat_saves")
    .select("id, body, source_thread, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);
  const settings = await loadHeatSettings();
  const catalog = catalogFromSettings(settings);
  return NextResponse.json({
    threads: threads || [],
    saves: saves || [],
    play: await mayPlayHeat(user, settings),
    peek_default: settings.peek_default,
    face_gen: settings.face_gen,
    skins: { ios: settings.skins_ios, android: settings.skins_android },
    catalog,
  });
}

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in to open a thread." }, { status: 401 });
  const settings = await loadHeatSettings();
  if (!(await mayPlayHeat(user, settings))) {
    return NextResponse.json({ error: "Coming soon." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const role = String(body.role || "");
  const heat = String(body.heat || "");
  const voice = String(body.voice || "");
  const skin = String(body.skin || "ios");
  const catalog = catalogFromSettings(settings);
  const roleIds = new Set(catalog.roles.map((x) => x.id));
  const heatIds = new Set(catalog.heats.map((x) => x.id));
  const voiceIds = new Set(catalog.voices.map((x) => x.id));
  if (!roleIds.has(role) || !heatIds.has(heat) || !voiceIds.has(voice)) {
    return NextResponse.json({ error: "Pick a setup." }, { status: 400 });
  }
  if (!ids(HEAT_SKINS).has(skin)) return NextResponse.json({ error: "Pick a skin." }, { status: 400 });
  if (skin === "ios" && !settings.skins_ios) return NextResponse.json({ error: "That skin is off." }, { status: 400 });
  if (skin === "android" && !settings.skins_android) return NextResponse.json({ error: "That skin is off." }, { status: 400 });

  const they_start = body.they_start !== false;
  const supabase = createServiceClient();
  const contact_name = await pickHeatName(user.id);
  const { data: thread, error } = await supabase
    .from("heat_threads")
    .insert({
      user_id: user.id,
      skin,
      role,
      heat,
      voice,
      they_start,
      contact_name,
      contact_face_url: body.contact_face_url || null,
      user_photo_url: body.user_photo_url || null,
      peek: body.peek !== false && settings.peek_default,
      status: "active",
      mood: "same",
    })
    .select()
    .single();
  if (error || !thread) {
    return NextResponse.json({ error: error?.message || "Could not open." }, { status: 500 });
  }

  let opener: {
    scene?: string;
    tip?: string;
    score?: number;
    rewrite?: string | null;
    mood?: string;
    read_delay_ms?: number;
    message_id?: string;
  } | null = null;
  if (they_start) {
    const turn = await grokHeatTurn({
      settings,
      setup: threadSetupLine({
        role,
        heat,
        voice,
        they_start,
        contact_name,
        user_photo: !!body.user_photo_url,
      }),
      history: "",
      lastUser: "",
      extra: "They text first. Opening beat. Consent first. Score 0.",
    });
    if (blocksMinors(turn.scene)) {
      await supabase.from("heat_threads").update({ status: "ended" }).eq("id", thread.id);
      return NextResponse.json({ error: "That scene is closed." }, { status: 400 });
    }
    const { data: msg } = await supabase
      .from("heat_messages")
      .insert({ thread_id: thread.id, role: "them", body: turn.scene })
      .select()
      .single();
    if (msg && turn.tip) {
      await supabase.from("heat_tips").insert({
        message_id: msg.id,
        thread_id: thread.id,
        score: 0,
        tip: turn.tip,
        rewrite: turn.rewrite,
      });
    }
    if (turn.mood && turn.mood !== "same") {
      await supabase.from("heat_threads").update({ mood: turn.mood }).eq("id", thread.id);
    }
    opener = { ...turn, message_id: msg?.id };
  }

  return NextResponse.json({ thread, opener });
}

export async function PATCH(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing" }, { status: 400 });
  const supabase = createServiceClient();
  const { data: row } = await supabase.from("heat_threads").select("*").eq("id", id).maybeSingle();
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: "No" }, { status: 403 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.skin === "ios" || body.skin === "android") patch.skin = body.skin;
  if (typeof body.peek === "boolean") patch.peek = body.peek;
  if (body.status === "ended" || body.status === "recap") patch.status = body.status;
  const { error } = await supabase.from("heat_threads").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const supabase = createServiceClient();
  const { data: row } = await supabase.from("heat_threads").select("*").eq("id", id).maybeSingle();
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: "No" }, { status: 403 });
  await wipeHeatThread(id);
  return NextResponse.json({ ok: true });
}
