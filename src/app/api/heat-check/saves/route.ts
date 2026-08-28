import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { userFromRequest } from "@/lib/auth-request";

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") || "";
  const supabase = createServiceClient();
  let query = supabase
    .from("heat_saves")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (q.trim()) query = query.ilike("line", `%${q.trim()}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ saves: [], error: error.message });
  return NextResponse.json({ saves: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const body = await req.json();
  const line = String(body.line || "").trim();
  if (!line) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("heat_saves")
    .insert({
      user_id: user.id,
      thread_id: body.threadId || null,
      source_thread: body.threadId || null,
      line: line.slice(0, 500),
      body: line.slice(0, 500),
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ save: data });
}
