import { createServiceClient } from "@/lib/supabase/server";
import { imageFacePrompt, lookKey, resolvePresentation } from "@/lib/heat-check";
import { generateContactFace, withTimeout } from "@/lib/heat-check-server";

export type FacePick = {
  look_key: string;
  presentation: string;
  appearance: string;
  contact_id: string | null;
  contact_name?: string | null;
  face_url: string | null;
  face_prompt: string;
  mint: boolean;
};

export async function pickHeatFace(opts: {
  userId: string;
  who: string;
  presentation: string;
  appearance: string;
  name: string;
  generate: boolean;
  newContact: boolean;
}): Promise<FacePick> {
  const presentation = resolvePresentation(opts.who, opts.presentation);
  const appearance = opts.appearance || "any";
  const key = lookKey(opts.who, presentation, appearance);
  const face_prompt = imageFacePrompt(opts.who, presentation, appearance);
  const empty: FacePick = {
    look_key: key,
    presentation,
    appearance,
    contact_id: null,
    face_url: null,
    face_prompt,
    mint: false,
  };
  if (!opts.generate) return empty;

  const supabase = createServiceClient();
  const { data: pool } = await supabase
    .from("heat_contacts")
    .select("id, name, face_url, look_key, created_at")
    .eq("user_id", opts.userId)
    .eq("look_key", key)
    .order("created_at", { ascending: true })
    .limit(3);
  const rows = (pool || []).filter((r) => r.face_url);

  const { data: lastNight } = await supabase
    .from("heat_threads")
    .select("contact_id")
    .eq("user_id", opts.userId)
    .eq("look_key", key)
    .not("contact_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastId = lastNight?.contact_id || null;
  const last = rows.find((r) => r.id === lastId) || null;

  if (!opts.newContact && last?.face_url) {
    return {
      ...empty,
      contact_id: last.id,
      contact_name: last.name,
      face_url: last.face_url,
      mint: false,
    };
  }

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("heat_contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", opts.userId)
    .gte("created_at", start.toISOString());
  const mintedToday = count || 0;

  if (opts.newContact) {
    const others = rows.filter((r) => r.id !== lastId);
    if (rows.length < 3 && mintedToday < 1) {
      return { ...empty, mint: true };
    }
    const pick = others[0] || rows[0];
    if (pick?.face_url) {
      return {
        ...empty,
        contact_id: pick.id,
        contact_name: pick.name,
        face_url: pick.face_url,
        mint: false,
      };
    }
    return empty;
  }

  if (rows[0]?.face_url) {
    const pick = rows[Math.floor(Math.random() * rows.length)];
    return {
      ...empty,
      contact_id: pick.id,
      contact_name: pick.name,
      face_url: pick.face_url,
      mint: false,
    };
  }

  if (!rows.length) return { ...empty, mint: true };
  if (mintedToday < 1) return { ...empty, mint: true };
  return empty;
}

export async function mintHeatContact(opts: {
  userId: string;
  threadId: string;
  name: string;
  who: string;
  presentation: string;
  appearance: string;
  look_key: string;
  face_prompt: string;
}) {
  const face = await withTimeout(
    generateContactFace(opts.userId, "", {
      who: opts.who,
      presentation: opts.presentation,
      appearance: opts.appearance,
      threadId: opts.threadId,
    }),
    25000,
    "Face gen timed out",
  );
  const supabase = createServiceClient();
  const { data: contact } = await supabase
    .from("heat_contacts")
    .insert({
      user_id: opts.userId,
      name: opts.name,
      look_key: opts.look_key,
      presentation: opts.presentation,
      appearance: opts.appearance,
      face_url: face.url,
      pose_urls: [],
    })
    .select("id, face_url")
    .single();
  await supabase
    .from("heat_threads")
    .update({
      contact_face_url: face.url,
      contact_id: contact?.id || null,
      meta: { face_prompt: face.prompt, look: opts.who, presentation: opts.presentation, appearance: opts.appearance },
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.threadId);
  return { contact_id: contact?.id || null, url: face.url, prompt: face.prompt };
}

export async function cacheRewardPose(contactId: string | null, url: string) {
  if (!contactId) return;
  const supabase = createServiceClient();
  const { data } = await supabase.from("heat_contacts").select("pose_urls").eq("id", contactId).maybeSingle();
  const poses = Array.isArray(data?.pose_urls) ? data.pose_urls : [];
  await supabase.from("heat_contacts").update({ pose_urls: [...poses, url] }).eq("id", contactId);
}