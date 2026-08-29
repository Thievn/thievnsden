import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { lastSeenLabel } from "@/lib/heat-check";
import { lookupCompiledPrompt } from "@/lib/heat-prompt-cache";
import { mintHeatContact, pickHeatFace } from "@/lib/heat-face-cache";
import {
  asAppearance,
  asHeat,
  asLook,
  asOrientation,
  asPresentation,
  asPronouns,
  asRole,
  asSkin,
  asStarter,
  asVoice,
  fallbackHeatTurn,
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
    const presentation = asPresentation(body.presentation ?? body.look);
    const appearance = asAppearance(body.appearance);
    const newContact = !!body.new_contact;
    if (!ctx.settings.skins[skin]) {
      return NextResponse.json({ error: "That skin is off." }, { status: 400 });
    }
    const contactOverridePath = typeof body.user_photo_path === "string" ? body.user_photo_path : null;
    const contactOverrideUrl = typeof body.user_photo_url === "string" ? body.user_photo_url : null;
    const generate_face = !!body.generate_face && ctx.settings.face_gen && !contactOverridePath && !contactOverrideUrl;
    const faceSeed = typeof body.face_seed === "string" ? body.face_seed : "";
    const peek = body.peek == null ? ctx.settings.peek_default : !!body.peek;

    const supabase = createServiceClient();
    const contact_name = await pickContactName(supabase, user.id, they_look);

    const facePick = await pickHeatFace({
      userId: user.id,
      who: they_look,
      presentation,
      appearance,
      name: contact_name,
      generate: generate_face,
      newContact,
    });

    let contact_face_url: string | null = contactOverrideUrl;
    if (!contact_face_url && contactOverridePath) {
      contact_face_url = (await signedUploadUrl(contactOverridePath)) || contactOverridePath;
    }
    if (!contact_face_url) contact_face_url = facePick.face_url;
    const facePrompt = facePick.face_prompt;

    const compiled = await lookupCompiledPrompt({ role, heat, voice, opener: who_starts });

    const { data: thread, error } = await supabase
      .from("heat_threads")
      .insert({
        user_id: user.id,
        contact_name: facePick.contact_name || contact_name,
        contact_face_url,
        role,
        heat,
        voice,
        who_starts,
        they_start: who_starts === "they",
        they_look,
        they_pronouns,
        they_orientation,
        presentation: facePick.presentation,
        appearance: facePick.appearance,
        look_key: facePick.look_key,
        contact_id: facePick.contact_id,
        skin,
        mood: "same",
        user_photo_path: null,
        user_photo_url: null,
        generate_face,
        reward_photo_sent: false,
        peek,
        ended: false,
        status: "active",
        last_seen_label: lastSeenLabel(),
        opener: who_starts,
        compiled_hash: compiled.hash || null,
        meta: {
          face_prompt: facePrompt,
          face_seed: faceSeed || null,
          look: they_look,
          presentation: facePick.presentation,
          appearance: facePick.appearance,
          pronouns: they_pronouns,
          orientation: they_orientation,
        },
      })
      .select("*")
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: error?.message || "Could not open the night." }, { status: 500 });
    }

    let messages: unknown[] = [];

    const faceRetry = async () => {
      if (!facePick.mint || contact_face_url) return;
      for (let i = 0; i < 2; i++) {
        try {
          await mintHeatContact({
            userId: user.id,
            threadId: thread.id,
            name: thread.contact_name,
            who: they_look,
            presentation: facePick.presentation,
            appearance: facePick.appearance,
            look_key: facePick.look_key,
            face_prompt: facePrompt,
          });
          return;
        } catch (err) {
          console.error("heat face gen", err);
        }
      }
    };
    void faceRetry();

    if (who_starts === "they") {
      const turn = await withTimeout(
        runHeatTurn({
          thread,
          history: [],
          userLine: null,
          opening: true,
          fade: false,
          doubleText: false,
          lastScores: [],
          settings: ctx.settings,
          compiledSystem: compiled.compiled || undefined,
        }),
        28000,
        "Opening timed out",
      ).catch((err: unknown) => {
        console.error("heat opening", err);
        return fallbackHeatTurn(true);
      });
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
      if (turn.mood && turn.mood !== "same") {
        await supabase.from("heat_threads").update({ mood: turn.mood, updated_at: new Date().toISOString() }).eq("id", thread.id);
        thread.mood = turn.mood;
      }
    }

    return NextResponse.json({ thread, messages, tip: null, faceError: null, promptHit: compiled.hit });
  } catch (err: unknown) {
    console.error("heat start", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Start failed" }, { status: 500 });
  }
}
