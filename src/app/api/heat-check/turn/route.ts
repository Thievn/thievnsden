import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";
import { grokHeatJson, grokHeatTurn, imagineHeatBytes, loadHeatSettings, mayPlayHeat, threadSetupLine, uploadHeatBytes } from "@/lib/heat-check-server";
import { blocksMinors, isFade, type HeatRecap } from "@/lib/heat-check";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  const supabase = createServiceClient();
  const { data: thread } = await supabase.from("heat_threads").select("*").eq("id", id).maybeSingle();
  if (!thread || thread.user_id !== user.id) return NextResponse.json({ error: "No" }, { status: 404 });
  const { data: messages } = await supabase
    .from("heat_messages")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });
  const { data: tips } = await supabase.from("heat_tips").select("*").eq("thread_id", id);
  return NextResponse.json({ thread, messages: messages || [], tips: tips || [] });
}

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const settings = await loadHeatSettings();
  if (!(await mayPlayHeat(user, settings))) return NextResponse.json({ error: "Coming soon." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const threadId = String(body.threadId || "");
  const text = String(body.body || "").trim().slice(0, 1000);
  const doubleText = !!body.double_text;
  if (!threadId || !text) return NextResponse.json({ error: "Say something." }, { status: 400 });
  if (blocksMinors(text)) {
    return NextResponse.json({ error: "That scene is closed.", refused: true }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: thread } = await supabase.from("heat_threads").select("*").eq("id", threadId).maybeSingle();
  if (!thread || thread.user_id !== user.id) return NextResponse.json({ error: "No" }, { status: 403 });
  if (thread.status !== "active") return NextResponse.json({ error: "This thread already closed." }, { status: 400 });

  const { data: userMsg } = await supabase
    .from("heat_messages")
    .insert({ thread_id: threadId, role: "user", body: text })
    .select()
    .single();

  const { data: historyRows } = await supabase
    .from("heat_messages")
    .select("role, body")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(40);
  const history = (historyRows || [])
    .map((m) => `${m.role === "user" ? "PLAYER" : m.role === "them" ? "THEM" : "SYS"}: ${m.body || ""}`)
    .join("\n");

  const { data: userMsgs } = await supabase
    .from("heat_messages")
    .select("id")
    .eq("thread_id", threadId)
    .eq("role", "user");
  const userCount = (userMsgs || []).length;

  const { data: recentTips } = await supabase
    .from("heat_tips")
    .select("score")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(8);
  const lastThree = (recentTips || []).slice(0, 3).map((t) => Number(t.score) || 0);
  const earned =
    lastThree.length >= 3 && lastThree.every((s) => s >= (settings.reward_threshold || 8)) && !thread.reward_used;

  const fade = isFade(text);
  const turn = await grokHeatTurn({
    settings,
    setup: threadSetupLine({
      role: thread.role,
      heat: thread.heat,
      voice: thread.voice,
      they_start: thread.they_start,
      contact_name: thread.contact_name,
      mood: thread.mood,
      user_photo: !!thread.user_photo_url,
    }),
    history,
    lastUser: text,
    extra: `${doubleText ? "They double-texted while unread. Flag it in the tip." : ""}
${fade ? "Player typed FADE. Wind down. ended true." : ""}
${earned ? "Last three player scores were high. You MAY set reward_photo true once." : "reward_photo must be false."}
User message count: ${userCount}.`,
  });

  if (blocksMinors(turn.scene)) {
    await supabase.from("heat_threads").update({ status: "ended" }).eq("id", threadId);
    return NextResponse.json({ error: "That scene is closed.", refused: true }, { status: 400 });
  }

  if (userMsg) {
    await supabase.from("heat_tips").insert({
      message_id: userMsg.id,
      thread_id: threadId,
      score: turn.score,
      tip: turn.tip,
      rewrite: turn.rewrite,
    });
  }

  let themMsg = null;
  if (turn.scene) {
    const { data } = await supabase
      .from("heat_messages")
      .insert({ thread_id: threadId, role: "them", body: turn.scene })
      .select()
      .single();
    themMsg = data;
  }

  let rewardUrl: string | null = null;
  if (turn.reward_photo && earned && !thread.reward_used) {
    try {
      const bytes = await imagineHeatBytes(
        `Photoreal adult 25-35, same person as a dim phone portrait named ${thread.contact_name}, sexier pose, SFW-sexy, clothes on, no nudity, no celebrity likeness, no text, indoor night, crimson lamp. Not hardcore.`,
        "3:4"
      );
      rewardUrl = await uploadHeatBytes({
        bucket: "heat-rewards",
        path: `${user.id}/${threadId}-${Date.now().toString(36)}.jpg`,
        bytes,
        contentType: "image/jpeg",
      });
      await supabase.from("heat_messages").insert({
        thread_id: threadId,
        role: "them",
        body: "",
        image_url: rewardUrl,
      });
      await supabase.from("heat_threads").update({ reward_used: true }).eq("id", threadId);
    } catch {
      rewardUrl = null;
    }
  }

  const shouldRecap = fade || turn.ended || userCount >= 8;
  let recap: HeatRecap | null = null;
  if (shouldRecap) {
    recap = await buildRecap(history, thread.heat);
    await supabase.from("heat_threads").update({
      status: "recap",
      recap,
      mood: turn.mood === "same" ? thread.mood : turn.mood,
      updated_at: new Date().toISOString(),
    }).eq("id", threadId);
  } else if (turn.mood && turn.mood !== "same") {
    await supabase.from("heat_threads").update({ mood: turn.mood, updated_at: new Date().toISOString() }).eq("id", threadId);
  } else {
    await supabase.from("heat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
  }

  return NextResponse.json({
    userMessage: userMsg,
    themMessage: themMsg,
    turn,
    rewardUrl,
    recap,
    status: shouldRecap ? "recap" : "active",
  });
}

async function buildRecap(history: string, heat: string): Promise<HeatRecap> {
  try {
    const parsed = await grokHeatJson({
      system: "JSON only. Recap a dirty text thread for the player. Clean language on best_line. No markdown.",
      user: `Heat ${heat}. Thread:\n${history}\nReturn {"heat":"one sentence","pacing":"one sentence","cringe":"one sentence","mood":"one sentence","best_line":"one CLEAN quote from the player"}`,
      maxTokens: 400,
    });
    return {
      heat: String(parsed.heat || "").slice(0, 180),
      pacing: String(parsed.pacing || "").slice(0, 180),
      cringe: String(parsed.cringe || "").slice(0, 180),
      mood: String(parsed.mood || "").slice(0, 180),
      best_line: String(parsed.best_line || "").slice(0, 180),
    };
  } catch {
    return {
      heat: "The temperature was there.",
      pacing: "You kept sending.",
      cringe: "A couple of swings missed.",
      mood: "You mostly stayed with them.",
      best_line: "",
    };
  }
}
