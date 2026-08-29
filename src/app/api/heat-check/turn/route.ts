import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isFadeText, type HeatThread } from "@/lib/heat-check";
import { lookupCompiledPrompt } from "@/lib/heat-prompt-cache";
import {
  buildRecap,
  fallbackHeatTurn,
  generateRewardStill,
  requireHeatPlayer,
  runHeatTurn,
  signedUploadUrl,
  heatMessageRow,
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
    const body = await req.json();
    const threadId = String(body.threadId || "");
    const text = String(body.text || "").trim();
    if (!threadId || !text) {
      return NextResponse.json({ error: "Need a line." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: thread } = await supabase
      .from("heat_threads")
      .select("*")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!thread) return NextResponse.json({ error: "Night gone." }, { status: 404 });
    if (thread.ended) return NextResponse.json({ error: "This one already faded." }, { status: 409 });

    const { data: history } = await supabase
      .from("heat_messages")
      .select("id, sender, role, body, score, read_at, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    const prior = (history || []).map((m) => ({ ...m, sender: m.sender || m.role }));
    const lastUser = [...prior].reverse().find((m) => m.sender === "user");
    const doubleText = !!(lastUser && !lastUser.read_at);
    const fade = isFadeText(text) || !!body.fade;

    const now = new Date().toISOString();
    const { data: userMsg, error: userErr } = await supabase
      .from("heat_messages")
      .insert(
        heatMessageRow({
          thread_id: threadId,
          user_id: user.id,
          sender: "user",
          body: text,
          delivered_at: now,
        }),
      )
      .select("*")
      .single();
    if (userErr || !userMsg) {
      return NextResponse.json({ error: userErr?.message || "Could not send." }, { status: 500 });
    }

    const lastScores = prior.filter((m) => m.sender === "user" && m.score != null).map((m) => Number(m.score));
    let photoUrl: string | null = null;
    if (thread.user_photo_path) {
      photoUrl = await signedUploadUrl(thread.user_photo_path);
    }

    const compiled = await lookupCompiledPrompt({
      role: String(thread.role),
      heat: String(thread.heat),
      voice: String(thread.voice),
      opener: String(thread.opener || thread.who_starts || "they"),
    });
    let turn;
    try {
      turn = await withTimeout(
        runHeatTurn({
          thread: thread as HeatThread,
          history: [...prior, { sender: "user", body: text }],
          userLine: text,
          opening: prior.filter((m) => m.sender === "user").length === 0,
          fade,
          doubleText,
          lastScores,
          settings: ctx.settings,
          photoUrl,
          compiledSystem: compiled.compiled || undefined,
        }),
        28000,
        "Reply timed out",
      );
    } catch (err) {
      console.error("heat turn grok", err);
      turn = fallbackHeatTurn(false);
    }

    await supabase.from("heat_messages").update({ score: turn.score }).eq("id", userMsg.id);

    const { data: tip } = await supabase
      .from("heat_tips")
      .insert({
        thread_id: threadId,
        message_id: userMsg.id,
        user_id: user.id,
        tip: turn.tip || "Slow down. Let them chase a little.",
        score: turn.score,
        rewrite: turn.rewrite,
        mood: turn.mood,
      })
      .select("*")
      .single();

    const themRows = splitThem(turn.scene).map((bodyText) =>
      heatMessageRow({
        thread_id: threadId,
        user_id: user.id,
        sender: "them",
        body: bodyText,
      }),
    );

    let themMessages: Record<string, unknown>[] = [];
    if (themRows.length) {
      const { data: inserted } = await supabase.from("heat_messages").insert(themRows).select("*");
      themMessages = inserted || [];
    }

    let reward: { url: string } | null = null;
    if (turn.reward_photo && !thread.reward_photo_sent) {
      try {
        const facePrompt = String((thread.meta as { face_prompt?: string } | null)?.face_prompt || thread.contact_name);
        reward = await generateRewardStill(user.id, threadId, facePrompt);
        const { data: photoMsg } = await supabase
          .from("heat_messages")
          .insert(
            heatMessageRow({
              thread_id: threadId,
              user_id: user.id,
              sender: "photo",
              image_url: reward.url,
            }),
          )
          .select("*")
          .single();
        if (photoMsg) themMessages.push(photoMsg);
        await supabase.from("heat_threads").update({ reward_photo_sent: true, reward_used: true }).eq("id", threadId);
      } catch (err) {
        console.error("heat reward", err);
      }
    }

    const userCount = prior.filter((m) => m.sender === "user").length + 1;
    const shouldEnd = fade || turn.ended || userCount >= 8;
    let recap = thread.recap;
    const patch: Record<string, unknown> = {
      mood: turn.mood && turn.mood !== "same" ? turn.mood : thread.mood,
      updated_at: new Date().toISOString(),
    };
    if (shouldEnd) {
      const { data: tips } = await supabase
        .from("heat_tips")
        .select("tip, rewrite, score")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      const userLines = [...prior.filter((m) => m.sender === "user").map((m) => String(m.body || "")), text];
      recap = buildRecap({
        scores: [...lastScores, turn.score],
        tips: tips || [],
        userLines,
        mood: (patch.mood as HeatThread["mood"]) || "same",
        heat: thread.heat,
      });
      patch.ended = true;
      patch.status = "ended";
      patch.end_reason = fade ? "fade" : turn.end_reason || "recap";
      patch.recap = recap;
    }
    await supabase.from("heat_threads").update(patch).eq("id", threadId);

    return NextResponse.json({
      userMessage: { ...userMsg, score: turn.score },
      them: themMessages,
      tip,
      turn: {
        score: turn.score,
        mood: turn.mood,
        read_delay_ms: turn.read_delay_ms,
        rewrite: turn.rewrite,
        ended: shouldEnd,
      },
      recap: shouldEnd ? recap : null,
      doubleText,
    });
  } catch (err: unknown) {
    console.error("heat turn", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Turn failed" }, { status: 500 });
  }
}
