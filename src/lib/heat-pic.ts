import { createServiceClient } from "@/lib/supabase/server";
import {
  buildHeatPicPrompt,
  heatPicBillPlan,
  heatPicMayMint,
  lookKey,
  pickHeatPicBeat,
  pickUnusedStill,
  type HeatPoseKind,
  type HeatSettings,
} from "@/lib/heat-check";
import {
  imagineStill,
  imagineStillFromRef,
  phoneStillBytes,
  uploadHeatBytes,
  heatMessageRow,
  withTimeout,
} from "@/lib/heat-check-server";
import { cacheRewardPose } from "@/lib/heat-face-cache";

export { heatPicBillPlan, heatPicMayMint };

const SFW =
  "STRICT SFW. Clothes on. No nudity. No explicit anatomy. No pornography. Face visible. Same fictional adult. Soft lamp. Not a celebrity. No text.";

export async function canSpendHeatCredit(_userId: string, _cost: number) {
  return true;
}

export async function spendHeatCredit(userId: string, cost: number) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("heat_credits").select("extra, free_used_on").eq("user_id", userId).maybeSingle();
  const extra = Number(data?.extra || 0);
  const today = new Date().toISOString().slice(0, 10);
  const freeUsed = data?.free_used_on ? String(data.free_used_on).slice(0, 10) : null;
  const freeLeft = freeUsed === today ? 0 : 1;
  const plan = heatPicBillPlan(extra, cost, freeLeft);
  if (plan.spendExtra > 0) {
    await supabase.from("heat_credits").upsert({
      user_id: userId,
      extra: extra - plan.spendExtra,
      free_used_on: data?.free_used_on || null,
      updated_at: new Date().toISOString(),
    });
    return { billed: plan.spendExtra, extra: extra - plan.spendExtra, free: false };
  }
  if (plan.markFree) {
    await supabase.from("heat_credits").upsert({
      user_id: userId,
      extra,
      free_used_on: today,
      updated_at: new Date().toISOString(),
    });
    return { billed: 0, extra, free: true };
  }
  return { billed: 0, extra, free: true };
}

export async function heatCreditBalance(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("heat_credits").select("extra, free_used_on").eq("user_id", userId).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const freeUsed = data?.free_used_on ? String(data.free_used_on).slice(0, 10) : null;
  return { extra: Number(data?.extra || 0), freeLeft: freeUsed === today ? 0 : 1 };
}

export async function pickPooledPose(look_key: string, kind: HeatPoseKind, used: string[], faceUrl?: string | null) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("heat_pose_pool")
    .select("id, url, path, look_key, pose_kind")
    .eq("look_key", look_key)
    .eq("pose_kind", kind)
    .order("created_at", { ascending: true })
    .limit(16);
  const urls = (data || []).map((r) => String(r.url || "")).filter(Boolean);
  const url = pickUnusedStill(urls, used, faceUrl);
  if (!url) return null;
  return { url };
}

export async function mintPooledPose(opts: {
  userId: string;
  threadId: string;
  look_key: string;
  kind: HeatPoseKind;
  who: string;
  presentation: string;
  appearance: string;
  facePrompt: string;
  faceUrl?: string | null;
  ask?: string;
  mood?: string | null;
  heat?: string | null;
  recent?: string[];
  usedBeats?: string[];
}) {
  const beat = pickHeatPicBeat(opts.usedBeats);
  const prompt = buildHeatPicPrompt({
    who: opts.who,
    presentation: opts.presentation,
    appearance: opts.appearance,
    facePrompt: opts.facePrompt,
    kind: opts.kind,
    ask: opts.ask,
    mood: opts.mood,
    heat: opts.heat,
    recent: opts.recent,
    beat,
  });
  console.info("heat mint start", opts.look_key, opts.kind, beat.id, !!opts.faceUrl);
  let raw: Buffer;
  if (opts.faceUrl) {
    try {
      raw = await imagineStillFromRef(`${prompt} ${SFW}`, opts.faceUrl, "3:4");
    } catch (err) {
      console.error("heat mint ref", err);
      raw = await imagineStill(`${prompt} ${SFW}`, "3:4");
    }
  } else {
    raw = await imagineStill(`${prompt} ${SFW}`, "3:4");
  }
  const bytes = await phoneStillBytes(raw);
  const path = `pool/${opts.look_key.replace(/[^a-z0-9|-]/gi, "_")}/${opts.kind}-${Date.now().toString(36)}.jpg`;
  const up = await uploadHeatBytes({ bucket: "heat-rewards", path, bytes });
  const supabase = createServiceClient();
  const { error: poolErr } = await supabase.from("heat_pose_pool").insert({
    look_key: opts.look_key,
    pose_kind: opts.kind,
    url: up.url,
    path: up.path,
    prompt,
    sfw: true,
  });
  if (poolErr) console.error("heat_pose_pool", poolErr);
  const { error: assetErr } = await supabase.from("heat_assets").insert({
    user_id: opts.userId,
    thread_id: opts.threadId,
    kind: "pose",
    bucket: "heat-rewards",
    path: up.path,
    url: up.url,
    status: "ready",
  });
  if (assetErr) console.error("heat_assets", assetErr);
  return { url: up.url, path: up.path, cached: false, beat: beat.id };
}

