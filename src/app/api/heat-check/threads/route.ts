import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireHeatPlayer } from "@/lib/heat-check-server";
import { userFromRequest } from "@/lib/auth-request";

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("heat_threads")
    .select("id, contact_name, contact_face_url, role, heat, voice, skin, ended, end_reason, last_seen_label, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) return NextResponse.json({ threads: [], error: error.message });
  return NextResponse.json({ threads: data || [] });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHeatPlayer(req);
  if ("error" in ctx && ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const body = await req.json();
  const threadId = String(body.threadId || "");
  if (!threadId) return NextResponse.json({ error: "threadId" }, { status: 400 });
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.skin === "ios" || body.skin === "android") patch.skin = body.skin;
  if (typeof body.peek === "boolean") patch.peek = body.peek;
  const { data, error } = await supabase
    .from("heat_threads")
    .update(patch)
    .eq("id", threadId)
    .eq("user_id", ctx.user!.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ thread: data });
}
