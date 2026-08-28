import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const text = String(body.body || "").trim().slice(0, 500);
  if (!text) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("heat_saves")
    .insert({ user_id: user.id, body: text, source_thread: body.threadId || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ save: data });
}

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") || "";
  const supabase = createServiceClient();
  let query = supabase.from("heat_saves").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(80);
  if (q.trim()) query = query.ilike("body", `%${q.trim().slice(0, 40)}%`);
  const { data } = await query;
  return NextResponse.json({ saves: data || [] });
}

export async function DELETE(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const supabase = createServiceClient();
  await supabase.from("heat_saves").delete().eq("id", body.id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