export type HeatPicThread = {
  look_key?: string | null;
  they_look?: string | null;
  presentation?: string | null;
  appearance?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  contact_face_url?: string | null;
  mood?: string | null;
  heat?: string | null;
  meta?: { face_prompt?: string; used_pic_beats?: string[] } | null;
};

export function threadLookKey(thread: HeatPicThread) {
  if (thread.contact_id) return `c:${thread.contact_id}`;
  return (
    thread.look_key ||
    lookKey(String(thread.they_look || "woman"), String(thread.presentation || "default"), String(thread.appearance || "any"))
  );
}

export async function findReadyStill(
  thread: HeatPicThread,
  kind: HeatPoseKind,
  settings: HeatSettings,
  used: string[] = [],
) {
  const faceUrl = thread.contact_face_url || null;
  const look_key = threadLookKey(thread);
  if (thread.contact_id) {
    const supabase = createServiceClient();
    const { data: contact } = await supabase
      .from("heat_contacts")
      .select("pose_urls, face_url")
      .eq("id", thread.contact_id)
      .maybeSingle();
    const poses = Array.isArray(contact?.pose_urls)
      ? contact.pose_urls.filter((u: unknown) => typeof u === "string" && u) as string[]
      : [];
    const unused = pickUnusedStill(poses, used, faceUrl || contact?.face_url);
    if (unused) return { url: unused, cached: true, minted: false };
  }
  if (settings.pic_cache) {
    const hit = await pickPooledPose(look_key, kind, used, faceUrl);
    if (hit?.url) return { url: String(hit.url), cached: true, minted: false };
  }
  return null;
}

export async function deliverHeatPic(opts: {
  userId: string;
  threadId: string;
  kind: HeatPoseKind;
  ask?: string;
  settings: HeatSettings;
  thread: HeatPicThread;
  mint?: boolean;
  usedUrls?: string[];
  recent?: string[];
}) {
  const look_key = threadLookKey(opts.thread);
  const used = opts.usedUrls || [];
  let found = await findReadyStill(opts.thread, opts.kind, opts.settings, used);
  let beatId: string | null = null;
  if (!found && opts.mint !== false) {
    try {
      const minted = await withTimeout(
        mintPooledPose({
          userId: opts.userId,
          threadId: opts.threadId,
          look_key,
          kind: opts.kind,
          who: String(opts.thread.they_look || "woman"),
          presentation: String(opts.thread.presentation || "default"),
          appearance: String(opts.thread.appearance || "any"),
          facePrompt: String(opts.thread.meta?.face_prompt || opts.thread.contact_name || "fictional adult"),
          faceUrl: opts.thread.contact_face_url,
          ask: opts.ask,
          mood: opts.thread.mood,
          heat: opts.thread.heat,
          recent: opts.recent,
          usedBeats: Array.isArray(opts.thread.meta?.used_pic_beats) ? opts.thread.meta.used_pic_beats : [],
        }),
        54000,
        "still timed out",
      );
      found = { url: minted.url, cached: false, minted: true };
      beatId = minted.beat;
    } catch (err) {
      console.error("heat mint", err);
      found = await findReadyStill(opts.thread, opts.kind, { ...opts.settings, pic_cache: true }, used);
      if (!found) throw new Error("That still took too long. Ask again in a second.");
    }
  }
  if (!found) return null;
  const supabase = createServiceClient();
  const { data: photoMsg, error: msgErr } = await supabase
    .from("heat_messages")
    .insert(
      heatMessageRow({
        thread_id: opts.threadId,
        user_id: opts.userId,
        sender: "photo",
        image_url: found.url,
      }),
    )
    .select("*")
    .single();
  if (msgErr) throw new Error(msgErr.message);
  if (found.url !== opts.thread.contact_face_url) {
    await cacheRewardPose(opts.thread.contact_id || null, found.url);
  }
  if (beatId) {
    const { data: row } = await supabase.from("heat_threads").select("meta").eq("id", opts.threadId).maybeSingle();
    const meta = row?.meta && typeof row.meta === "object" ? { ...(row.meta as Record<string, unknown>) } : { ...(opts.thread.meta || {}) };
    const prior = Array.isArray(meta.used_pic_beats) ? (meta.used_pic_beats as string[]) : [];
    meta.used_pic_beats = [...prior, beatId].slice(-12);
    await supabase.from("heat_threads").update({ meta, updated_at: new Date().toISOString() }).eq("id", opts.threadId);
  }
  return { url: found.url, cached: found.cached, minted: !!found.minted, message: photoMsg };
}

export async function grantHeatCredits(userId: string, add: number) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("heat_credits").select("extra").eq("user_id", userId).maybeSingle();
  const extra = Math.max(0, Number(data?.extra || 0) + add);
  await supabase.from("heat_credits").upsert({
    user_id: userId,
    extra,
    updated_at: new Date().toISOString(),
  });
  return extra;
}
