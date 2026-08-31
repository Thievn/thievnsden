import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { userFromRequest } from "@/lib/auth-request";

function heatStorageFromUrl(url?: string | null) {
  const m = String(url || "").match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (!m) return null;
  return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const { id } = await ctx.params;
  const supabase = createServiceClient();
  const { data: thread } = await supabase
    .from("heat_threads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { data: messages } = await supabase
    .from("heat_messages")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });
  const { data: tips } = await supabase
    .from("heat_tips")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });
  return NextResponse.json({ thread, messages: messages || [], tips: tips || [] });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const { id } = await ctx.params;
  const supabase = createServiceClient();
  const { data: thread } = await supabase
    .from("heat_threads")
    .select("id, user_id, contact_face_url, user_photo_path, meta")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: assets } = await supabase.from("heat_assets").select("bucket, path").eq("thread_id", id);
  const { data: pics } = await supabase.from("heat_messages").select("image_url").eq("thread_id", id).not("image_url", "is", null);
  const files = new Map<string, Set<string>>();
  const addFile = (bucket: string | null | undefined, path: string | null | undefined) => {
    if (!bucket || !path) return;
    const set = files.get(bucket) || new Set<string>();
    set.add(path);
    files.set(bucket, set);
  };
  for (const a of assets || []) addFile(a.bucket, a.path);
  for (const row of pics || []) {
    const parsed = heatStorageFromUrl(row.image_url);
    if (parsed && parsed.bucket !== "heat-faces") addFile(parsed.bucket, parsed.path);
  }
  if (thread.user_photo_path) {
    addFile("heat-uploads", thread.user_photo_path);
    addFile("heat-faces", thread.user_photo_path);
  }
  for (const [bucket, paths] of files) {
    await supabase.storage.from(bucket).remove([...paths]);
  }
  await supabase.from("heat_assets").delete().eq("thread_id", id);
  await supabase.from("heat_tips").delete().eq("thread_id", id);
  await supabase.from("heat_saves").delete().eq("thread_id", id);
  await supabase.from("heat_messages").delete().eq("thread_id", id);
  await supabase.from("heat_threads").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = {};
  if (body.action === "read") {
    const ids: string[] = Array.isArray(body.messageIds) ? body.messageIds : [];
    if (ids.length) {
      await supabase
        .from("heat_messages")
        .update({ read_at: new Date().toISOString(), delivered_at: new Date().toISOString() })
        .in("id", ids)
        .eq("user_id", user.id)
        .eq("sender", "user");
    }
    return NextResponse.json({ ok: true });
  }
  if (body.action === "delivered") {
    const ids: string[] = Array.isArray(body.messageIds) ? body.messageIds : [];
    if (ids.length) {
      await supabase
        .from("heat_messages")
        .update({ delivered_at: new Date().toISOString() })
        .in("id", ids)
        .eq("user_id", user.id);
    }
    return NextResponse.json({ ok: true });
  }
  if (body.skin === "ios" || body.skin === "android") patch.skin = body.skin;
  if (typeof body.peek === "boolean") patch.peek = body.peek;
  if (body.action === "my-face") {
    patch.user_photo_path = body.path || null;
    patch.user_photo_url = body.url || null;
  }
  if (body.action === "remove-face") {
    patch.user_photo_path = null;
    patch.user_photo_url = null;
  }
  if (body.action === "resume") {
    patch.ended = false;
    patch.status = "active";
    patch.end_reason = null;
  }
  if (Object.keys(patch).length) {
    patch.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("heat_threads")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ thread: data });
  }
  return NextResponse.json({ ok: true });
}
