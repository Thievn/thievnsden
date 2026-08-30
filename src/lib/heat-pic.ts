import { createServiceClient } from "@/lib/supabase/server";
import {
  HEAT_POSE_KINDS,
  lookKey,
  type HeatPoseKind,
  type HeatSettings,
} from "@/lib/heat-check";
import { squareFaceBytes, imagineStill, uploadHeatBytes, heatMessageRow, withTimeout } from "@/lib/heat-check-server";
import { cacheRewardPose } from "@/lib/heat-face-cache";

const SFW =
  "STRICT SFW. Clothes on. No nudity. No explicit anatomy. No pornography. Face visible. Same fictional adult. Soft lamp. Not a celebrity. No text.";

export async function spendHeatCredit(userId: string, cost: number) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("heat_credits").select("extra, free_used_on").eq("user_id", userId).maybeSingle();
  const extra = Number(data?.extra || 0);
  const today = new Date().toISOString().slice(0, 10);
  const freeUsed = data?.free_used_on ? String(data.free_used_on).slice(0, 10) : null;
  if (extra >= cost) {
    await supabase.from("heat_credits").upsert({
      user_id: userId,
      extra: extra - cost,
      free_used_on: data?.free_used_on || null,
      updated_at: new Date().toISOString(),
    });
    return { billed: cost, extra: extra - cost, free: false };
  }
  if (cost <= 1 && freeUsed !== today) {
    await supabase.from("heat_credits").upsert({
      user_id: userId,
      extra,
      free_used_on: today,
      updated_at: new Date().toISOString(),
    });
    return { billed: 0, extra, free: true };
  }
  throw new Error("Need a credit for that still.");
}

export async function heatCreditBalance(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("heat_credits").select("extra, free_used_on").eq("user_id", userId).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const freeUsed = data?.free_used_on ? String(data.free_used_on).slice(0, 10) : null;
  return { extra: Number(data?.extra || 0), freeLeft: freeUsed === today ? 0 : 1 };
}

export async function pickPooledPose(look_key: string, kind: HeatPoseKind) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("heat_pose_pool")
    .select("id, url, path, look_key, pose_kind")
    .eq("look_key", look_key)
    .eq("pose_kind", kind)
    .order("created_at", { ascending: true })
    .limit(8);
  const rows = (data || []).filter((r) => r.url);
  if (!rows.length) return null;
  return rows[Math.floor(Math.random() * rows.length)];
}

export async function pickAnyPooledPose(look_key: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("heat_pose_pool")
    .select("id, url, path, look_key, pose_kind")
    .eq("look_key", look_key)
    .eq("sfw", true)
    .order("created_at", { ascending: true })
    .limit(12);
  const rows = (data || []).filter((r) => r.url);
  if (!rows.length) return null;
  return rows[Math.floor(Math.random() * rows.length)];
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
}) {
  const pose = HEAT_POSE_KINDS.find((p) => p.id === opts.kind) || HEAT_POSE_KINDS[0];
  const prompt = `${opts.facePrompt} ${pose.line}. ${SFW}`;
  const raw = await imagineStill(prompt, "1:1");
  const bytes = await squareFaceBytes(raw);
  const path = `pool/${opts.look_key}/${opts.kind}-${Date.now().toString(36)}.jpg`;
  const up = await uploadHeatBytes({ bucket: "heat-rewards", path, bytes });
  const supabase = createServiceClient();
  await supabase.from("heat_pose_pool").insert({
    look_key: opts.look_key,
    pose_kind: opts.kind,
    url: up.url,
    path: up.path,
    prompt,
    sfw: true,
  });
  await supabase.from("heat_assets").insert({
    user_id: opts.userId,
    thread_id: opts.threadId,
    kind: "pose",
    bucket: "heat-rewards",
    path: up.path,
    url: up.url,
    status: "ready",
  });
  return { url: up.url, path: up.path, cached: false };
}

export async function deliverHeatPic(opts: {
  userId: string;
  threadId: string;
  kind: HeatPoseKind;
  ask?: string;
  settings: HeatSettings;
  thread: {
    look_key?: string | null;
    they_look?: string | null;
    presentation?: string | null;
    appearance?: string | null;
    contact_id?: string | null;
    contact_name?: string | null;
    contact_face_url?: string | null;
    meta?: { face_prompt?: string } | null;
  };
}) {
  const look_key =
    opts.thread.look_key ||
    lookKey(String(opts.thread.they_look || "woman"), String(opts.thread.presentation || "default"), String(opts.thread.appearance || "any"));
  let hit = opts.settings.pic_cache ? await pickPooledPose(look_key, opts.kind) : null;
  if (!hit && opts.settings.pic_cache) hit = await pickAnyPooledPose(look_key);
  let url = hit?.url || null;
  let cached = !!hit;
  if (!url && opts.thread.contact_id) {
    const supabase = createServiceClient();
    const { data: contact } = await supabase
      .from("heat_contacts")
      .select("pose_urls, face_url")
      .eq("id", opts.thread.contact_id)
      .maybeSingle();
    const poses = Array.isArray(contact?.pose_urls) ? contact.pose_urls.filter((u: unknown) => typeof u === "string") : [];
    if (poses.length) {
      url = String(poses[Math.floor(Math.random() * poses.length)]);
      cached = true;
    } else if (contact?.face_url) {
      url = String(contact.face_url);
      cached = true;
    }
  }
  if (!url && opts.thread.contact_face_url) {
    url = opts.thread.contact_face_url;
    cached = true;
  }
  if (!url) {
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
        }),
        38000,
        "still timed out",
      );
      url = minted.url;
      cached = false;
    } catch (err) {
      console.error("heat mint", err);
      throw new Error("That still took too long. Ask again in a second.");
    }
  }
  const supabase = createServiceClient();
  const { data: photoMsg } = await supabase
    .from("heat_messages")
    .insert(
      heatMessageRow({
        thread_id: opts.threadId,
        user_id: opts.userId,
        sender: "photo",
        image_url: url,
      }),
    )
    .select("*")
    .single();
  await cacheRewardPose(opts.thread.contact_id || null, url);
  return { url, cached, message: photoMsg };
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
