import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { lastSeenLabel } from "@/lib/heat-check";
import {
  asHeat,
  asLook,
  asOrientation,
  asPronouns,
  asRole,
  asSkin,
  asStarter,
  asVoice,
  fallbackHeatTurn,
  generateContactFace,
  heatMessageRow,
  pickContactName,
  requireHeatPlayer,
  runHeatTurn,
  signedUploadUrl,
  splitThem,
  withTimeout,
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
    const they_look = asLook(body.they_look);
    const they_pronouns = asPronouns(body.they_pronouns);
    const they_orientation = asOrientation(body.they_orientation);
    if (!ctx.settings.skins[skin]) {
      return NextResponse.json({ error: "That skin is off." }, { status: 400 });
    }
    const user_photo_path = typeof body.user_photo_path === "string" ? body.user_photo_path : null;
    const uploadedUrl = typeof body.user_photo_url === "string" ? body.user_photo_url : null;
    const generate_face = !!body.generate_face && ctx.settings.face_gen && !user_photo_path;
    const faceSeed = typeof body.face_seed === "string" ? body.face_seed : "";
    const peek = body.peek == null ? ctx.settings.peek_default : !!body.peek;

    const supabase = createServiceClient();
    const contact_name = await pickContactName(supabase, user.id, they_look);

    let contact_face_url: string | null = uploadedUrl;
    if (!contact_face_url && user_photo_path) {
      contact_face_url = (await signedUploadUrl(user_photo_path)) || null;
    }
    let facePrompt: string | null = user_photo_path ? "user-uploaded contact still" : null;
    let faceError: string | null = null;

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
        they_start: who_starts === "they",
        they_look,
        they_pronouns,
        they_orientation,
        skin,
        mood: "same",
        user_photo_path,
        user_photo_url: user_photo_path,
        generate_face,
        reward_photo_sent: false,
        peek,
        ended: false,
        status: "active",
        last_seen_label: lastSeenLabel(),
        meta: {
          face_prompt: facePrompt,
          face_seed: faceSeed || null,
          look: they_look,
          pronouns: they_pronouns,
          orientation: they_orientation,
          face_error: faceError,
        },
      })
      .select("*")
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: error?.message || "Could not open the thread." }, { status: 500 });
    }

    let messages: unknown[] = [];
    let tip = null;

    const faceJob =
      generate_face && !contact_face_url
        ? withTimeout(
            generateContactFace(user.id, faceSeed, {
              look: they_look,
              pronouns: they_pronouns,
              orientation: they_orientation,
            }),
            22000,
            "Face gen timed out",
          )
            .then((face) => {
              contact_face_url = face.url;
              facePrompt = face.prompt;
            })
            .catch((err: unknown) => {
              console.error("heat face gen", err);
              faceError = err instanceof Error ? err.message : "Face didn't render. Thread still opens.";
            })
        : Promise.resolve();

    const openingJob =
      who_starts === "they"
        ? withTimeout(
            runHeatTurn({
              thread,
              history: [],
              userLine: null,
              opening: true,
              fade: false,
              doubleText: false,
              lastScores: [],
              settings: ctx.settings,
            }),
            28000,
            "Opening timed out",
          ).catch((err: unknown) => {
            console.error("heat opening", err);
            return fallbackHeatTurn(true);
          })
        : Promise.resolve(null);

    const [turn] = await Promise.all([openingJob, faceJob]);

    if (contact_face_url || faceError) {
      await supabase
        .from("heat_threads")
        .update({
          contact_face_url,
          meta: {
            face_prompt: facePrompt,
            face_seed: faceSeed || null,
            look: they_look,
            pronouns: they_pronouns,
            orientation: they_orientation,
            face_error: faceError,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", thread.id);
      thread.contact_face_url = contact_face_url;
    }

    if (turn) {
      const bubbles = splitThem(turn.scene);
      const rows = bubbles.map((bodyText) =>
        heatMessageRow({
          thread_id: thread.id,
          user_id: user.id,
          sender: "them",
          body: bodyText,
          delivered_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
        }),
      );
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

    return NextResponse.json({ thread, messages, tip, faceError });
  } catch (err: unknown) {
    console.error("heat start", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Start failed" }, { status: 500 });
  }
}
