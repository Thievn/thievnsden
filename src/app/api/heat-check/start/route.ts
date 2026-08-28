import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { lastSeenLabel } from "@/lib/heat-check";
import {
  asHeat,
  asRole,
  asSkin,
  asStarter,
  asVoice,
  generateContactFace,
  pickContactName,
  requireHeatPlayer,
  runHeatTurn,
  splitThem,
} from "@/lib/heat-check-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireHeatPlayer(req);
    if ("error" in ctx && ctx.error) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const user = ctx.user!;
    const body = await req.json().catch(() => ({}));
    const role = asRole(body.role);
    const heat = asHeat(body.heat);
    const voice = asVoice(body.voice);
    const who_starts = asStarter(body.who_starts);
    const skin = asSkin(body.skin);
    if (!ctx.settings.skins[skin]) {
      return NextResponse.json({ error: "That skin is off." }, { status: 400 });
    }
    const generate_face = !!body.generate_face && ctx.settings.face_gen;
    const user_photo_path = typeof body.user_photo_path === "string" ? body.user_photo_path : null;
    const faceSeed = typeof body.face_seed === "string" ? body.face_seed : "";
    const peek = body.peek == null ? ctx.settings.peek_default : !!body.peek;

    const supabase = createServiceClient();
    const contact_name = await pickContactName(supabase, user.id);

    let contact_face_url: string | null = null;
    let facePrompt: string | null = null;
    if (generate_face) {
      try {
        const face = await generateContactFace(user.id, faceSeed);
        contact_face_url = face.url;
        facePrompt = face.prompt;
      } catch (err) {
        console.error("heat face gen", err);
      }
    }

    const { data: thread, error } = await supabase
      .from("heat_threads")
      .insert({
        user_id: user.id,
        contact_name,
        contact_face_url,
        role,
        heat,
        voice,
        who_starts,
        skin,
        mood: "same",
        user_photo_path,
        generate_face,
        reward_photo_sent: false,
        peek,
        ended: false,
        last_seen_label: lastSeenLabel(),
        meta: { face_prompt: facePrompt, face_seed: faceSeed || null },
      })
      .select("*")
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: error?.message || "Could not open the thread." }, { status: 500 });
    }

    let messages: unknown[] = [];
    let tip = null;

    if (who_starts === "they") {
      const turn = await runHeatTurn({
        thread,
        history: [],
        userLine: null,
        opening: true,
        fade: false,
        doubleText: false,
        lastScores: [],
        settings: ctx.settings,
      });
      const bubbles = splitThem(turn.scene);
      const rows = bubbles.map((bodyText) => ({
        thread_id: thread.id,
        user_id: user.id,
        sender: "them",
        body: bodyText,
        delivered_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
      }));
      const { data: inserted } = await supabase.from("heat_messages").insert(rows).select("*");
      messages = inserted || [];
      const firstId = (inserted && inserted[0]?.id) || null;
      const { data: tipRow } = await supabase
        .from("heat_tips")
        .insert({
          thread_id: thread.id,
          message_id: firstId,
          user_id: user.id,
          tip: turn.tip || "Match their pace. Don't dump the whole night in one bubble.",
          score: turn.score,
          rewrite: turn.rewrite,
          mood: turn.mood,
        })
        .select("*")
        .single();
      tip = tipRow;
      if (turn.mood && turn.mood !== "same") {
        await supabase.from("heat_threads").update({ mood: turn.mood, updated_at: new Date().toISOString() }).eq("id", thread.id);
        thread.mood = turn.mood;
      }
    }

    return NextResponse.json({ thread, messages, tip });
  } catch (err: unknown) {
    console.error("heat start", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Start failed" }, { status: 500 });
  }
}
